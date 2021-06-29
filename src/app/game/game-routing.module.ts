import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { GameActiveGuard } from './guards/game-active.guard'
import { JoinComponent } from './components/join/join.component'
import { RoomComponent } from './components/room/room.component'

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':gameId',
        children: [
          { path: 'join', component: JoinComponent },
          { path: 'room', component: RoomComponent, canActivate: [GameActiveGuard] }
        ]
      },
      { path: '**', redirectTo: '/dashboard' }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameRoutingModule { }
