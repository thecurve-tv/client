import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HostComponent } from 'src/app/components/host/host.component';
import { LandingComponent } from 'src/app/components/landing/landing.component';

const routes: Routes = [
  { path: 'host', component: HostComponent },
  { path: '**', component: LandingComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
