import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AuthGuard } from '@auth0/auth0-angular'
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component'
import { HostComponent } from 'src/app/components/host/host.component'
import { JoinComponent } from 'src/app/components/join/join.component'
import { LandingComponent } from 'src/app/components/landing/landing.component'
import { RoomComponent } from 'src/app/components/room/room.component'
import { GameActiveGuard } from 'src/app/guards/game-active.guard'

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  {
    path: 'game',
    canActivate: [AuthGuard],
    children: [
      {
        path: ':gameId',
        canActivate: [GameActiveGuard],
        children: [
          { path: 'host', component: HostComponent },
          { path: 'room', component: RoomComponent },
          { path: 'join', component: JoinComponent },
          { path: '**', redirectTo: '/dashboard' }
        ]
      },
      { path: '**', redirectTo: '/dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
