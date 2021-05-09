import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { from, Observable, ReplaySubject } from 'rxjs'
import { delay, filter, map, switchMap, take } from 'rxjs/operators'
import { getAccount, GetAccountQueryResult } from 'src/app/graphql/get-account.query'
import { getGame, GetGameQueryResult, GetGameQueryVariables } from 'src/app/graphql/get-game.query'
import { getPlayers, GetPlayersQueryResult } from 'src/app/graphql/get-players.query'
import { joinGame } from 'src/app/graphql/join-game.mutation'
import { ApiService } from 'src/app/services/api.service'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'

type Account = GetAccountQueryResult['accountById']
type Game = GetGameQueryResult['gameById']
type Player = GetPlayersQueryResult['playerMany'][0]

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {
  private gameQuery: QueryRef<GetGameQueryResult, GetGameQueryVariables>
  account$: Observable<Account>
  game$: Observable<Game>
  loadingGame: boolean
  gameStatus$: ReplaySubject<'open' | 'full' | 'closed' | undefined>
  players$: Observable<Player[]>
  joinForm: FormGroup

  constructor(
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private util: UtilService,
    private apiService: ApiService,
    private popupService: PopupService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.account$ = this.apiService.getAccountId().pipe(
      switchMap(({ _id: accountId }) => {
        return getAccount(this.apollo, { accountId }, 60 * 1000).valueChanges
      }),
      filter(({ loading }) => !loading),
      map(({ data }) => data.accountById)
    )
    this.activatedRoute.params.subscribe(params => {
      const gameId = params.gameId
      this.gameQuery = getGame(this.apollo, { gameId }, 60 * 1000)
      this.loadingGame = true
      this.gameStatus$ = new ReplaySubject(1)
      this.game$ = this.gameQuery.valueChanges.pipe(
        map(({ data, loading }) => {
          this.loadingGame = loading
          if (loading) this.gameStatus$.next(undefined)
          return { data, loading }
        }),
        filter(({ loading }) => !loading),
        map(({ data }) => data.gameById)
      )
      this.game$.pipe(
        switchMap(game => {
          return getPlayers(this.apollo, { gameId }).valueChanges.pipe(
            filter(({ loading }) => !loading),
            take(1),
            map(({ data }) => {
              const playerCount = data.playerMany.length
              const cutOffTime = Date.now() - (60 * 1000)
              if (game.pausedTime || game.endTime <= cutOffTime) return 'closed'
              else if (playerCount == game.maxPlayerCount) return 'full'
              return 'open'
            })
          )
        })
      ).subscribe(
        gameStatus => this.gameStatus$.next(gameStatus),
        err => this.gameStatus$.error(err),
        () => this.gameStatus$.complete()
      )
    })
  }

  getGameTimeLeftStr(game: Game) {
    return this.util.getGameTimeLeftStr(game.endTime, game.pausedTime, ' left')
  }

  onAcceptClick() {
    this.joinForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)])
    })
  }

  async submitJoinForm(game: Game) {
    if (!this.joinForm.valid) return
    await this.popupService.performWithPopup(
      'Joining game',
      joinGame(this.apollo, {
        gameId: game._id,
        playerName: this.joinForm.get('name').value
      }).pipe(
        delay(2000),
        switchMap(({ data }) => {
          const game = data.gameJoin
          return from(this.router.navigate(['game', game._id, 'room', 'chat', game.mainChat]))
        })
      )
    ).toPromise()
  }

}
