import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const UpdateBioMutation = gql`
mutation UpdateBio(
  $playerId: MongoID!
  $name: String!
  $age: Float!
  $job: String!
  $bio: String!
) {
  playerUpdateById(
    _id: $playerId
    record: {
      name: $name
      age: $age
      job: $job
      bio: $bio
    }
  ) {
    recordId
  }
}
`

export interface UpdateBioMutationVariables {
  playerId: string
  name: string
  age: number
  job: string
  bio: string
}

export interface UpdateBioMutationResult {
  recordId: string
}

export function updateBio(apollo: Apollo, variables: UpdateBioMutationVariables) {
  return apollo.mutate<UpdateBioMutationResult, UpdateBioMutationVariables>({
    mutation: UpdateBioMutation,
    variables,
    errorPolicy: 'all'
  })
}
