import { Component, Input, OnInit } from '@angular/core'
import { Observable } from 'rxjs'
import { GameInfo } from 'src/app/components/room/room.component'

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @Input() chatId: string
  @Input() gameInfo$: Observable<GameInfo>
  @Input() accountId$: Observable<string>

  constructor() { }

  ngOnInit(): void {
  }

}
