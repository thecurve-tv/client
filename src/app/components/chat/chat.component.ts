import { Component, Input, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { Chat, Frame, GameInfo } from 'src/app/components/room/room.component'

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
    this.frame$.pipe(
      take(1),
      map(frame => this.chatId = frame.docId)
    ).subscribe()
  }

}
