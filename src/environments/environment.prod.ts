const API_HOST = 'https://api.thecurve.tv'
const CLIENT_URL = 'https://thecurve.tv'

export const environment = {
  production: true,
  AUTH0_CLIENT_ID: 'BaiaJbDa82tikZGqmTBDigJ6WACi0LgJ',
  AUTH0_DOMAIN: 'thecurve.eu.auth0.com',
  AUTH0_LOGOUT_URI: CLIENT_URL,
  AUTH0_REDIRECT_URI: `${CLIENT_URL}/dashboard`,
  AUTH0_API_AUDIENCE: 'https://api.thecurve.tv',
  API_HOST,
  GRAPHQL_URI: `${API_HOST}/graphql`
}
