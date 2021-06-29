import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'

const ChatMessagesSubscription = gql`
subscription ChatMessages(
  $chatId: MongoID!
) {
  chatMessages(
    chatId: $chatId
  ) {
    fromPlayerId
    sentTime
    message
  }
}
`

export interface ChatMessagesSubscriptionVariables {
  chatId: string
}

export interface ChatMessagesSubscriptionResult {
  chatMessages: {
    fromPlayerId: string
    sendTime: number
    message: string
  }
}

export type ChatMessage = ChatMessagesSubscriptionResult['chatMessages']

export function listenToChatMessages(apollo: Apollo, variables: ChatMessagesSubscriptionVariables) {
  return apollo.subscribe<ChatMessagesSubscriptionResult, ChatMessagesSubscriptionVariables>({
    query: ChatMessagesSubscription,
    variables,
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  })
}
