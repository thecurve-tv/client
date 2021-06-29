// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const API_HOST = 'http://localhost:3000'
const CLIENT_URL = 'https://localhost:4200'

export const environment = {
  production: false,
  AUTH0_CLIENT_ID: 'BaiaJbDa82tikZGqmTBDigJ6WACi0LgJ',
  AUTH0_DOMAIN: 'thecurve.eu.auth0.com',
  AUTH0_LOGOUT_URI: CLIENT_URL,
  AUTH0_REDIRECT_URI: CLIENT_URL,
  AUTH0_API_AUDIENCE: 'https://api.thecurve.tv',
  API_HOST,
  CLIENT_URL,
  GRAPHQL_URI: `${API_HOST}/graphql`,
  GRAPHQL_WS_URI: 'ws://localhost:3000/graphql'
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
