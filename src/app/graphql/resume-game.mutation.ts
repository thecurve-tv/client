import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const ResumeGameMutation = gql`
mutation ResumeGame($gameId: MongoID!) {
  gameUpdateById(
    _id: $gameId
    record: {
      pausedTime: null
    }
  ) {
    recordId
  }
}
`

export interface ResumeGameMutationVariables {
  gameId: string
}

export interface ResumeGameMutationResult {
  gameUpdateById: {
    recordId: string
  }
}

export function resumeGame(apollo: Apollo, variables: ResumeGameMutationVariables) {
  return apollo.mutate<ResumeGameMutationResult, ResumeGameMutationVariables>({
    mutation: ResumeGameMutation,
    variables,
    errorPolicy: 'all'
  })
}
