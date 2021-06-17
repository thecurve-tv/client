import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { AuthHttpInterceptor, AuthModule } from '@auth0/auth0-angular'

import { AppComponent } from 'src/app/app.component'
import { AppRoutingModule } from 'src/app/app-routing.module'
import { LandingComponent } from 'src/app/components/landing/landing.component'
import { environment } from 'src/environments/environment'
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component'
import { GraphQLModule } from './graphql.module'
import { ThecurveCommonModule } from './thecurve-common/thecurve-common.module'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ThecurveCommonModule,
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
    BrowserAnimationsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
