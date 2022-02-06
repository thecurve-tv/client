import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { Apollo, QueryRef } from 'apollo-angular'
import { from, Observable } from 'rxjs'
import { delay, filter, map, switchMap } from 'rxjs/operators'
import { GetGameInviteQueryResult, GetGameInviteQueryVariables, getGameInvite } from 'src/app/graphql/get-game-invite'
import { Account, getMyAccount } from 'src/app/graphql/get-my-account.query'
import { joinGame } from 'src/app/graphql/join-game.mutation'
import { PopupService } from 'src/app/services/popup.service'
import { UtilService } from 'src/app/services/util.service'

type GameInvite = GetGameInviteQueryResult['gameGetInvite']

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: [ './join.component.scss' ],
})
export class JoinComponent implements OnInit {
  private gameQuery: QueryRef<GetGameInviteQueryResult, GetGameInviteQueryVariables>
  account$: Observable<Account>
  gameInvite$: Observable<GameInvite>
  loadingGame: boolean
  joinForm: FormGroup

  constructor(
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private util: UtilService,
    private popupService: PopupService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.account$ = getMyAccount(this.apollo, 60 * 1000).valueChanges.pipe(
      filter(({ loading }) => !loading),
      map(({ data }) => data.myAccount),
    )
    this.activatedRoute.params.subscribe(params => {
      const gameId = params.gameId
      this.gameQuery = getGameInvite(this.apollo, { gameId }, 60 * 1000)
      this.loadingGame = true
      this.gameInvite$ = this.gameQuery.valueChanges.pipe(
        map(({ data, loading }) => {
          this.loadingGame = loading
          return { data, loading }
        }),
        filter(({ loading }) => !loading),
        map(({ data }) => data.gameGetInvite),
      )
    })
  }

  getGameTimeLeftStr(game: GameInvite) {
    return this.util.getGameTimeLeftStr(game.endTime, game.pausedTime, ' left')
  }

  onAcceptClick() {
    this.joinForm = new FormGroup({
      name: new FormControl('', [ Validators.required, Validators.minLength(1), Validators.maxLength(20) ]),
    })
  }

  async submitJoinForm(game: GameInvite) {
    if (!this.joinForm.valid) return
    await this.popupService.performWithPopup(
      'Joining game',
      joinGame(this.apollo, {
        gameId: game._id,
        playerName: this.joinForm.get('name').value,
      }).pipe(
        delay(2000),
        switchMap(({ data }) => {
          const { game } = data.gameJoin
          return from(this.router.navigate([ 'game', game._id, 'room' ]))
        }),
      ),
    ).toPromise()
  }

}
