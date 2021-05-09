import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetChatsQuery = gql`
query GetChats($playerIds: [MongoID!]!) {
  chatPlayerMany(filter: {
    _operators: {player: {in: $playerIds}}
  }) {
    player {
      _id
    }
    chat {
      _id
      name
    }
  }
}
`

export interface GetChatsQueryVariables {
  playerIds: string[]
}

export interface GetChatsQueryResult {
  chatPlayerMany: {
    player: { _id: string }
    chat: {
      _id: string
      name: string
    }
  }[]
}

export function getChats(apollo: Apollo, variables: GetChatsQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetChatsQueryResult, GetChatsQueryVariables>({
      query: GetChatsQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}
