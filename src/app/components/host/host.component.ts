import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { Observable } from 'rxjs'
import { delay, filter, map, shareReplay, switchMap } from 'rxjs/operators'
import { getChats, GetChatsQueryResult } from 'src/app/graphql/get-chats.query'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables } from 'src/app/graphql/get-game-info.query'
import { ApiService } from 'src/app/services/api.service'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'
import { environment } from 'src/environments/environment'

type ChatPlayer = GetChatsQueryResult['chatPlayerMany'][0]
type GameInfo = {
  game: GetGameInfoQueryResult['game']
  players: GetGameInfoQueryResult['players']
  chats: { [_id: string]: ChatPlayer['chat'] & { players: Player[] } }
}
type Game = GameInfo['game']
type Player = GameInfo['players'][0]
type Chat = GameInfo['chats']['']

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  private gameInfoQuery: QueryRef<GetGameInfoQueryResult, GetGameInfoQueryVariables>
  private gameInfo$: Observable<GameInfo>
  game$: Observable<Game>
  players$: Observable<Player[]> // host player is filtered out of this list
  chats$: Observable<Chat[]>
  loadingGameInfo: boolean
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
    this.activatedRoute.params.pipe(
      map(routeParams => {
        const gameId: string = routeParams.gameId
        this.setGameInfo$(gameId, accountId)
        this.game$ = this.gameInfo$.pipe(
          map(({ game }) => game)
        )
        this.players$ = this.gameInfo$.pipe(
          map(({ players }) => players)
        )
        this.chats$ = this.gameInfo$.pipe(
          map(({ chats }) => Object.values(chats))
        )
      })
    ).subscribe()
  }

  private setGameInfo$(gameId: string, hostAccountId: string) {
    this.gameInfoQuery = getGameInfo(this.apollo, { gameId }, 60 * 1000)
    this.loadingGameInfo = true
    this.gameInfo$ = this.gameInfoQuery.valueChanges.pipe(
      map(({ loading, data }) => {
        if (loading) this.loadingGameInfo = true
        return { loading, data }
      }),
      filter(({ loading }) => !loading),
      switchMap(({ data }) => {
        const partialGameInfo: GetGameInfoQueryResult = { ...data }
        partialGameInfo.players = partialGameInfo.players.filter(p => p.account._id != hostAccountId)
        this.curPlayerCount = partialGameInfo.players.length
        return getChats(this.apollo, { playerIds: partialGameInfo.players.map(p => p._id) }).valueChanges.pipe(
          filter(({ loading }) => !loading),
          map(({ data }) => {
            const chatPlayers = data.chatPlayerMany
            const chats: GameInfo['chats'] = {}
            chatPlayers.reduce((chatResults, { chat, player: { _id: playerId } }) => {
              const player = partialGameInfo.players.find(p => p._id == playerId)
              const chatResult = chatResults[chat._id]
              if (chatResult) {
                chatResult.players.push(player)
              } else {
                chatResults[chat._id] = {
                  ...chat,
                  players: [player]
                }
              }
              return chatResults
            }, chats)
            return { ...partialGameInfo, chats }
          })
        )
      }),
      shareReplay(1)
    )
  }

  getGameTimeLeftStr(game: Game) {
    return this.util.getGameTimeLeftStr(game.endTime, game.pausedTime, ' left')
  }

  onInviteClick(game: Game) {
    const joinUrl = `${environment.CLIENT_URL}/game/${game._id}/join`
    this.popupService.newPopup({
      type: 'info',
      message: `Invite players by sending them this link\n${joinUrl}`
    })
  }

}
