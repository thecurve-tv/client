import { Component, Input, OnInit } from '@angular/core'
import { combineLatest, Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Frame } from 'src/app/components/room/room.component'
import { Chat, GameInfo } from 'src/app/graphql/get-game-info.query'

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @Input() frame$: Observable<Frame>
  @Input() gameInfo$: Observable<GameInfo>
  @Input() accountId$: Observable<string>
  chatId: Chat['_id']

  constructor() { }

  ngOnInit(): void {
    combineLatest([this.frame$, this.gameInfo$]).pipe(
      tap(([frame]) => this.chatId = frame.docId)
    ).subscribe()
  }

}
