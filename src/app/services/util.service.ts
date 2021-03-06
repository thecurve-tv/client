import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  /**
   * Parses an HTML date string
   * @param dateStr '<year>-<month 1-based>-<day 1-based>'
   * @param isFromHTMLDateField use to toggle if it's from a date field
   */
  public parseDateStr(dateStr: string, isFromHTMLDateField = false) {
    const parts = dateStr.split("-").map(part => parseInt(part))
    if (isFromHTMLDateField) parts[1]--
    return new Date(parts[0], parts[1], parts.length > 2 ? parts[2] : null)
  }

  /**
   * Converts a UTC Date object to an HTML `datetime-local` string
   * @param date date in UTC
   */
  public toHTMLDatetime(date: string | number | Date): string {
    const utcDate = new Date(date)
    const adjustedDate = new Date(utcDate.getTime() - (new Date().getTimezoneOffset() * 60000))
    const dateStr = adjustedDate.toISOString()
    return dateStr.substr(0, dateStr.length - 1)
  }

  public padTime(num: number) {
    const str = `${num}`
    if (str.length >= 2) return str
    return `0${str}`
  }

  /**
   * Converts a Date object to an HTML `date` string: `2020-12-31`
   */
  public toHTMLDate(dateInUTC: string | number | Date): string {
    const utcDate = new Date(dateInUTC)
    // 2020-12-31 |  month is 0-based in JS and 1-based in HTML
    return `${utcDate.getFullYear()}-${this.padTime(utcDate.getMonth() + 1)}-${this.padTime(utcDate.getDate())}`
  }

  /**
   * Converts an HTML `date` string to a Date object
   */
  public fromHTMLDate(dateStrInLocalTime: string): Date {
    const utcDate = new Date(dateStrInLocalTime)
    // convert (2020-09-01T00:00:00 Z | 2020-08-31T20:00:00 -0400) to (2020-09-01T00:00:00 -0400 | 2020-09-01T04:00:00 Z)
    // Date constructor returns a UTC time. use the calculated timezone offset to set the correct time
    utcDate.setMinutes(utcDate.getMinutes() + utcDate.getTimezoneOffset())
    return utcDate
  }

  public convert24HrTo12Hr(time: string): string {
    const parts = time.split(':').map(part => parseInt(part))
    const isPM = parts[0] == 0 || parts[0] > 12
    if (parts[0] == 0) parts[0] = 24
    if (parts[0] > 12) parts[0] -= 12
    return `${parts.map(this.padTime).join(':')} ${isPM ? 'PM' : 'AM'}`
  }

  public parseTimeStr(time: string): number[] {
    return time.split(':').map(part => parseInt(part))
  }

  public promiseToObservable<T>(func: () => Promise<T>): Observable<T> {
    return new Observable(sub => {
      func()
        .then(res => {
          sub.next(res)
          sub.complete()
        })
        .catch(err => sub.error(err))
    })
  }

  getGameTimeLeftStr(endTime: number, pausedTime?: number, appendStr?: string): string {
    if (pausedTime) return 'PAUSED'
    const now = Date.now()
    if (endTime <= now) return 'ENDED'
    const timeLeft = endTime - now
    const oneMin = 60 * 1000
    if (timeLeft <= 2 * oneMin) return 'ENDING' // cutoff time is (endTime - 60s), so don't catch the user by surprise
    const hoursLeft = Math.floor(timeLeft / (60 * oneMin))
    const minsLeft = Math.floor((timeLeft - (hoursLeft * 60 * oneMin)) / oneMin)
    const hoursLeftStr = hoursLeft > 0 ? `${hoursLeft} hr` : ''
    const minsLeftStr = minsLeft > 0 ? `${minsLeft} min` : ''
    const timeLeftStr = `${hoursLeftStr} ${minsLeftStr}`.trim()
    if (appendStr) return `${timeLeftStr}${appendStr}`
    return timeLeftStr
  }
}
