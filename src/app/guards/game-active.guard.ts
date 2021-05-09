import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { ObjectId } from 'bson';
import { filter, map } from 'rxjs/operators';
import { getGame } from 'src/app/graphql/get-game.query';

@Injectable({
  providedIn: 'root'
})
export class GameActiveGuard implements CanActivate {

  constructor(
    private apollo: Apollo,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const exitRoute = this.router.parseUrl('/dashboard')
    const gameId = route.paramMap.get('gameId')
    try {
      new ObjectId(gameId)
    } catch (err) {
      return exitRoute // not a valid id
    }
    const pollInterval = 4000
    return getGame(this.apollo, { gameId }, pollInterval).valueChanges.pipe(
      filter(({ loading }) => !loading),
      map(({ data }) => {
        const game = data.gameById
        if (game == null) return exitRoute
        const cutOffTime = game.endTime - (60 * 1000) // declare game ended 60 seconds before
        if (cutOffTime <= Date.now()) return exitRoute
        return true
      })
    )
  }
}
