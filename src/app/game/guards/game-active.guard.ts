import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { Apollo } from 'apollo-angular'
import { filter, map } from 'rxjs/operators'
import { getGame } from 'src/app/graphql/get-game.query'

@Injectable({
  providedIn: 'root',
})
export class GameActiveGuard implements CanActivate {

  constructor(
    private apollo: Apollo,
    private router: Router,
  ) { }

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const exitRoute = this.router.parseUrl('/dashboard')
    const gameId = route.paramMap.get('gameId')
    const objectIdRegex = /^[a-fA-F0-9]{24}$/
    if (!objectIdRegex.test(gameId)) {
      return exitRoute
    }
    return getGame(this.apollo, { gameId }).valueChanges.pipe(
      filter(({ loading }) => !loading),
      map(({ data }) => {
        const game = data.gameById
        if (game == null) return exitRoute
        if (game.pausedTime) return exitRoute
        const cutOffTime = game.endTime - (60 * 1000) // declare game ended 60 seconds before
        if (cutOffTime <= Date.now()) return exitRoute
        return true
      }),
    )
  }
}
