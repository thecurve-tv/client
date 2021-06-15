import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetGameQuery = gql`
query GetGame($gameId: MongoID!) {
  gameById(_id: $gameId) {
    _id
    hostAccount {
      _id
      email
    }
    maxPlayerCount
    endTime
    pausedTime
    mainChat {
      _id
    }
  }
}
`

export interface GetGameQueryVariables {
  gameId: string
}

export interface GetGameQueryResult {
  gameById: {
    _id: string
    hostAccount: {
      _id: string
      email: string
    }
    maxPlayerCount: number
    endTime: number
    pausedTime: number
    mainChat: {
      _id: string
    }
  }
}

export function getGame(apollo: Apollo, variables: GetGameQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetGameQueryResult, GetGameQueryVariables>({
      query: GetGameQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
