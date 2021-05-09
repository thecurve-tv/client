import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const StopGameMutation = gql`
mutation StopGame($gameId: MongoID!) {
  gameStop(_id: $gameId) {
    _id
  }
}
`

export interface StopGameMutationVariables {
  gameId: string
}

export interface StopGameMutationResult {
  gameStop: {
    _id: string
  }
}

export function stopGame(apollo: Apollo, variables: StopGameMutationVariables) {
  return apollo.mutate<StopGameMutationResult, StopGameMutationVariables>({
    mutation: StopGameMutation,
    variables,
    errorPolicy: 'all'
  })
}
