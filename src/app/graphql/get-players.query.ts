import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetPlayersQuery = gql`
query GetPlayers($gameId: MongoID!) {
  playerMany(filter: {
    game: $gameId
  }) {
    _id
    name
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
}
`

export interface GetPlayersQueryVariables {
  gameId: string
}

export interface GetPlayersQueryResult {
  playerMany: {
    _id: string
    name: string
    bio: string
    photo?: {
      _id: string
      uri: string
      alt: string
    }
    account?: {
      _id: string
    }
  }[]
}

export function getPlayers(apollo: Apollo, variables: GetPlayersQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetPlayersQueryResult, GetPlayersQueryVariables>({
      query: GetPlayersQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
