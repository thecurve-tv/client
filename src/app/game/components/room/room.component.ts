import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs'
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables, mapGameInfoPointers, GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { Account } from 'src/app/models/account'
import { ApiService } from 'src/app/services/api.service'
import { PopupService } from 'src/app/services/popup.service'
import { environment } from 'src/environments/environment'

export interface Frame {
  type: 'bio' | 'chat' | 'ranking'
  docId?: string
}

export interface Shortcut {
  type: 'img' | 'text'
  text: string
  title: string
  src?: string
  alt?: string
  onClick: () => void
  isActive: (frame: Frame) => boolean
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  private gameInfoQuery: QueryRef<GetGameInfoQueryResult, GetGameInfoQueryVariables>
  account$: Observable<Account>
  frame$ = new ReplaySubject<Frame>(1)
  shortcuts$: Observable<Shortcut[]>
  gameInfo$: Observable<GameInfo>
  /**
   * Emits {@link GameInfo} if the logged in user is the host of the game.
   * Emits `undefined` otherwise.
   */
  hostGameInfo$: Observable<GameInfo | undefined>
  loadingGameInfo: boolean
  isHost: boolean

  constructor(
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private apiService: ApiService,
    private popupService: PopupService
  ) { }

  ngOnInit() {
    this.account$ = this.apiService.getAccountId().pipe(
      shareReplay({bufferSize: 1, refCount: true})
    )
    this.activatedRoute.parent.params.subscribe(async params => {
      this.setGameInfo$(params.gameId)
      this.hostGameInfo$ = combineLatest([this.account$, this.gameInfo$]).pipe(
        map(([account, gameInfo]) => {
          this.isHost = account._id == gameInfo.hostAccount._id
          return this.isHost ? gameInfo : undefined
        })
      )
      await this.setupFrame()
      this.setShortcuts$()
    })
  }

  private setGameInfo$(gameId: string) {
    if (this.gameInfoQuery) return
    this.gameInfoQuery = getGameInfo(this.apollo, { gameId }, 60 * 1000)
    this.loadingGameInfo = true
    this.gameInfo$ = this.gameInfoQuery.valueChanges.pipe(
      tap(({ loading }) => this.loadingGameInfo = loading),
      filter(({ loading }) => !loading),
      map(({ data }) => data),
      mapGameInfoPointers(),
      shareReplay({bufferSize: 1, refCount: true})
    )
  }

  private async setupFrame() {
    await this.gameInfo$.pipe(
      take(1),
      map(gameInfo => {
        this.frame$.next({
          type: 'chat',
          docId: gameInfo.mainChat._id
        })
      })
    ).toPromise()
  }

  private setShortcuts$() {
    this.shortcuts$ = combineLatest([this.frame$, this.gameInfo$]).pipe(
      switchMap(([frame, gameInfo]) => {
        if (frame.type == 'chat') return this.getShortcutsForChatFrame(gameInfo)
        if (frame.type == 'bio') return this.getShortcutsForBioFrame(gameInfo)
        return of(undefined)
      })
    )
  }

  private getShortcutsForChatFrame(gameInfo: GameInfo): Observable<Shortcut[]> {
    return this.account$.pipe(
      map(({ _id: loggedInUserAccountId }) => {
        const shortcuts: (Shortcut & { playerCount: number })[] = gameInfo.chats.map(chat => {
          const isImgShortcut = chat.players.length == 2 && chat._id != gameInfo.mainChat._id
          const shortcut: Shortcut = {
            type: isImgShortcut ? 'img' : 'text',
            text: chat.name,
            title: `Go to ${chat.name}`,
            onClick: () => this.switchFrame({ type: 'chat', docId: chat._id }),
            isActive: frame => frame.type == 'chat' && frame.docId == chat._id
          }
          if (isImgShortcut) {
            const otherParticipant = chat.players
              .map(p => gameInfo.playerById.get(p._id))
              .find(p => p.account._id != loggedInUserAccountId)
            shortcut.src = otherParticipant.photo.uri
            shortcut.alt = `${otherParticipant.name}'s photo`
          }
          return { ...shortcut, playerCount: chat.players.length }
        })
        return shortcuts.sort((a, b) => {
          if (a.playerCount > b.playerCount) return -1
          if (b.playerCount > a.playerCount) return 1
          return a.text.localeCompare(b.text)
        })
      })
    )
  }

  private getShortcutsForBioFrame(gameInfo: GameInfo): Observable<Shortcut[]> {
    return this.account$.pipe(
      map(({ _id: loggedInUserAccountId }) => {
        const shortcuts: (Shortcut & { playerAccountId: Player['account']['_id'] })[] = gameInfo.players
          .filter(player => player.account._id != gameInfo.hostAccount._id)
          .map(player => {
            return {
              type: 'img',
              text: player.name,
              title: `View ${player.name}'s profile`,
              src: player.photo.uri,
              alt: `${player.name}'s photo`,
              playerAccountId: player.account._id,
              onClick: () => this.switchFrame({ type: 'bio', docId: player._id }),
              isActive: frame => frame.type == 'bio' && frame.docId == player._id
            }
          })
        return shortcuts.sort((a, b) => {
          if (a.playerAccountId == loggedInUserAccountId) return -1
          if (b.playerAccountId == loggedInUserAccountId) return 1
          return a.text.localeCompare(b.text)
        })
      })
    )
  }

  async switchFrame(newFrame: Frame) {
    await this.frame$.pipe(
      take(1),
      filter(curFrame => {
        const frameIsIdentical = curFrame.type == newFrame.type && curFrame.docId == newFrame.docId
        return !frameIsIdentical
      }),
      tap(() => this.frame$.next(newFrame))
    ).toPromise()
  }

  onInviteClick(game: GameInfo) {
    const joinUrl = `${environment.CLIENT_URL}/game/${game._id}/join`
    this.popupService.newPopup({
      type: 'info',
      message: `Invite players by sending them this link\n${joinUrl}`
    })
  }

  onGameInfoChanged() {
    this.gameInfoQuery.refetch()
  }

}
