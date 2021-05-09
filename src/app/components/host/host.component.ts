import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { Observable } from 'rxjs'
import { delay, filter, map, shareReplay, switchMap, take } from 'rxjs/operators'
import { getChats, GetChatsQueryResult } from 'src/app/graphql/get-chats.query'
import { getGame, GetGameQueryResult, GetGameQueryVariables } from 'src/app/graphql/get-game.query'
import { getPlayers, GetPlayersQueryResult, GetPlayersQueryVariables } from 'src/app/graphql/get-players.query'
import { ApiService } from 'src/app/services/api.service'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'
import { environment } from 'src/environments/environment'

type Game = GetGameQueryResult['gameById']
type Player = GetPlayersQueryResult['playerMany'][0]
type Chat = GetChatsQueryResult['chatPlayerMany'][0]['chat'] & { players: Player[] }

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  private readonly gamePollInterval = 60 * 1000
  private readonly playersPollInterval = 60 * 1000
  private readonly chatsDelay = 2 * 1000
  private gameQuery: QueryRef<GetGameQueryResult, GetGameQueryVariables>
  private playersQuery: QueryRef<GetPlayersQueryResult, GetPlayersQueryVariables>
  _game: Game // cached game used for hiding content until the game is loaded
  game$: Observable<Game>
  players$: Observable<Player[]> // host player is filtered out of this list
  chats$: Observable<Chat[]>
  loadingGame: boolean
  loadingPlayers: boolean
  loadingChats: boolean
  curPlayerCount: number

  constructor(
    private apiService: ApiService,
    private apollo: Apollo,
    private activatedRoute: ActivatedRoute,
    public util: UtilService,
    private popupService: PopupService
  ) { }

  async ngOnInit() {
    const { _id: accountId } = await this.apiService.getAccountId().toPromise()
    this.activatedRoute.params.subscribe(routeParams => {
      const gameId: string = routeParams.gameId
      this.gameQuery = getGame(this.apollo, { gameId }, this.gamePollInterval)
      this.loadingGame = true
      this.game$ = this.gameQuery.valueChanges.pipe(
        map(({ loading, data }) => {
          this.loadingGame = loading
          return { loading, data }
        }),
        filter(({ loading }) => !loading),
        map(({ data }) => this._game = data.gameById)
      )
      this.playersQuery = getPlayers(this.apollo, { gameId }, this.playersPollInterval)
      this.players$ = this.playersQuery.valueChanges.pipe(
        map(({ loading, data }) => {
          this.loadingPlayers = loading
          return { loading, data }
        }),
        filter(({ loading }) => !loading),
        map(({ data }) => {
          const players = data.playerMany.filter(player => player.account?._id != accountId) // filter out hostPlayer
          this.curPlayerCount = players.length
          return players
        }),
        shareReplay(1)
      )
      this.chats$ = this.players$.pipe(
        map(players => {
          this.loadingChats = true
          const playerMap: { [id: string]: Player } = players.reduce((playerMap, player) => {
            playerMap[player._id] = player
            return playerMap
          }, {})
          return playerMap
        }),
        delay(this.chatsDelay),
        switchMap(playerMap => {
          return getChats(this.apollo, { playerIds: Object.keys(playerMap) }).valueChanges.pipe(
            map(({ loading, data }) => {
              this.loadingChats = loading
              return { loading, data }
            }),
            filter(({ loading }) => !loading),
            take(1),
            map(({ data }) => {
              const chats: Chat[] = []
              data.chatPlayerMany.reduce((chats, chatPlayer) => {
                let chat: Chat = chats.find(chat => chat._id == chatPlayer.chat._id)
                if (!chat) {
                  chat = {
                    _id: chatPlayer.chat._id,
                    name: chatPlayer.chat.name,
                    players: []
                  }
                  chats.push(chat)
                }
                chat.players.push(playerMap[chatPlayer.player._id])
                return chats
              }, chats)
              return chats
            })
          )
        })
      )
    })
  }

  getGameTimeLeftStr(game: Game) {
    return this.util.getGameTimeLeftStr(game.endTime, game.pausedTime, ' left')
  }

  onInviteClick() {
    const joinUrl = `${environment.CLIENT_URL}/game/${this._game._id}/join`
    this.popupService.newPopup({
      type: 'info',
      message: `Invite players by sending them this link\n${joinUrl}`
    })
  }

}
