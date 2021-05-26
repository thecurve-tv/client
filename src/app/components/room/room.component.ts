import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs'
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables } from 'src/app/graphql/get-game-info.query'
import { Account } from 'src/app/models/account'
import { ApiService } from 'src/app/services/api.service'

export type Chat = Omit<GetGameInfoQueryResult['gameById']['chats'][0], 'players'> & {
  players: GetGameInfoQueryResult['gameById']['players']
}
export type GameInfo = Omit<GetGameInfoQueryResult['gameById'], 'chats'> & {
  chats: Chat[]
}
export type Player = GameInfo['players'][0]

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
    this.gameInfoQuery = getGameInfo(this.apollo, { gameId }, 60 * 1000)
    this.loadingGameInfo = true
    this.gameInfo$ = this.gameInfoQuery.valueChanges.pipe(
      map(({ loading, data }) => {
        if (loading) this.loadingGameInfo = true
        return { loading, data }
      }),
      filter(({ loading }) => !loading),
      map(({ data }) => {
        const result = data.gameById
        const players = result.players.map(player => {
          if (player.photo) return player
          return { // avoid read-only restriction
            ...player,
            photo: {
              _id: null,
              uri: '/assets/default-profile-photo.png',
              alt: 'Default profile photo'
            }
          }
        })
        const chats: Chat[] = result.chats.map(chat => {
          const chatPlayerIds = new Set(chat.players.map(cp => cp._id))
          const playersInChat = players.filter(player => chatPlayerIds.has(player._id))
          return { // avoid read-only restriction
            ...chat,
            players: playersInChat
          }
        })
        const gameInfo: GameInfo = { // avoid read-only restriction
          ...result,
          players,
          chats
        }
        return gameInfo
      }),
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
            onClick: () => this.switchFrame('chat', chat._id)
          }
          if (isImgShortcut) {
            const otherParticipant = chat.players.find(player => player.account._id != loggedInUserAccountId)
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
              onClick: () => this.switchFrame('bio', player._id),
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

  async switchFrame(type: Frame['type'], docId?: string) {
    await this.frame$.pipe(
      take(1),
      map(curFrame => {
        if (curFrame.type == type && curFrame.docId == docId) {
          return // nothing to change
        }
        const newFrame: Frame = {
          type,
          docId
        }
        this.frame$.next(newFrame)
      })
    ).toPromise()
  }

  onGameInfoChanged() {
    this.gameInfoQuery.refetch()
  }

}
