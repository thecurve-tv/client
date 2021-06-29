import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const SendChatMessageMutation = gql`
mutation SendChatMessage(
  $chatId: MongoID!
  $message: String!
) {
  chatSendMessage(
    chatId: $chatId
    message: $message
  ) {
    sentTime
  }
}
`

export interface SendChatMessageMutationVariables {
  chatId: string
  message: string
}

export interface SendChatMessageMutationResult {
  chatSendMessage: {
    sentTime: number
  }
}

export function sendChatMessage(apollo: Apollo, variables: SendChatMessageMutationVariables) {
  return apollo.mutate<SendChatMessageMutationResult, SendChatMessageMutationVariables>({
    mutation: SendChatMessageMutation,
    variables,
    errorPolicy: 'all'
  })
}
