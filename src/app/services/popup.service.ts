import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'

import { UtilService } from './util.service'

export interface PopupConfig {
  type: 'error' | 'loading' | 'choose' | 'info'
  message?: string
}

export interface ErrorPopupConfig extends PopupConfig {
  type: 'error'
  error?: any
}

interface ChoosePopupConfigFrame {
  parent?: ChoosePopupConfigFrame
  name: string
  children: {
    id: any
    name: string
  }[]
}

export interface ChoosePopupConfig extends PopupConfig {
  type: 'choose'
  parent: ChoosePopupConfigFrame
  allowMultiSelect: boolean
  selections: ChoosePopupConfigFrame['children']
  select: (selection: ChoosePopupConfigFrame['children'][0]) => void
  up: () => void
  back: () => void
  finish: () => void
}

export interface InfoPopupConfig extends PopupConfig {
  type: 'info'
  message: string
  requireConfirmation?: boolean
  confirm?: () => void
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  public popup$: Observable<PopupConfig>

  constructor(
    private util: UtilService
  ) {
  }

  newPopup(popup: PopupConfig | ErrorPopupConfig | InfoPopupConfig) {
    if (!popup.message) popup.message = 'Something went wrong'
    if ('error' in popup && popup.error) console.error(popup.error)
    setTimeout(() => this.popup$ = of(popup), 0)
  }

  dismissPopup() {
    this.popup$ = null
  }

  performWithPopup<T>(message: string, obs: Observable<T>): Observable<T> {
    return of(undefined).pipe(
      // display the loading popup
      map(() => this.newPopup({
        type: 'loading',
        message: message
      })),
      // subscribe to the provided observable
      switchMap(_ => obs),
      // handle any errors
      catchError(err => {
        console.error(err)
        this.newPopup({
          type: 'error',
          message: err.message || err
        })
        throw err // re-throw the error
      }),
      // dismiss the popup & produce the result
      map(res => {
        this.dismissPopup()
        return res
      })
    )
  }
}
