const API_HOST = 'http://localhost:3000'
const CLIENT_URL = 'https://localhost:4200'

export const environment = {
  // Flags
  production: false,
  test: false,
  // Constants
  DEV_ACCOUNT: undefined,
  API_HOST,
  CLIENT_URL,
  // Services
  AUTH0_CLIENT_ID: 'BaiaJbDa82tikZGqmTBDigJ6WACi0LgJ',
  AUTH0_DOMAIN: 'thecurve.eu.auth0.com',
  AUTH0_LOGOUT_URI: CLIENT_URL,
  AUTH0_REDIRECT_URI: CLIENT_URL,
  AUTH0_API_AUDIENCE: 'https://api.thecurve.tv',
  GRAPHQL_URI: `${API_HOST}/graphql`,
  GRAPHQL_WS_URI: 'ws://localhost:3000/graphql'
}
