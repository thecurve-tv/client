import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const StartRankingMutation = gql`
mutation StartRanking(
  $gameId: MongoID!
) {
  rankingStart(
    game: $gameId
  ) {
    _id
  }
}
`

export interface StartRankingMutationVariables {
  gameId: string
}

export interface StartRankingMutationResult {
  rankingStart: {
    _id: string
  }
}

export function startRanking(apollo: Apollo, variables: StartRankingMutationVariables) {
  return apollo.mutate<StartRankingMutationResult, StartRankingMutationVariables>({
    mutation: StartRankingMutation,
    variables,
    errorPolicy: 'all',
  })
}
