import { Component } from '@angular/core'
import { AuthService } from '@auth0/auth0-angular'
import { environment } from 'src/environments/environment'

export type AuthAppState = {
  target: string
}

@Component({
  selector: 'app-login-button',
  templateUrl: './login-button.component.html',
  styleUrls: [ './login-button.component.scss' ],
})
export class LoginButtonComponent {
  constructor(
    private authService: AuthService,
  ) { }

  loginWithRedirect(): void {
    this.authService.loginWithRedirect({
      redirect_uri: environment.AUTH0_REDIRECT_URI,
      appState: { target: '/dashboard' } as AuthAppState,
    })
  }
}
