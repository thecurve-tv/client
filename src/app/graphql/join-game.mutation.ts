import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const JoinGameMutation = gql`
mutation JoinGame($gameId: MongoID!, $playerName: String!) {
  gameJoin(
    gameId: $gameId
    playerName: $playerName
  ) {
    game {
      _id
    	mainChat {
        _id
      }
    }
    player {
      _id
    }
  }
}
`

export interface JoinGameMutationVariables {
  gameId: string
  playerName: string
}

export interface JoinGameMutationResult {
  gameJoin: {
    game: {
      _id: string
      mainChat: { _id: string }
    }
    player: { _id: string }
  }
}

export function joinGame(apollo: Apollo, variables: JoinGameMutationVariables) {
  return apollo.mutate<JoinGameMutationResult, JoinGameMutationVariables>({
    mutation: JoinGameMutation,
    variables,
    errorPolicy: 'all'
  })
}
