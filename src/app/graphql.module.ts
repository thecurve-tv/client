import { NgModule } from '@angular/core'
import { APOLLO_OPTIONS } from 'apollo-angular'
import { ApolloClientOptions, ApolloLink, InMemoryCache } from '@apollo/client/core'
import { onError } from '@apollo/client/link/error'
import { HttpLink } from 'apollo-angular/http'
import { environment } from 'src/environments/environment'

export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  const httpLinkHandler = httpLink.create({ uri: environment.GRAPHQL_URI })
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        ),
      )
    }
    if (networkError) console.error('[Network error]: ', networkError)
  })
  return {
    link: ApolloLink.from([errorLink, httpLinkHandler]),
    cache: new InMemoryCache(),
  }
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule { }
