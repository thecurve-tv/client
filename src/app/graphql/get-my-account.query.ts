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

export interface GetAccountQueryResult {
  myAccount: {
    _id: string
    email: string
  }
}

export function getMyAccount(apollo: Apollo, pollInterval?: number) {
  return apollo
    .watchQuery<GetAccountQueryResult>({
      query: GetMyAccountQuery,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval,
    })
}

export type Account = GetAccountQueryResult['myAccount']
