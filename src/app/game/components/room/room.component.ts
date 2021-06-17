import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs'
import { filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables, mapGameInfoPointers, GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { Account } from 'src/app/models/account'
import { ApiService } from 'src/app/services/api.service'

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
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  private gameInfoQuery: QueryRef<GetGameInfoQueryResult, GetGameInfoQueryVariables>
  private _accountId: Account['_id']
  accountId$: Observable<Account['_id']>
  frame$ = new ReplaySubject<Frame>(1)
  shortcuts$: Observable<Shortcut[]>
  gameInfo$: Observable<GameInfo>
  loadingGameInfo: boolean

  constructor(
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.setAccountId$()
    this.activatedRoute.parent.params.subscribe(async params => {
      this.setGameInfo$(params.gameId)
      await this.setupFrame()
      this.setShortcuts$()
    })
  }

  private setAccountId$() {
    this.accountId$ = new Observable(sub => {
      of(this._accountId).pipe(
        switchMap(cachedAccount => {
          return cachedAccount ? of(cachedAccount) : this.apiService.getAccountId().pipe(
            map(({ _id }) => this._accountId = _id)
          )
        })
      ).subscribe(sub)
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
      shareReplay(1)
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
    return this.accountId$.pipe(
      map(loggedInUserAccountId => {
        const shortcuts: (Shortcut & { playerCount: number })[] = gameInfo.chats.map(chat => {
          const isImgShortcut = chat.players.length == 2
          const shortcut: Shortcut = {
            type: isImgShortcut ? 'img' : 'text',
            text: chat.name,
            title: `Go to ${chat.name}`,
            onClick: () => this.switchFrame({ type: 'chat', docId: chat._id })
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
    return this.accountId$.pipe(
      map(loggedInUserAccountId => {
        const shortcuts: (Shortcut & { playerAccountId: Player['account']['_id'] })[] = gameInfo.players
          .filter(player => player.account._id != gameInfo.hostAccount._id)
          .map(player => {
            return {
              type: 'img',
              text: player.name,
              title: `View ${player.name}'s profile`,
              onClick: () => this.switchFrame({ type: 'bio', docId: player._id }),
              src: player.photo.uri,
              alt: `${player.name}'s photo`,
              playerAccountId: player.account._id
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
      filter(curFrame => curFrame.type != newFrame.type || curFrame.docId != newFrame.docId),
      tap(() => this.frame$.next(newFrame))
    ).toPromise()
  }

  onGameInfoChanged() {
    this.gameInfoQuery.refetch()
  }

}
