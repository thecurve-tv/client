import { Component, Input, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { FetchResult } from '@apollo/client/core'
import { Apollo } from 'apollo-angular'
import { Observable, zip } from 'rxjs'
import { filter, map, switchMap, take, tap } from 'rxjs/operators'
import { ChatMessage, ChatMessagesSubscriptionResult, listenToChatMessages } from 'src/app/graphql/chat-messages.subscription'
import { GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { sendChatMessage } from 'src/app/graphql/send-chat-message.mutation'
import { Account } from 'src/app/models/account'
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
  @Input() account$: Observable<Account>
  messages$: Observable<PopulatedChatMessage[]>
  chatMessageForm: FormGroup

  constructor(
    private apollo: Apollo,
    private popupService: PopupService
  ) { }

  async ngOnInit(): Promise<void> {
    this._messages = []
    this.messages$ = this.frame$.pipe(
      switchMap(frame => {
        this._messages.length = 0
        return listenToChatMessages(this.apollo, { chatId: frame.docId })
      }),
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
    await this.setChatMessageForm()
  }

  private async setChatMessageForm(): Promise<void> {
    await zip(this.account$, this.gameInfo$).pipe(
      take(1),
      filter(([account, gameInfo]) => account._id != gameInfo.hostAccount._id),
      tap(_ => {
        this.chatMessageForm = new FormGroup({
          message: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(500)])
        })
      })
    ).toPromise()
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
      this.frame$.pipe(
        take(1),
        switchMap(frame => {
          return sendChatMessage(this.apollo, {
            chatId: frame.docId,
            message
          })
        })
      )
    ).toPromise()
    chatMessageControl.setValue('')
  }

}
