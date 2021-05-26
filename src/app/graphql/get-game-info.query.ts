import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetGameInfo = gql`
query GetGameInfo($gameId: MongoID!) {
  gameById(_id: $gameId) {
    _id
    endTime
    pausedTime
    maxPlayerCount
    mainChat {
      _id
    }
    hostAccount {
      _id
    }
    players {
      _id
      name
      age
      job
      bio
      photo {
        _id
        uri
        alt
      }
      account {
        _id
      }
    }
    chats {
      _id
      name
      players {
        _id
      }
    }
  }
}
`

export interface GetGameInfoQueryVariables {
  gameId: string
}

export interface GetGameInfoQueryResult {
  gameById: {
    _id: string
    endTime: number
    pausedTime: number
    maxPlayerCount: number
    mainChat: {
      _id: string
    }
    hostAccount: {
      _id: string
    }
    players: {
      _id: string
      name: string
      age: number
      job: string
      bio: string
      photo?: {
        _id: string
        uri: string
        alt: string
      }
      account: {
        _id: string
      }
    }[]
    chats: {
      _id: string
      name: string
      players: {
        _id: string
      }[]
    }[]
  }
}

export function getGameInfo(apollo: Apollo, variables: GetGameInfoQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetGameInfoQueryResult, GetGameInfoQueryVariables>({
      query: GetGameInfo,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
