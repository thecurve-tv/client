import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { getActiveGames } from 'src/app/graphql/get-active-games.query';
import { startGame } from 'src/app/graphql/start-game.mutation';
import { Account } from 'src/app/models/account';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private account: Account

  constructor(
    private apiService: ApiService,
    private apollo: Apollo
  ) { }

  async ngOnInit() {
    this.account = await this.apiService.getAccount().toPromise()
    const activeGames = await getActiveGames(this.apollo, {
      accountId: this.account._id,
      now: Date.now()
    }).pipe(
      map(({ data }) => data.gameMany)
    ).toPromise()
    console.log(activeGames)
  }

  async onStartClicked() {
    const startGameResult = await startGame(this.apollo, {
      hostPlayerName: prompt('Enter host name'),
      duration: 3 * 60 * 60 * 1000
    }).pipe(
      map(({ data }) => {
        return data.gameStart
      })
    ).toPromise()
    console.log(startGameResult)
  }

}
