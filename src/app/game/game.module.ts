import { NgModule } from '@angular/core'
import { ThecurveCommonModule } from '../thecurve-common/thecurve-common.module'
import { BioComponent } from './components/bio/bio.component'
import { ChatComponent } from './components/chat/chat.component'
import { HostComponent } from './components/host/host.component'
import { JoinComponent } from './components/join/join.component'
import { RoomComponent } from './components/room/room.component'
import { GameRoutingModule } from './game-routing.module'

@NgModule({
  declarations: [
    HostComponent,
    JoinComponent,
    RoomComponent,
    BioComponent,
    ChatComponent
  ],
  imports: [
    ThecurveCommonModule,
    GameRoutingModule
  ]
})
export class GameModule { }
