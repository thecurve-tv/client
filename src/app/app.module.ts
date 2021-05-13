import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular'
import { DatePipe } from '@angular/common'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { ReactiveFormsModule } from '@angular/forms'

import { AppComponent } from 'src/app/app.component'
import { AppRoutingModule } from 'src/app/app-routing.module'
import { LandingComponent } from 'src/app/components/landing/landing.component'
import { HostComponent } from 'src/app/components/host/host.component'
import { BioComponent } from 'src/app/components/bio/bio.component'
import { ChatComponent } from 'src/app/components/chat/chat.component'
import { RoomComponent } from 'src/app/components/room/room.component'
import { environment } from 'src/environments/environment'
import { LoginButtonComponent } from 'src/app/components/login-button/login-button.component'
import { LogoutButtonComponent } from 'src/app/components/logout-button/logout-button.component'
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component'
import { PopupComponent } from 'src/app/components/popup/popup.component'
import { GraphQLModule } from './graphql.module'
import { VarDirective } from 'src/app/directives/ng-var.directive';
import { JoinComponent } from './components/join/join.component'

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    HostComponent,
    BioComponent,
    ChatComponent,
    RoomComponent,
    LoginButtonComponent,
    LogoutButtonComponent,
    DashboardComponent,
    PopupComponent,
    VarDirective,
    JoinComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AuthModule.forRoot({
      domain: environment.AUTH0_DOMAIN,
      clientId: environment.AUTH0_CLIENT_ID,
      audience: environment.AUTH0_API_AUDIENCE,
      redirectUri: environment.AUTH0_REDIRECT_URI,
      httpInterceptor: {
        allowedList: [{
          uriMatcher: uri => uri.startsWith(environment.API_HOST)
        }]
      }
    }),
    GraphQLModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
