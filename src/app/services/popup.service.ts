import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { UtilService } from './util.service';
import { ErrorCodes } from './ErrorCodes';

export interface PopupConfig {
  type: 'error' | 'loading' | undefined
  message?: string
}

export interface ErrorPopupConfig extends PopupConfig {
  type: 'error'
  error?: any
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

  newPopup(popup: ErrorPopupConfig | PopupConfig) {
    if (!popup.message) popup.message = 'Something went wrong'
    if ('error' in popup && popup.error) console.error(popup.error)
    this.popup$ = of(popup)
  }

  dismissPopup() {
    this.popup$ = null
  }

  performWithPopup<T>(message: string, obs: Observable<T>, knownErr?: ErrorCodes): Observable<T> {
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
        if (!knownErr || !this.util.errorMatchesCode(knownErr, err)) {
          console.error(err)
        }
        this.newPopup({
          type: 'error',
          message: this.util.getErrorCode(err)
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
