import { NgModule } from '@angular/core'
import { ThecurveCommonModule } from '../thecurve-common/thecurve-common.module'
import { BioComponent } from './components/bio/bio.component'
import { ChatComponent } from './components/chat/chat.component'
import { JoinComponent } from './components/join/join.component'
import { RoomComponent } from './components/room/room.component'
import { GameRoutingModule } from './game-routing.module'
import { RankingComponent } from './components/ranking/ranking.component'

@NgModule({
  declarations: [
    JoinComponent,
    RoomComponent,
    BioComponent,
    ChatComponent,
    RankingComponent,
  ],
  imports: [
    ThecurveCommonModule,
    GameRoutingModule,
  ],
})
export class GameModule { }
