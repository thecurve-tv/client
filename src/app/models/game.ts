import { ObjectId } from 'bson'
import { Schema } from './_schema'

export interface GameSearchOptions {
  host: ObjectId
}

export class Game extends Schema {
  host: ObjectId
}
