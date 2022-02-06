import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AuthGuard } from '@auth0/auth0-angular'
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component'
import { LandingComponent } from 'src/app/components/landing/landing.component'
import { environment } from 'src/environments/environment'
import { LoginRedirectComponent } from './components/login-redirect/login-redirect.component'

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: environment.test ? undefined : [ AuthGuard ],
  },
  {
    path: 'game',
    loadChildren: () => import('./game/game.module').then(m => m.GameModule),
    canActivate: environment.test ? undefined : [ AuthGuard ],
  },
  { path: 'authorize', component: LoginRedirectComponent },
  { path: '**', redirectTo: '' },
]

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule { }
