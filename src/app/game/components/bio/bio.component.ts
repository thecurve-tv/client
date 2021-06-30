import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Apollo } from 'apollo-angular'
import { combineLatest, Observable, of, zip } from 'rxjs'
import { delay, filter, map, switchMap, take, tap } from 'rxjs/operators'
import { createChat } from 'src/app/graphql/create-chat.mutation'
import { Chat, GameInfo, Player } from 'src/app/graphql/get-game-info.query'
import { updateBio } from 'src/app/graphql/update-bio.mutation'
import { Account } from 'src/app/models/account'
import { PopupService } from 'src/app/services/popup.service'
import { Frame } from '../room/room.component'

@Component({
  selector: 'app-bio',
  templateUrl: './bio.component.html',
  styleUrls: ['./bio.component.scss']
})
export class BioComponent implements OnInit {
  private loggedInAccountId: string
  @Input() frame$: Observable<Frame>
  @Input() gameInfo$: Observable<GameInfo>
  @Input() account$: Observable<Account>
  @Output() newFrameEvent = new EventEmitter<Frame>()
  @Output() gameInfoChangedEvent = new EventEmitter<void>()
  openPlayer$: Observable<Player>
  bioForm: FormGroup
  playerIsHost: boolean

  constructor(
    private popupService: PopupService,
    private apollo: Apollo
  ) { }

  async ngOnInit(): Promise<void> {
    await this.setOpenPlayer$()
  }

  private async setOpenPlayer$() {
    if (this.openPlayer$) return
    this.openPlayer$ = combineLatest([this.frame$, this.gameInfo$]).pipe(
      filter(([frame]) => frame.type == 'bio'),
      switchMap(frameAndGameInfo => {
        return this.account$.pipe( // refetch the logged in player's account
          tap(({ _id: accountId }) => this.loggedInAccountId = accountId),
          map(_ => frameAndGameInfo)
        )
      }),
      map(([frame, gameInfo]) => {
        let openPlayerId: string
        this.playerIsHost = this.loggedInAccountId == gameInfo.hostAccount._id
        if (this.playerIsHost) {
          openPlayerId = gameInfo.players.find(p => p.account._id != gameInfo.hostAccount._id)?._id
        } else {
          openPlayerId = frame.docId || this.loggedInAccountId
        }
        return <[string, GameInfo]>[openPlayerId, gameInfo]
      }),
      filter(([openPlayerId]) => !!openPlayerId),
      map(([openPlayerId, gameInfo]) => {
        const openPlayer = gameInfo.players.find(player => player._id == openPlayerId)
        this.setBioForm(openPlayer)
        return openPlayer
      })
    )
  }

  private setBioForm(player: Player) {
    if (player.account._id != this.loggedInAccountId) {
      this.bioForm = null
      return
    }
    this.bioForm = new FormGroup({
      name: new FormControl(player.name, [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
      age: new FormControl(player.age, [Validators.required, Validators.min(13)]),
      job: new FormControl(player.job, [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
      bio: new FormControl(player.bio, [Validators.required, Validators.minLength(1), Validators.maxLength(1000)])
    })
  }

  async submitBioForm(player: Player) {
    if (!this.bioForm.valid) return
    await this.popupService.performWithPopup(
      'Updating bio',
      updateBio(this.apollo, {
        playerId: player._id,
        name: this.bioForm.get('name').value,
        age: this.bioForm.get('age').value,
        bio: this.bioForm.get('bio').value,
        job: this.bioForm.get('job').value
      }).pipe(
        delay(2000),
        tap(() => this.gameInfoChangedEvent.emit())
      )
    ).toPromise()
  }

  async openChatWithPlayer(otherPlayer: Player): Promise<void> {
    /**
     * Check for existing chat
     * If not existing: create new chat
     * $- Name [1, 50] chars
     * $- other player is requred
     * $- Other player can't be current player
     * Navigate to new/existing chat
     * $- navigate
     * $- send gameInfo changed event
     */
    await zip(this.account$, this.gameInfo$).pipe(
      take(1),
      switchMap(([{ _id: accountId }, gameInfo]) => {
        const requestingPlayer = gameInfo.players.find(p => p.account._id == accountId)
        if (!otherPlayer?._id || otherPlayer._id === requestingPlayer._id) {
          console.error('Invalid argument provided for otherPlayer. Got', otherPlayer)
          return
        }
        const existingChat: Chat = gameInfo.chats.find(chat => {
          if (chat.players.length != 2) return
          const hasRequester = !!chat.players.find(p => p._id == requestingPlayer._id)
          const hasOtherPlayer = !!chat.players.find(p => p._id == otherPlayer._id)
          return hasRequester && hasOtherPlayer
        })
        return existingChat ? of(existingChat._id) : this.createChatWithPlayer(gameInfo._id, requestingPlayer._id, otherPlayer)
      }),
      tap(chatId => {
        this.newFrameEvent.emit({
          type: 'chat',
          docId: chatId
        })
        this.gameInfoChangedEvent.emit()
      })
    ).toPromise()
  }

  private createChatWithPlayer(gameId: GameInfo['_id'], requestingPlayerId: Player['_id'], otherPlayer: Player): Observable<Chat['_id']> {
    return of(undefined).pipe(
      switchMap(() => {
        return this.popupService.newPopup({
          type: 'info',
          message: `Ready to start a brand new chat with ${otherPlayer.name}?`,
          requireConfirmation: true
        }).valueChanges
      }),
      map(isConfirmed => {
        if (!isConfirmed) return null
        const name = prompt('What shall we call the chat?')
        if (!name || name.length > 50) {
          this.popupService.newPopup({
            type: 'error',
            message: "Chat names are required and can't be longer than 50 characters"
          })
          return
        }
        return name
      }),
      filter(name => !!name),
      switchMap(name => {
        return this.popupService.performWithPopup(
          `Creating ${name}`,
          createChat(this.apollo, {
            gameId,
            name,
            playerIds: [requestingPlayerId, otherPlayer._id]
          })
        )
      }),
      map(({ data, errors }) => {
        if (errors) console.error(errors)
        return data.chatCreate.chat._id
      })
    )
  }

}
