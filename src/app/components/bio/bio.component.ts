import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { Apollo } from 'apollo-angular'
import { Observable } from 'rxjs'
import { delay, map, switchMap } from 'rxjs/operators'
import { GameInfo } from 'src/app/components/room/room.component'
import { updateBio } from 'src/app/graphql/update-bio.mutation'
import { PopupService } from 'src/app/services/popup.service'

type Player = GameInfo['players'][0]

@Component({
  selector: 'app-bio',
  templateUrl: './bio.component.html',
  styleUrls: ['./bio.component.scss']
})
export class BioComponent implements OnInit {
  private loggedInAccountId: string
  @Input() playerId: string
  @Input() gameInfo$: Observable<GameInfo>
  @Input() accountId$: Observable<string>
  @Output() bioSavedEvent = new EventEmitter()
  player$: Observable<Player>
  bioForm: FormGroup

  constructor(
    private popupService: PopupService,
    private apollo: Apollo
  ) { }

  ngOnInit(): void {
    this.player$ = this.gameInfo$.pipe(
      switchMap(({ players }) => {
        return this.accountId$.pipe(
          map(accountId => {
            this.loggedInAccountId = accountId
            return players
          })
        )
      }),
      map(players => players.find(player => {
        if (this.playerId) return player._id == this.playerId
        return player.account._id == this.loggedInAccountId
      })),
      map(player => {
        this.setBioForm(player)
        return player
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
        map(() => {
          this.bioSavedEvent.emit()
        })
      )
    ).toPromise()
  }

}
