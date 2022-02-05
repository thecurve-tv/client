import { Component } from '@angular/core'
import { AuthService } from '@auth0/auth0-angular'
import { of } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'
import { PopupService } from 'src/app/services/popup.service'
import { AuthAppState } from 'src/app/thecurve-common/components/login-button/login-button.component'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-login-redirect',
  templateUrl: './login-redirect.component.html',
  styleUrls: [ './login-redirect.component.scss' ],
})
export class LoginRedirectComponent {
  constructor(
    private authService: AuthService,
    private popupService: PopupService,
  ) { }

  async loginAgain(): Promise<void> {
    await this.popupService.performWithPopup(
      'Logging you in again',
      this.authService.handleRedirectCallback().pipe(
        switchMap(result => {
          const appState = result.appState as AuthAppState | undefined
          return this.authService.loginWithRedirect({
            redirect_uri: environment.AUTH0_REDIRECT_URI,
            appState: { target: appState.target } as AuthAppState,
          })
        }),
        catchError(err => {
          console.error(err)
          this.popupService.newPopup({
            type: 'error',
            message: "Sorry but we weren't able to retry the login, please try logging in from the homepage instead.",
          })
          return of(undefined as void)
        }),
      ),
    ).toPromise()
  }
}
