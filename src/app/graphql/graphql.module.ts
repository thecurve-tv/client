import { NgModule } from '@angular/core'
import { ApolloClientOptions, ApolloLink, InMemoryCache, split } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { AuthService } from '@auth0/auth0-angular'
import { APOLLO_OPTIONS } from 'apollo-angular'
import { HttpLink } from 'apollo-angular/http'
import { OperationDefinitionNode } from 'graphql'
import { environment } from 'src/environments/environment'

export function createApolloFactory(httpLink: HttpLink, authService: AuthService): ApolloClientOptions<any> {
  const httpLinkHandler = httpLink.create({ uri: environment.GRAPHQL_URI })
  const wsLinkHandler = new WebSocketLink({
    uri: environment.GRAPHQL_WS_URI,
    options: {
      reconnect: true,
      connectionParams: async () => {
        const accessToken: string = await authService.getAccessTokenSilently().toPromise()
        return {
          authorization: `Bearer ${accessToken}`
        }
      },
      reconnectionAttempts: 1
    },
  })
  const httpAndWsLink = split(
    // split based on operation type
    ({ query }) => {
      const def = getMainDefinition(query)
      const isAnOperation = def.kind === 'OperationDefinition'
      return isAnOperation && (<OperationDefinitionNode>def).operation === 'subscription'
    },
    wsLinkHandler,
    httpLinkHandler,
  )
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations, null, 2)}, Path: ${path}`,
        ),
      )
    }
    if (networkError) console.error('[Network error]: ', networkError)
  })
  return {
    link: ApolloLink.from([errorLink, httpAndWsLink]),
    cache: new InMemoryCache(),
  }
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApolloFactory,
      deps: [HttpLink, AuthService],
    },
  ],
})
export class GraphQLModule { }
