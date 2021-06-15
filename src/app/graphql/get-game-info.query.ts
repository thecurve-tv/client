import { Apollo } from 'apollo-angular'
import gql from 'graphql-tag'
import { OperatorFunction } from 'rxjs'
import { map } from 'rxjs/operators'

const GetGameInfo = gql`
query GetGameInfo($gameId: MongoID!) {
  gameById(_id: $gameId) {
    _id
    endTime
    pausedTime
    maxPlayerCount
    mainChat {
      _id
    }
    hostAccount {
      _id
    }
    players {
      _id
      name
      age
      job
      bio
      photo {
        _id
        uri
        alt
      }
      account {
        _id
      }
    }
    chats {
      _id
      name
      players {
        _id
      }
    }
  }
}
`

export interface GetGameInfoQueryVariables {
  gameId: string
}

export interface GetGameInfoQueryResult {
  gameById: {
    _id: string
    endTime: number
    pausedTime: number
    maxPlayerCount: number
    mainChat: {
      _id: string
    }
    hostAccount: {
      _id: string
    }
    players: {
      _id: string
      name: string
      age: number
      job: string
      bio: string
      photo?: {
        _id: string
        uri: string
        alt: string
      }
      account: {
        _id: string
      }
    }[]
    chats: {
      _id: string
      name: string
      players: {
        _id: string
      }[]
    }[]
  }
}

export function getGameInfo(apollo: Apollo, variables: GetGameInfoQueryVariables, pollInterval?: number) {
  return apollo
    .watchQuery<GetGameInfoQueryResult, GetGameInfoQueryVariables>({
      query: GetGameInfo,
      variables,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
      pollInterval
    })
}

export type Player = Required<GetGameInfoQueryResult['gameById']['players'][0]>
export type Chat = GetGameInfoQueryResult['gameById']['chats'][0]
/**
 * Don't forget to use the {@link this.mapGameInfoPointers} rxjs operator to convert the raw GraphQL
 * data to a useable format.
 */
export type GameInfo = Omit<GetGameInfoQueryResult['gameById'], 'mainChat' | 'players' | 'chats'> & {
  mainChat: Chat
  players: Player[]
  chats: (
    Omit<Chat, 'players'> & { players: Player[] }
  )[]
  playerById: Map<Player['_id'], Player>
  chatById: Map<Chat['_id'], Chat>
}

/**
 * 1. Privately stores every chat & player in maps
 * 2. Applies a getter on every chat & player object to reference the full object from the maps
 * (e.g. game.mainChat gives just the _id in the raw data but after applying the getters,
 * it will magically surface the matching chat object from game.chats)
 * 3. Inserts the default photo metadata for all players who don't have a photo
 */
export function mapGameInfoPointers(): OperatorFunction<GetGameInfoQueryResult, GameInfo> {
  return map((gameInfo: GetGameInfoQueryResult) => {
    const players = gameInfo.gameById.players.map(_player => {
      const photo = _player.photo || {
        _id: null,
        uri: '/assets/default-profile-photo.png',
        alt: 'Default profile photo'
      }
      return {
        ..._player,
        photo
      }
    })
    const playerById = new Map(
      players.map(player => [player._id, player])
    )
    const chatById = new Map(
      gameInfo.gameById.chats.map(chat => [chat._id, chat])
    )
    const mappedGameInfo: GameInfo = {
      ...gameInfo.gameById,
      mainChat: chatById.get(gameInfo.gameById.mainChat._id),
      players,
      get chats() { // lazy loaded
        delete this.chats
        return this.chats = [...chatById.values()].map(chat => {
          return {
            ...chat,
            get players() {
              return chat.players.map(chatPlayer => {
                return playerById.get(chatPlayer._id)
              })
            }
          }
        })
      },
      playerById,
      chatById
    }
    return mappedGameInfo
  })
}
