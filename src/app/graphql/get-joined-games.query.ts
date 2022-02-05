import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetJoinedGamesQuery = gql`
query GetJoinedGames {
  myAccount {
    players {
      name
      photo {
        _id
        uri
        alt
      }
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

export interface GetJoinedGamesQueryResult {
  myAccount: {
    players: {
      name: string
      photo: {
        _id: string
        uri: string
        alt: string
      }
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

export function getJoinedGames(apollo: Apollo, pollInterval?: number) {
  return apollo
    .watchQuery<GetJoinedGamesQueryResult>({
      query: GetJoinedGamesQuery,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval,
    })
}
