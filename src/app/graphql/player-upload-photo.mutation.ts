import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const PlayerUploadPhotoMutation = gql`
mutation PlayerUploadPhoto(
  $playerId: MongoID!
  $file: Upload!
) {
  playerUploadPhoto(
    _id: $playerId
    file: $file
  ) {
    uri
    alt
    metadata
  }
}
`

export interface PlayerUploadPhotoMutationVariables {
  playerId: string
  file: File
}

export interface PlayerUploadPhotoMutationResult {
  playerUploadPhoto: {
    uri: string
    alt: string
    metadata: Record<string, unknown>
  }
}

export function playerUploadPhoto(apollo: Apollo, variables: PlayerUploadPhotoMutationVariables) {
  return apollo.mutate<PlayerUploadPhotoMutationResult, PlayerUploadPhotoMutationVariables>({
    mutation: PlayerUploadPhotoMutation,
    variables,
    errorPolicy: 'all',
  })
}
