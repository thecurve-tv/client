import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BioComponent } from 'src/app/components/bio/bio.component';
import { ChatComponent } from 'src/app/components/chat/chat.component';
import { HostComponent } from 'src/app/components/host/host.component';
import { LandingComponent } from 'src/app/components/landing/landing.component';
import { RoomComponent } from 'src/app/components/room/room.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent, },
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
  { path: 'influencer/chat', component: ChatComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
