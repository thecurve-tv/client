import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { LandingComponent } from 'src/app/components/landing/landing.component';
import { HostComponent } from './components/host/host.component';
import { BioComponent } from './components/bio/bio.component';
import { ChatComponent } from './components/chat/chat.component';
import { RoomComponent } from './components/room/room.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    HostComponent,
    BioComponent,
    ChatComponent,
    RoomComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
