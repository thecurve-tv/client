import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { catchError } from 'rxjs/operators'
import { Observable, of } from 'rxjs'

import { Account } from 'src/app/models/account'
import { QueryPopulateOptions } from 'src/app/models/_mongodb.types'
import { environment } from 'src/environments/environment'


export interface QueryOptions {
  populate?: QueryPopulateOptions[],
  projection?: { [include: string]: 1 } | { [exclude: string]: 0 }
}

export interface SearchQueryOptions {
  sort?: { [ascSortKey: string]: 1 } | { [decSortKey: string]: -1 },
  limit?: number,
  skip?: number
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(
    private http: HttpClient,
  ) { }

  private handleError<T>(result?: T) {
    return (error: unknown): Observable<T> => {
      console.error(error)
      // this.log(`${operation} failed: ${error.message}`);
      if (result !== undefined) return of(result)
      else return of<T>()
    }
  }

  public getAccountId(): Observable<Account> {
    if (environment.test) return of(environment.DEV_ACCOUNT)
    return this.http.get<Account>(`${environment.API_HOST}/accounts`).pipe(
      catchError(this.handleError<Account>()),
    )
  }
}
