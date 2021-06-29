import { DatePipe } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { from, Observable, of } from 'rxjs'
import { delay, filter, map, shareReplay, switchMap, take } from 'rxjs/operators'
import { getJoinedGames, GetJoinedGamesQueryResult, GetJoinedGamesQueryVariables } from 'src/app/graphql/get-joined-games.query'
import { resumeGame } from 'src/app/graphql/resume-game.mutation'
import { startGame } from 'src/app/graphql/start-game.mutation'
import { stopGame } from 'src/app/graphql/stop-game.mutation'
import { Account } from 'src/app/models/account'
import { ApiService } from 'src/app/services/api.service'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'

type RecentPlayerGame = GetJoinedGamesQueryResult['myAccount']['players'][0]

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private gamesJoinedQuery: QueryRef<GetJoinedGamesQueryResult, GetJoinedGamesQueryVariables>
  _account: Account
  account$: Observable<Account>
  loadingRecentPlayerGames: boolean
  activePlayerGames$: Observable<RecentPlayerGame[]>
  endedPlayerGames$: Observable<RecentPlayerGame[]>
  isHostingAGame = true // block game creation until we confirm no game is being hosted
  newGameForm: FormGroup

  constructor(
    private apiService: ApiService,
    private apollo: Apollo,
    private datePipe: DatePipe,
    private popupService: PopupService,
    private router: Router,
    public util: UtilService
  ) { }

  async ngOnInit() {
    this.account$ = new Observable(sub => {
      of(this._account).pipe(
        switchMap(cachedAccount => {
          return cachedAccount ? of(cachedAccount) : this.apiService.getAccountId().pipe(
            map(account => this._account = account)
          )
        })
      ).subscribe(sub)
    })
    const { _id: accountId } = await this.account$.toPromise()
    const pollInterval = 15000
    this.gamesJoinedQuery = getJoinedGames(
      this.apollo,
      { accountId },
      pollInterval
    )
    const isGameActive = (game: RecentPlayerGame['game'], now = Date.now()) => {
      return game.endTime > now || game.pausedTime != null
    }
    this.loadingRecentPlayerGames = true
    const recentPlayerGames$ = this.gamesJoinedQuery.valueChanges.pipe(
      map(({ data, loading }) => {
        this.loadingRecentPlayerGames = loading
        return { data, loading }
      }),
      filter(({ loading }) => !loading),
      map(({ data }) => {
        const playerGames = data.myAccount.players
        const now = Date.now()
        const millisAfterEndTillGameIsNoLongerRecent = 3 * 24 * 60 * 60 * 1000 // 3 days
        const recentGames = playerGames
          .filter(player => {
            // filter games joined
            // data.playerMany cannot be filtered with GraphQL due to the nested filtering on data.playerMany[].game
            const game = player.game
            if (isGameActive(game, now)) return true
            const timeWhenGameIsNoLongerRecent = game.endTime + millisAfterEndTillGameIsNoLongerRecent
            const gameIsRecent = timeWhenGameIsNoLongerRecent > now
            return gameIsRecent
          })
          .sort((playerGame1, playerGame2) => {
            return playerGame2.game.startTime - playerGame1.game.startTime // descending order
          })
        this.isHostingAGame = !!recentGames.find(({ game }) => isGameActive(game) && game.hostAccount._id == accountId)
        return recentGames
      }),
      shareReplay(1) // share the query result with however many subscribers there are
    )
    this.activePlayerGames$ = recentPlayerGames$.pipe(
      map(playerGames => playerGames.filter(({ game }) => isGameActive(game)))
    )
    this.endedPlayerGames$ = recentPlayerGames$.pipe(
      map(playerGames => playerGames.filter(({ game }) => !isGameActive(game)))
    )
  }

  getGameBubbleDateStr(millis: number) {
    const now = new Date()
    const date = new Date(millis)
    const format = date.getFullYear() == now.getFullYear() ? 'd MMM' : 'd MMM yyyy'
    return this.datePipe.transform(date, format)
  }

  async onStartClicked() {
    if (this.isHostingAGame) return alert('You cannot host more than 1 game at a time.')
    const initialState = {
      numPlayers: 1,
      hostName: ''
    }
    this.newGameForm = new FormGroup({
      numPlayers: new FormControl(initialState.numPlayers, [Validators.required, Validators.min(4), Validators.max(12)]),
      hostName: new FormControl(initialState.hostName, [Validators.required, Validators.minLength(1), Validators.maxLength(20)])
    })
  }

  async submitNewGameForm() {
    if (this.isHostingAGame) return this.popupService.newPopup({
      type: 'error',
      message: 'You cannot host more than 1 game at a time.'
    })
    await this.popupService.performWithPopup(
      'Starting a new game',
      startGame(this.apollo, {
        hostPlayerName: this.newGameForm.get('hostName').value,
        maxPlayerCount: this.newGameForm.get('numPlayers').value,
        duration: 3 * 60 * 60 * 1000
      }).pipe(
        delay(2000),
        map(({ data }) => {
          this.newGameForm = null
          return data.gameStart.game
        }),
        switchMap(game => from(this.router.navigate(['game', game._id, 'room'])))
      )
    ).toPromise()
  }

  async resumeGame(gameId: string) {
    const now = Date.now()
    await this.popupService.performWithPopup(
      'Hopping back in',
      this.activePlayerGames$.pipe(
        take(1),
        map(games => games.find(({ game }) => game._id == gameId)),
        switchMap(({ game }) => {
          const gameIsEnding = !game.pausedTime && (game.endTime - 60 * 1000) <= now
          if (gameIsEnding) throw new Error('Sorry, this game is ending now and you cannot resume it anymore.')
          const isGameHost = game.hostAccount._id == this._account._id
          if (!isGameHost) return from(this.router.navigate(['game', gameId, 'room']))
          return resumeGame(this.apollo, { gameId }).pipe(
            delay(2000),
            switchMap(() => from(this.router.navigate(['game', gameId, 'room'])))
          )
        })
      )
    ).toPromise()
  }

  async stopGame(gameId: string) {
    await this.popupService.performWithPopup(
      'Stopping game',
      stopGame(this.apollo, { gameId }).pipe(
        delay(1000),
        map(() => this.gamesJoinedQuery.refetch())
      )
    ).toPromise()
  }

}
