import { Component, Input, OnInit } from '@angular/core'
import { Popup, PopupService } from 'src/app/services/popup.service'

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {
  @Input() readonly popup: Popup<any, any>

  constructor(
    public popupService: PopupService
  ) {
  }

  ngOnInit(): void {
  }

  dismiss() {
    this.popup.dismiss()
  }
}
