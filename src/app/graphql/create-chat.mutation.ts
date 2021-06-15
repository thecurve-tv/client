import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const CreateChatMutation = gql`
mutation CreateChat(
  $gameId: MongoID!,
  $name: String!,
  $playerIds: [MongoID!]!
) {
  chatCreate(
    gameId: $gameId
    name: $name
    playerIds: $playerIds
  ) {
    chat {
      _id
      name
      players {
        _id
        account {
          _id
          email
        }
      }
    }
    chatPlayers {
      player {
        _id
      }
    }
  }
}
`

export interface CreateChatMutationVariables {
  gameId: string
  name: string
  playerIds: string[]
}

export interface CreateChatMutationResult {
  chatCreate: {
    chat: {
      _id: string
      name: string
      players: {
        _id: string
        account: {
          email: string
        }
      }[]
    }
    chatPlayers: {
      player: {
        _id: string
      }
    }[]
  }
}

export function createChat(apollo: Apollo, variables: CreateChatMutationVariables) {
  return apollo.mutate<CreateChatMutationResult, CreateChatMutationVariables>({
    mutation: CreateChatMutation,
    variables,
    errorPolicy: 'all'
  })
}
