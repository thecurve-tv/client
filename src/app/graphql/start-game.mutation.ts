import { Apollo } from 'apollo-angular'
import { ObjectId } from 'bson'
import gql from 'graphql-tag'

const StartGameMutation = gql`
mutation StartGame ($hostPlayerName: String!, $duration: Float!) {
  gameStart(
    hostPlayerName: $hostPlayerName
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
  duration: number
}
export interface StartGameMutationResult {
  gameStart: {
    game: { _id: ObjectId, endTime: number }
    hostPlayer: { _id: ObjectId, name: string }
    chat: { _id: ObjectId, name: string }
  }
}
export function startGame(apollo: Apollo, variables: StartGameMutationVariables) {
  return apollo.mutate<StartGameMutationResult, StartGameMutationVariables>({
    mutation: StartGameMutation,
    variables,
    errorPolicy: 'all'
  })
}