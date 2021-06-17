import { Component, OnInit } from '@angular/core';

import { AuthService } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-logout-button',
  templateUrl: './logout-button.component.html',
  styles: [],
})
export class LogoutButtonComponent implements OnInit {
  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void { }

  async logout() {
    this.authService.logout({ returnTo: environment.AUTH0_LOGOUT_URI });
  }
}
