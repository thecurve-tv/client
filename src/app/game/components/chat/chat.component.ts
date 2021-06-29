import { Component, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { FetchResult } from '@apollo/client/core'
import { Apollo } from 'apollo-angular'
import { combineLatest, Observable } from 'rxjs'
import { map, switchMap, take, tap } from 'rxjs/operators'
import { ChatMessage, ChatMessagesSubscriptionResult, listenToChatMessages } from 'src/app/graphql/chat-messages.subscription'
import { Chat, GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { sendChatMessage } from 'src/app/graphql/send-chat-message.mutation'
import { PopupService } from 'src/app/services/popup.service'
import { Frame } from '../room/room.component'

interface PopulatedChatMessage extends ChatMessage {
  fromPlayer: Player
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  private _messages: PopulatedChatMessage[]
  @Input() frame$: Observable<Frame>
  @Input() gameInfo$: Observable<GameInfo>
  @Input() accountId$: Observable<string>
  chatId: Chat['_id']
  messages$: Observable<PopulatedChatMessage[]>
  chatMessageForm: FormGroup

  constructor(
    private apollo: Apollo,
    private popupService: PopupService
  ) { }

  ngOnInit(): void {
    combineLatest([this.frame$, this.gameInfo$]).pipe(
      tap(([frame]) => this.chatId = frame.docId)
    ).subscribe()
    this._messages = []
    this.messages$ = listenToChatMessages(this.apollo, { chatId: this.chatId }).pipe(
      switchMap(result => {
        return this.gameInfo$.pipe(
          take(1),
          map(gameInfo => <[GameInfo, FetchResult<ChatMessagesSubscriptionResult>]>[gameInfo, result])
        )
      }),
      map(([gameInfo, { data }]) => {
        this._messages.push({
          ...data.chatMessages,
          fromPlayer: gameInfo.playerById.get(data.chatMessages.fromPlayerId)
        })
        return this._messages
      })
    )
    this.chatMessageForm = new FormGroup({
      message: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(500)])
    })
  }

  /**
   * Note: if 2 messages from the same player are sent within 1 millisecond,
   * the identifier returned will be identical for both messages.
   * This is why rate limiting is important, besides, >1 message per 1 milliseond is far too fast.
   */
  chatMessageTrackBy(_index: number, chatMessage: ChatMessage) {
    return `${chatMessage.fromPlayerId}-${chatMessage.sendTime}`
  }

  async submitChatMessageForm() {
    const chatMessageControl = this.chatMessageForm.get('message')
    const message: string = chatMessageControl.value
    await this.popupService.performWithPopup(
      'Sending message',
      sendChatMessage(this.apollo, {
        chatId: this.chatId,
        message
      })
    ).toPromise()
    chatMessageControl.setValue('')
  }

}
