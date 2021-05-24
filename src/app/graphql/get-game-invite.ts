import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetGameInviteQuery = gql`
query GetGameInvite($gameId: MongoID!) {
  gameGetInvite(gameId: $gameId) {
    _id
    hostAccount {
      _id
      email
    }
    maxPlayerCount
    endTime
    pausedTime
    gameStatus
  }
}
`

export interface GetGameInviteQueryVariables {
  gameId: string
}

export interface GetGameInviteQueryResult {
  gameGetInvite: {
    _id: string
    hostAccount: {
      _id: string
      email: string
    }
    maxPlayerCount: number
    endTime: number
    pausedTime: number
    gameStatus: 'OPEN' | 'FULL' | 'CLOSED'
  }
}

export function getGameInvite(apollo: Apollo, variables: GetGameInviteQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetGameInviteQueryResult, GetGameInviteQueryVariables>({
      query: GetGameInviteQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
