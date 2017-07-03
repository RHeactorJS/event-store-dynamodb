import {list, String as StringType, irreducible, Object as ObjectType, Date as DateType} from 'tcomb'
import {MaybeStringType, AggregateIdType} from './types'

export class ModelEvent {
  /**
   * If a model is modified the modifying method should return and instance of this
   * event that represents the change
   *
   * @param {String} aggregateId The id that identifies a specific aggregate
   * @param {String} name The name of the event
   * @param {Object} data The data associated with the event
   * @param {Date} createdAt The time of the creation of the event
   * @param {String} createdBy Information about the author of the event
   */
  constructor (aggregateId, name, data = {}, createdAt = new Date(), createdBy) {
    AggregateIdType(aggregateId)
    StringType(name)
    ObjectType(data)
    DateType(createdAt)
    MaybeStringType(createdBy)
    Object.defineProperty(this, 'aggregateId', {value: aggregateId, enumerable: true})
    Object.defineProperty(this, 'name', {value: name, enumerable: true})
    Object.defineProperty(this, 'data', {value: data, enumerable: true})
    Object.defineProperty(this, 'createdAt', {value: createdAt, enumerable: true})
    Object.defineProperty(this, 'createdBy', {value: createdBy, enumerable: true})
  }
}

export const ModelEventType = irreducible('ModelEventType', x => x instanceof ModelEvent)
export const ModelEventTypeList = list(ModelEventType)
