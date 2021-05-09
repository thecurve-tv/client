import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const StartGameMutation = gql`
mutation StartGame(
  $hostPlayerName: String!
  $maxPlayerCount: Int!
  $duration: Int!
) {
  gameStart(
    hostPlayerName: $hostPlayerName
    maxPlayerCount: $maxPlayerCount
    duration: $duration
  ) {
    game {
      _id
      endTime
    }
    hostPlayer {
      _id
      name
    }
    chat {
      _id
      name
    }
  }
}
`

export interface StartGameMutationVariables {
  hostPlayerName: string
  maxPlayerCount: number
  duration: number
}

export interface StartGameMutationResult {
  gameStart: {
    game: { _id: string, endTime: number }
    hostPlayer: { _id: string, name: string }
    chat: { _id: string, name: string }
  }
}

export function startGame(apollo: Apollo, variables: StartGameMutationVariables) {
  return apollo.mutate<StartGameMutationResult, StartGameMutationVariables>({
    mutation: StartGameMutation,
    variables,
    errorPolicy: 'all'
  })
}
