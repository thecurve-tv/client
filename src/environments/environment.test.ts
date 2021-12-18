const API_HOST = 'http://localhost:3000'
const CLIENT_URL = 'http://localhost:4200'

export const environment = {
  // Flags
  production: false,
  test: true,
  // Constants
  API_HOST,
  CLIENT_URL,
  DEV_ACCOUNT: {
    _id: '61bcd4891ebdaeee02eb0288',
    auth0Id: 'auth0|61bbdb36d27de7006aba0343',
    email: 'client_e2e@thecurve.tv',
    _log: {
      createdDate: 1639765224832,
    }
  },
  // Services
  AUTH0_CLIENT_ID: 'HWeCVnjFwyEIgJS1SNjrJ0uRY7YFQAYN',
  AUTH0_DOMAIN: 'thecurve.eu.auth0.com',
  AUTH0_LOGOUT_URI: CLIENT_URL,
  AUTH0_REDIRECT_URI: CLIENT_URL,
  AUTH0_API_AUDIENCE: 'https://test.thecurve.tv',
  GRAPHQL_URI: `${API_HOST}/graphql`,
  GRAPHQL_WS_URI: 'ws://localhost:3000/graphql'
}
