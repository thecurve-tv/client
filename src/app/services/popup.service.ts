import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable, of, Subject } from 'rxjs'
import { catchError, filter, last, map, switchMap, take, tap } from 'rxjs/operators'

export interface PopupConfig {
  type: 'error' | 'loading' | 'choose' | 'info' | 'upload'
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
  title?: string
  requireConfirmation?: boolean
  confirm?: () => void
}

export interface UploadPopupConfig extends PopupConfig {
  type: 'upload'
  message: string
  mimeType: string
  title?: string
  selectedFiles?: File[]
}

export class Popup<TConfig extends PopupConfig, TValue> {
  private isDismissed: boolean
  readonly valueChanges = new Subject<TValue>()

  constructor(
    public config: TConfig,
    private popup$: BehaviorSubject<Popup<any, any>>,
  ) { }

  next(value?: TValue) {
    this.valueChanges.next(value)
  }

  async dismiss(finalValue?: TValue): Promise<void> {
    await of(this.isDismissed).pipe(
      filter(isDimissed => !isDimissed),
      map(() => {
        if (finalValue !== undefined) this.next(finalValue)
        this.valueChanges.complete()
      }),
      switchMap(() => this.popup$),
      take(1),
      map(currentPopup => {
        this.isDismissed = true
        if (currentPopup == this) this.popup$.next(null)
      }),
    ).toPromise()
  }
}

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  public popup$ = new BehaviorSubject<Popup<any, any>>(null)

  newPopup(config: UploadPopupConfig): Popup<UploadPopupConfig, File[] | undefined>
  newPopup(config: InfoPopupConfig): Popup<InfoPopupConfig, boolean>
  newPopup(config: PopupConfig): Popup<PopupConfig, void>
  newPopup<TConfig extends PopupConfig, TValue>(config: TConfig): Popup<TConfig, TValue> {
    if (!config.message) config.message = 'Something went wrong'
    if ('error' in config) {
      const error = (<ErrorPopupConfig>config).error
      if (error) console.error(error)
    }
    const popup = new Popup<TConfig, TValue>(config, this.popup$)
    setTimeout(() => this.popup$.next(popup))
    return popup
  }

  performWithPopup<T>(message: string, obs: Observable<T>): Observable<T> {
    // display the loading popup
    return new Observable(sub => {
      const popup = this.newPopup({
        type: 'loading',
        message: message,
      })
      // subscribe to the provided observable
      obs.pipe(
        // handle any errors
        catchError(err => {
          console.error(err)
          this.newPopup({
            type: 'error',
            message: err.message || err,
          })
          throw err // re-throw the error
        }),
        // wait till last value is returned
        last(),
        // dismiss the popup & release the result
        tap(() => popup.dismiss()),
      ).subscribe(sub)
    })
  }
}
