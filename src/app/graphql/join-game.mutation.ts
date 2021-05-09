import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const JoinGameMutation = gql`
mutation JoinGame($gameId: MongoID!, $playerName: String!) {
  gameJoin(
    gameId: $gameId
    playerName: $playerName
  ) {
    _id
    mainChat
  }
}
`

export interface JoinGameMutationVariables {
  gameId: string
  playerName: string
}

export interface JoinGameMutationResult {
  gameJoin: {
    _id: string
    mainChat: string
  }
}

export function joinGame(apollo: Apollo, variables: JoinGameMutationVariables) {
  return apollo.mutate<JoinGameMutationResult, JoinGameMutationVariables>({
    mutation: JoinGameMutation,
    variables,
    errorPolicy: 'all'
  })
}
