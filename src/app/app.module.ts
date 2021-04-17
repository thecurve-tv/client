import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { LandingComponent } from 'src/app/components/landing/landing.component';
import { HostComponent } from './components/host/host.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    HostComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
