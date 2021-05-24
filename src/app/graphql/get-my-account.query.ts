import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetMyAccountQuery = gql`
query GetMyAccount {
  myAccount {
    _id
    email
  }
}
`

export interface GetMyAccountQueryVariables { }

export interface GetAccountQueryResult {
  myAccount: {
    _id: string
    email: string
  }
}

export function getMyAccount(apollo: Apollo, variables: GetMyAccountQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetAccountQueryResult, GetMyAccountQueryVariables>({
      query: GetMyAccountQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
