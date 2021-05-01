import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { BioComponent } from 'src/app/components/bio/bio.component';
import { ChatComponent } from 'src/app/components/chat/chat.component';
import { DashboardComponent } from 'src/app/components/dashboard/dashboard.component';
import { HostComponent } from 'src/app/components/host/host.component';
import { LandingComponent } from 'src/app/components/landing/landing.component';
import { RoomComponent } from 'src/app/components/room/room.component';
import { InGameGuard } from 'src/app/guards/in-game.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent, },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  {
    path: 'game/:id',
    canActivate: [AuthGuard, InGameGuard],
    children: [
      {
        path: 'host',
        children: [
          { path: '', pathMatch: 'full', component: HostComponent, },
          { path: 'bio', component: BioComponent },
          { path: 'chat', component: ChatComponent },
          { path: 'room', component: RoomComponent },
          { path: '**', redirectTo: '' }
        ]
      },
      {
        path: 'room',
        children: [
          { path: 'bio', component: BioComponent },
          { path: 'chat', component: ChatComponent },
          { path: '**', redirectTo: 'chat' }
        ]
      },
      { path: '**', redirectTo: '/dashboard' } // TODO: show current game in dashboard
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
