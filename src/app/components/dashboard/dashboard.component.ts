import { DatePipe } from '@angular/common'
import { Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { combineLatest, from, Observable } from 'rxjs'
import { delay, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators'
import { mapPlayerPhoto } from 'src/app/graphql/get-game-info.query'
import { getJoinedGames, GetJoinedGamesQueryResult } from 'src/app/graphql/get-joined-games.query'
import { Account, getMyAccount } from 'src/app/graphql/get-my-account.query'
import { resumeGame } from 'src/app/graphql/resume-game.mutation'
import { startGame } from 'src/app/graphql/start-game.mutation'
import { stopGame } from 'src/app/graphql/stop-game.mutation'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'
import { CarouselDot } from 'src/app/thecurve-common/components/carousel/carousel.component'

type RecentPlayerGame = GetJoinedGamesQueryResult['myAccount']['players'][0]

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.scss' ],
})
export class DashboardComponent implements OnInit {
  private datePipe: DatePipe
  private gamesJoinedQuery: QueryRef<GetJoinedGamesQueryResult>
  account$: Observable<Account>
  activePlayerGames$: Observable<RecentPlayerGame[]>
  carousel$: Observable<CarouselDot[]>
  @ViewChild('content') contentRef: ElementRef
  endedPlayerGames$: Observable<RecentPlayerGame[]>
  isHostingAGame = true // block game creation until we confirm no game is being hosted
  loadingRecentPlayerGames: boolean
  newGameForm: FormGroup
  playerName$: Observable<string>

  constructor(
    private apollo: Apollo,
    private popupService: PopupService,
    private router: Router,
    public util: UtilService,
    @Inject(LOCALE_ID) locale: string,
  ) {
    this.datePipe = new DatePipe(locale)
  }

  ngOnInit() {
    this.account$ = getMyAccount(this.apollo, 60 * 1000).valueChanges.pipe(
      filter(({ loading }) => !loading),
      map(({ data }) => data.myAccount),
      shareReplay({ bufferSize: 1, refCount: true }),
    )
    const pollInterval = 15000
    this.gamesJoinedQuery = getJoinedGames(this.apollo, pollInterval)

    this.loadingRecentPlayerGames = true
    const recentPlayerGames$ = this.gamesJoinedQuery.valueChanges.pipe(
      tap(({ loading }) => this.loadingRecentPlayerGames = loading),
      filter(({ loading }) => loading === false),
      map(({ data }) => {
        const playerGames = data.myAccount.players
        const now = Date.now()
        const millisAfterEndTillGameIsNoLongerRecent = 3 * 24 * 60 * 60 * 1000 // 3 days
        return playerGames
          .filter(player => {
            // filter games joined
            // data.playerMany cannot be filtered with GraphQL due to the nested filtering on data.playerMany[].game
            const game = player.game
            if (this.isGameActive(game, now)) {
              return true
            }
            return now < game.endTime + millisAfterEndTillGameIsNoLongerRecent
          })
          .map(player => mapPlayerPhoto(player))
          .sort((playerGame1, playerGame2) => {
            return playerGame2.game.startTime - playerGame1.game.startTime // descending order
          })
      }),
      switchMap(recentGames => {
        return this.account$.pipe(
          take(1),
          map(account => {
            const gameBeingHosted = recentGames.find(({ game }) => this.isGameActive(game) && game.hostAccount._id === account._id)
            this.isHostingAGame = gameBeingHosted != null
            return recentGames
          }),
        )
      }),
      shareReplay({ bufferSize: 1, refCount: true }), // share the query result with however many subscribers there are
    )

    this.activePlayerGames$ = recentPlayerGames$.pipe(
      map(recentGames => recentGames.filter(({ game }) => this.isGameActive(game))),
    )
    this.endedPlayerGames$ = recentPlayerGames$.pipe(
      map(recentGames => recentGames.filter(({ game }) => !this.isGameActive(game))),
    )
    this.carousel$ = this.activePlayerGames$.pipe(
      map(activeGames => activeGames.map(ag => {
        const timeLeftStr = this.util.getGameTimeLeftStr(ag.game.endTime, ag.game.pausedTime, ' left')
        const timestampStr = new Date(ag.game.pausedTime || ag.game.endTime).toLocaleString()
        return {
          image: { src: ag.photo.uri, alt: ag.photo.alt },
          headline: ag.name,
          preview: timeLeftStr.includes('left') ? timeLeftStr : `${timeLeftStr} @ ${timestampStr}`,
        } as CarouselDot
      })),
    )
    this.playerName$ = combineLatest([ this.account$, recentPlayerGames$ ]).pipe(
      map(([ account, recentGames ]) => recentGames[0]?.name || account.email),
    )
  }

  private isGameActive(game: RecentPlayerGame['game'], now = Date.now()): boolean {
    return game.endTime > now || game.pausedTime != null
  }

  getGameBubbleDateStr(millis: number) {
    const now = new Date()
    const date = new Date(millis)
    const format = date.getFullYear() == now.getFullYear() ? 'd MMM' : 'd MMM yyyy'
    return this.datePipe.transform(date, format)
  }

  async onStartClicked() {
    if (this.isHostingAGame) {
      this.popupService.newPopup({
        type: 'error',
        message: 'You cannot host more than 1 game at a time.',
      })
      return
    }
    const initialState = {
      numPlayers: 1,
      hostName: '',
    }
    this.newGameForm = new FormGroup({
      numPlayers: new FormControl(initialState.numPlayers, [ Validators.required, Validators.min(4), Validators.max(12) ]),
      hostName: new FormControl(initialState.hostName, [ Validators.required, Validators.minLength(1), Validators.maxLength(20) ]),
    })
    const contentElement: HTMLDivElement = this.contentRef.nativeElement
    contentElement.classList.add('clipped')
  }

  closeNewGameForm() {
    this.newGameForm = null
    const contentElement: HTMLDivElement = this.contentRef.nativeElement
    contentElement.classList.remove('clipped')
  }

  async submitNewGameForm() {
    if (this.isHostingAGame) return this.popupService.newPopup({
      type: 'error',
      message: 'You cannot host more than 1 game at a time.',
    })
    await this.popupService.performWithPopup(
      'Starting a new game',
      startGame(this.apollo, {
        hostPlayerName: this.newGameForm.get('hostName').value,
        maxPlayerCount: this.newGameForm.get('numPlayers').value,
        duration: 3 * 60 * 60 * 1000,
      }).pipe(
        delay(2000),
        map(({ data }) => {
          this.newGameForm = null
          return data.gameStart.game
        }),
        switchMap(game => from(this.router.navigate([ 'game', game._id, 'room' ]))),
      ),
    ).toPromise()
  }

  async resumeGame(gameId: string) {
    const now = Date.now()
    await this.popupService.performWithPopup(
      'Hopping back in',
      this.activePlayerGames$.pipe(
        take(1),
        map(games => games.find(({ game }) => game._id === gameId)),
        switchMap(({ game }) => {
          const gameIsEnding = !game.pausedTime && (game.endTime - 5 * 60 * 1000) <= now
          if (gameIsEnding) throw new Error('Sorry, this game is ending soon and you cannot resume it anymore.')
          return this.account$.pipe(
            take(1),
            map(account => ({ game, account })),
          )
        }),
        switchMap(({ game, account }) => {
          const isGameHost = game.hostAccount._id === account._id
          if (!isGameHost) return from(this.router.navigate([ 'game', gameId, 'room' ]))
          return resumeGame(this.apollo, { gameId }).pipe(
            delay(2000),
            switchMap(() => from(this.router.navigate([ 'game', gameId, 'room' ]))),
          )
        }),
      ),
    ).toPromise()
  }

  async stopGame(gameId: string) {
    await this.popupService.performWithPopup(
      'Stopping game',
      stopGame(this.apollo, { gameId }).pipe(
        delay(1000),
        tap(() => this.gamesJoinedQuery.refetch()),
      ),
    ).toPromise()
  }

}
