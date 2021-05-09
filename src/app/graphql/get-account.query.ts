import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetAccountQuery = gql`
query GetAccount($accountId: MongoID!) {
  accountById(_id: $accountId) {
    _id
    email
  }
}
`

export interface GetAccountQueryVariables {
  accountId: string
}

export interface GetAccountQueryResult {
  accountById: {
    _id: string
    email: string
  }
}

export function getAccount(apollo: Apollo, variables: GetAccountQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetAccountQueryResult, GetAccountQueryVariables>({
      query: GetAccountQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
