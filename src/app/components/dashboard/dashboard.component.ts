import { Component, OnInit } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getActiveGames, GetActiveGamesQueryResult } from 'src/app/components/dashboard/dashboard.graphql';
import { Account } from 'src/app/models/account';
import { ApiService } from 'src/app/services/api.service';
import { PopupService } from 'src/app/services/popup.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private account: Account
  activeGames$: Observable<GetActiveGamesQueryResult>

  constructor(
    private popupService: PopupService,
    private apiService: ApiService,
    private apollo: Apollo
  ) { }

  async ngOnInit() {
    this.account = await this.popupService.performWithPopup(
      'Fetching account info',
      this.apiService.getAccount()
    ).toPromise()
    this.activeGames$ = getActiveGames(this.apollo, {
      accountId: this.account._id,
      now: Date.now()
    }).pipe(
      map(result => result.data)
    )
  }

  async onStartClicked() { }

}
