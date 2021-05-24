import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables } from 'src/app/graphql/get-game-info.query'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'
import { environment } from 'src/environments/environment'

type Chat = Omit<GetGameInfoQueryResult['gameById']['chats'][0], 'players'> & {
  players: GetGameInfoQueryResult['gameById']['players']
}
type GameInfo = Omit<GetGameInfoQueryResult['gameById'], 'chats'> & {
  chats: Chat[]
}

@Component({
  selector: 'app-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss']
})
export class HostComponent implements OnInit {
  private gameInfoQuery: QueryRef<GetGameInfoQueryResult, GetGameInfoQueryVariables>
  gameInfo$: Observable<GameInfo>
  loadingGameInfo: boolean

  constructor(
    private apollo: Apollo,
    private activatedRoute: ActivatedRoute,
    public util: UtilService,
    private popupService: PopupService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.pipe(
      map(routeParams => {
        const gameId: string = routeParams.gameId
        this.setGameInfo$(gameId)
      })
    ).subscribe()
  }

  private setGameInfo$(gameId: string) {
    this.gameInfoQuery = getGameInfo(this.apollo, { gameId }, 60 * 1000)
    this.loadingGameInfo = true
    this.gameInfo$ = this.gameInfoQuery.valueChanges.pipe(
      map(({ loading, data }) => {
        this.loadingGameInfo = loading
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
      })
    )
  }

  getGameTimeLeftStr(game: GameInfo) {
    return this.util.getGameTimeLeftStr(game.endTime, game.pausedTime, ' left')
  }

  onInviteClick(game: GameInfo) {
    const joinUrl = `${environment.CLIENT_URL}/game/${game._id}/join`
    this.popupService.newPopup({
      type: 'info',
      message: `Invite players by sending them this link\n${joinUrl}`
    })
  }

}
