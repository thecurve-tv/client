const API_HOST = 'https://api.thecurve.tv'
const CLIENT_URL = 'https://thecurve.tv'

export const environment = {
  // Flags
  production: true,
  test: false,
  // Constants
  DEV_ACCOUNT: undefined,
  API_HOST,
  CLIENT_URL,
  // Services
  AUTH0_CLIENT_ID: 'BaiaJbDa82tikZGqmTBDigJ6WACi0LgJ',
  AUTH0_DOMAIN: 'thecurve.eu.auth0.com',
  AUTH0_LOGOUT_URI: CLIENT_URL,
  AUTH0_REDIRECT_URI: `${CLIENT_URL}/authorize`,
  AUTH0_API_AUDIENCE: 'https://api.thecurve.tv',
  GRAPHQL_URI: `${API_HOST}/graphql`,
  GRAPHQL_WS_URI: 'ws://api.thecurve.tv/graphql'
}
