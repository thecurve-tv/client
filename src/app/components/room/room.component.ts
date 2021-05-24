import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { Observable, of, ReplaySubject } from 'rxjs'
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

export interface Frame {
  type: 'bio' | 'chat' | 'ranking'
  gameInfo: GameInfo
  docId?: string
}

export interface Shortcut {
  type: 'img' | 'text'
  src?: string
  alt?: string
  text?: string
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
  shortcuts$ = new ReplaySubject<Shortcut[]>(1)
  gameInfo$: Observable<GameInfo>
  loadingGameInfo: boolean

  constructor(
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.setAccountId$()
    this.activatedRoute.parent.params.subscribe(params => {
      this.setGameInfo$(params.gameId)
      this.gameInfo$.pipe(
        take(1),
        switchMap(gameInfo => {
          this.frame$.next({
            type: 'chat',
            gameInfo,
            docId: gameInfo.mainChat._id
          })
          return this.getShortcutsForChatFrame(gameInfo).pipe(
            map(shortcuts => this.shortcuts$.next(shortcuts))
          )
        })
      ).subscribe()
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
        const chats: Chat[] = result.chats.map(chat => {
          const chatPlayerIds = new Set(chat.players.map(cp => cp._id))
          const playersInChat = result.players.filter(player => chatPlayerIds.has(player._id))
          return <Chat>{
            ...chat,
            players: playersInChat
          }
        })
        const gameInfo: GameInfo = {
          ...result,
          chats
        }
        return gameInfo
      }),
      map(_gameInfo => { // set default photo
        const gameInfo = { ..._gameInfo } // avoid read-only restriction
        gameInfo.players = gameInfo.players.map(_player => {
          if (_player.photo != null) return _player
          const player = { ..._player }
          player.photo = {
            _id: null,
            uri: '/assets/default-profile-photo.png',
            alt: 'Default profile photo'
          }
          return player
        })
        return gameInfo
      }),
      shareReplay(1)
    )
  }

  private getShortcutsForChatFrame(gameInfo: GameInfo): Observable<Shortcut[]> {
    return this.accountId$.pipe(
      map(accountId => {
        const loggedInPlayer = gameInfo.players.find(player => player.account._id == accountId)
        const chatsWithPlayer = gameInfo.chats.filter(chat => chat.players.find(chatPlayer => chatPlayer._id == loggedInPlayer._id))
        return chatsWithPlayer.map(chat => {
          const isImgShortcut = chat.players.length == 2
          const onClick = () => this.switchFrame('chat', chat._id)
          if (isImgShortcut) {
            const otherParticipant = chat.players.find(participant => participant._id != loggedInPlayer._id)
            return <Shortcut>{
              type: 'img',
              src: otherParticipant.photo.uri,
              alt: otherParticipant.photo.alt,
              onClick
            }
          } else {
            return <Shortcut>{
              type: 'text',
              text: chat.name,
              onClick
            }
          }
        })
      })
    )
  }

  switchFrame(type: Frame['type'], docId?: string) {
    this.frame$.pipe(
      take(1),
      map(curFrame => {
        if (curFrame.type == type && curFrame.docId == docId) {
          return // nothing to change
        }
        const newFrame: Frame = {
          type,
          gameInfo: curFrame.gameInfo,
          docId
        }
        this.frame$.next(newFrame)
      })
    ).subscribe()
  }

  onGameInfoChanged() {
    this.gameInfoQuery.refetch()
  }

}
