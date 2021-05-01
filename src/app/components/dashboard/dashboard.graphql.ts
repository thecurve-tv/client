import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag'
import { Game } from 'src/app/models/game'

const GetActiveGamesQuery = gql`
query GetActiveGames ($accountId: MongoID, $now: Float) {
  gameMany(filter: {
    hostAccount: $accountId,
    _operators: {endTime: {gt: $now}}
  }) {
    _id
  }
}
`
export interface GetActiveGamesQueryVariables {
  accountId: Game['_id']
  now: number
}
export interface GetActiveGamesQueryResult {
  gameMany: {
    _id: Game['_id']
  }[]
}
export function getActiveGames(apollo: Apollo, variables: GetActiveGamesQueryVariables) {
  return apollo
    .watchQuery<GetActiveGamesQueryResult, GetActiveGamesQueryVariables>({
      query: GetActiveGamesQuery,
      variables
    })
    .valueChanges
}
