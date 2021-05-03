import { Apollo } from 'apollo-angular'
import { ObjectId } from 'bson'
import gql from 'graphql-tag'

const GetActiveGamesQuery = gql`
query GetActiveGames ($accountId: MongoID!, $now: Float!) {
  gameMany(filter: {
    hostAccount: $accountId,
    _operators: {endTime: {gt: $now}}
  }) {
    _id
  }
}
`
export interface GetActiveGamesQueryVariables {
  accountId: ObjectId
  now: number
}
export interface GetActiveGamesQueryResult {
  gameMany: {
    _id: ObjectId
  }[]
}
export function getActiveGames(apollo: Apollo, variables: GetActiveGamesQueryVariables) {
  return apollo
    .watchQuery<GetActiveGamesQueryResult, GetActiveGamesQueryVariables>({
      query: GetActiveGamesQuery,
      variables,
      errorPolicy: 'all'
    })
    .valueChanges
}