import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login-button',
  templateUrl: './login-button.component.html',
  styles: [],
})
export class LoginButtonComponent implements OnInit {
  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void { }

  loginWithRedirect(): void {
    //TODO disallow signup with duplicate email address
    this.authService.loginWithRedirect({
      redirect_uri: environment.AUTH0_REDIRECT_URI,
      appState: { target: '/dashboard' }
    });
  }
}
