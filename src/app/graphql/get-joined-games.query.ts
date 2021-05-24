import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetJoinedGamesQuery = gql`
query GetJoinedGames {
  myAccount {
    players {
      name
      game {
        _id
        hostAccount {
          _id
        }
        startTime
        endTime
        pausedTime
        mainChat {
          _id
        }
    	}
    }
  }
}
`

export interface GetJoinedGamesQueryVariables { }

export interface GetJoinedGamesQueryResult {
  myAccount: {
    players: {
      name: string
      game: {
        _id: string
        hostAccount: { _id: string }
        startTime: number
        endTime: number
        pausedTime?: number
        mainChat: { _id: string }
      }
    }[]
  }
}

export function getJoinedGames(apollo: Apollo, variables: GetJoinedGamesQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetJoinedGamesQueryResult, GetJoinedGamesQueryVariables>({
      query: GetJoinedGamesQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
