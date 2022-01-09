import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const RankingPutRatingsMutation = gql`
mutation RankingPutRatings(
  $rankingId: MongoID!
  $ratings: [RankingRatingInput!]!
) {
  rankingPutRatings(
    _id: $rankingId
    ratings: $ratings
  )
}
`

export interface RankingPutRatingsMutationVariables {
  rankingId: string
  ratings: {
    player: string
    position: number
  }[]
}

export interface RankingPutRatingsMutationResult {
  rankingStart: boolean
}

export function rankingPutRatings(apollo: Apollo, variables: RankingPutRatingsMutationVariables) {
  return apollo.mutate<RankingPutRatingsMutationResult, RankingPutRatingsMutationVariables>({
    mutation: RankingPutRatingsMutation,
    variables,
    errorPolicy: 'all',
  })
}
