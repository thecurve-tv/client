import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const GetRankingsQuery = gql`
query GetRankings($gameId: MongoID!) {
  rankingMany(
    filter: {
      game: $gameId
    }
  ) {
    _id
    ratings
    completedTime
  }
}
`

export interface GetRankingsQueryVariables {
  gameId: string
}

export interface GetRankingsQueryResult {
  rankingMany: {
    _id: string
    ratings: Record<string, Record<string, number>>
    completedTime?: number
  }[]
}

export function getRankings(apollo: Apollo, variables: GetRankingsQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetRankingsQueryResult, GetRankingsQueryVariables>({
      query: GetRankingsQuery,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval,
    })
}

export type Ranking = GetRankingsQueryResult['rankingMany'][0]
