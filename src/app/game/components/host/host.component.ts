import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { Observable } from 'rxjs'
import { filter, map, shareReplay, tap } from 'rxjs/operators'
import { getGameInfo, GetGameInfoQueryResult, GetGameInfoQueryVariables, mapGameInfoPointers, GameInfo } from 'src/app/graphql/get-game-info.query'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'
import { environment } from 'src/environments/environment'

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
      tap(({ loading }) => this.loadingGameInfo = loading),
      filter(({ loading }) => !loading),
      map(({ data }) => data),
      mapGameInfoPointers(),
      shareReplay(1)
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
