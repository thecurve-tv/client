import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { Apollo, QueryRef } from 'apollo-angular'
import { combineLatest, from, Observable, of, ReplaySubject, zip } from 'rxjs'
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators'
import { GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { Account } from 'src/app/graphql/get-my-account.query'
import { getRankings, GetRankingsQueryResult, GetRankingsQueryVariables, Ranking } from 'src/app/graphql/get-rankings.query'
import { rankingPutRatings } from 'src/app/graphql/ranking-put-ratings.mutation'
import { startRanking } from 'src/app/graphql/start-ranking.mutation'
import { PopupService } from 'src/app/services/popup.service'
import { Frame } from '../room/room.component'

type Rating = {position: number, player: Player}
type NextRating = Omit<Rating, 'player'>

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: [ './ranking.component.scss' ],
})
export class RankingComponent implements OnInit {
  @Input() frame$: Observable<Frame>
  @Input() gameInfo$: Observable<GameInfo>
  @Input() account$: Observable<Account>
  @Input() isHost: boolean
  @Output() gameInfoRefetch = new EventEmitter<void>()
  getRankingsQuery: QueryRef<GetRankingsQueryResult, GetRankingsQueryVariables>
  ranking$: Observable<Ranking>
  numRankings: number
  players$: Observable<Player[]>
  canStartRanking: boolean
  completedRatings$ = new ReplaySubject<Rating[]>(1)
  numRatingsNeededFromMe: number
  nextRating$: Observable<NextRating>

  constructor(
    private apollo: Apollo,
    private popupService: PopupService,
  ) {}

  ngOnInit(): void {
    this.ranking$ = this.gameInfo$.pipe(
      switchMap(gameInfo => {
        this.getRankingsQuery = getRankings(this.apollo, { gameId: gameInfo._id }, 5000)
        return this.getRankingsQuery.valueChanges
      }),
      map(({ data }) => {
        const rankings = data.rankingMany
        this.numRankings = rankings.length
        const openRanking = rankings.find(r => r.completedTime == null)
        if (openRanking && (!this.isHost || openRanking.completedTime)) {
          // once we have a ranking, stop polling
          // the host still needs to see ratings as they come in (until the ranking is completed)
          this.getRankingsQuery.stopPolling()
        }
        this.canStartRanking = this.isHost && !openRanking
        return openRanking
      }),
      filter(openRanking => !!openRanking),
      switchMap(openRanking => this.updateCompletedRatings$(openRanking)),
      shareReplay({ bufferSize: 1, refCount: true }),
    )
    this.players$ = combineLatest([ this.account$, this.gameInfo$ ]).pipe(
      map(([ myAccount, gameInfo ]) => gameInfo.players.filter(p => {
        const playerIsHost = p.account._id === gameInfo.hostAccount._id
        const playerIsMe = p.account._id === myAccount._id
        return !playerIsHost && !playerIsMe
      })),
    )
    if (this.isHost) {
      this.nextRating$ = of()
    } else {
      this.nextRating$ = combineLatest([ this.gameInfo$, this.completedRatings$ ]).pipe(
        map(([ gameInfo, completedRatings ]) => {
          this.numRatingsNeededFromMe = gameInfo.players.length - 2 // exclude host & I
          const numRatingsLeft = this.numRatingsNeededFromMe - completedRatings.length
          if (numRatingsLeft == 0) {
            return null
          }
          let positions: number[] = []
          for (let i = 1; i <= numRatingsLeft; ++i) positions.push(i)
          positions = positions.filter(pos => !completedRatings.some(r => r.position == pos)) // get positions not rated
          return {
            position: positions.sort((a, b) => b - a)[0], // descending order
          }
        }),
      )
    }
  }

  updateCompletedRatings$(openRanking: Ranking) {
    return combineLatest([ this.account$, this.gameInfo$ ]).pipe(
      filter(([ , gameInfo ]) => {
        const playerIdsInvolvedInRanking = new Set<string>()
        for (const [ raterId, rating ] of Object.entries(openRanking.ratings)) {
          playerIdsInvolvedInRanking.add(raterId) // add id of players doing the rating
          for (const ratedId of Object.keys(rating)) {
            playerIdsInvolvedInRanking.add(ratedId) // add ids of players being rated
          }
        }
        const gameInfoContainsAllNeededPlayers = [ ...playerIdsInvolvedInRanking ]
          .every(_id => !!gameInfo.playerById.get(_id))
        if (!gameInfoContainsAllNeededPlayers) {
          this.gameInfoRefetch.emit() // notify that we need more info
        }
        return gameInfoContainsAllNeededPlayers
      }),
      map(([ account, gameInfo ]) => {
        const myPlayer = gameInfo.players.find(p => p.account._id == account._id)
        let completedRatings: Rating[]
        if (this.isHost) {
          const positionSums: Record<string, number> = {}
          Object.values(openRanking.ratings).forEach(
            rating => {
              Object.entries(rating).forEach(
                ([ playerId, position ]) => {
                  positionSums[playerId] = (positionSums[playerId] || 0) + position
                  return positionSums
                },
              )
            },
          )
          const leaderBoard = Object.entries(positionSums).sort((a, b) => a[1] - b[1]) // descending order; lower sum is best
          completedRatings = []
          let nextPosition = 1
          while (leaderBoard.length) {
            const next = leaderBoard.shift()
            const ties = leaderBoard.filter(x => x[1] === next[1])
            for (const tie of ties) {
              leaderBoard.splice(leaderBoard.indexOf(tie), 1)
            }
            const playersInThisPosition = [ next, ...ties ]
            completedRatings.push(...playersInThisPosition.map(([ playerId ]) => {
              return <Rating>{ position: nextPosition, player: gameInfo.playerById.get(playerId) }
            }))
            nextPosition += playersInThisPosition.length
          }
        } else {
          const myRatings = openRanking.ratings[myPlayer._id] || {} // assign empty object if no ratings submitted
          completedRatings = Object.entries(myRatings)
            .map(([ ratedPlayerId, ratedPlayerPosition ]) => {
              return <Rating>{
                position: ratedPlayerPosition,
                player: gameInfo.playerById.get(ratedPlayerId),
              }
            })
            .sort((a, b) => a.position - b.position)
        }
        this.completedRatings$.next(completedRatings)
        return openRanking
      }),
    )
  }

  async startRanking(): Promise<void> {
    await of(undefined).pipe(
      switchMap(() => {
        return this.popupService.newPopup({
          type: 'info',
          message: 'Are you sure you want to start a ranking?',
          requireConfirmation: true,
        }).valueChanges
      }),
      filter(confirmed => confirmed),
      switchMap(() => {
        return this.popupService.performWithPopup(
          `Starting ranking #${this.numRankings + 1}`,
          this.gameInfo$.pipe(
            take(1),
            switchMap(gameInfo => startRanking(this.apollo, { gameId: gameInfo._id })),
            switchMap(() => from(this.getRankingsQuery.refetch())),
          ),
        )
      }),
    ).toPromise()
  }

  async selectPlayer(player: Player): Promise<void> {
    await zip(this.nextRating$, this.completedRatings$).pipe(
      take(1),
      map(([ nextRating, completedRatings ]) => {
        completedRatings.push({ player, position: nextRating.position })
        this.completedRatings$.next(completedRatings.sort((a, b) => a.position - b.position))
        return completedRatings
      }),
      filter(completedRatings => completedRatings.length === this.numRatingsNeededFromMe),
      switchMap(completedRatings => {
        return this.popupService.performWithPopup(
          'Submitting your ratings',
          this.ranking$.pipe(
            take(1),
            switchMap(ranking => rankingPutRatings(this.apollo, {
              rankingId: ranking._id,
              ratings: completedRatings.map(r => ({ player: r.player._id, position: r.position })),
            })),
            switchMap(() => from(this.getRankingsQuery.refetch())),
          ),
        )
      }),
    ).toPromise()
  }

}
