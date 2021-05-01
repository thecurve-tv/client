import { ObjectId } from 'bson'

export class Schema {
  _id?: ObjectId
  _log: {
    createdDate: number,
  }
}