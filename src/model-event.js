import {irreducible, String as StringType, Date as DateType, Object as ObjectType, maybe} from 'tcomb'
const MaybeStringType = maybe(StringType)

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
    StringType(aggregateId)
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

  /**
   * Returns true if x is of type ModelEvent
   *
   * @param {object} x
   * @returns {boolean}
   */
  static is (x) {
    return (x instanceof ModelEvent) || (x && x.constructor && x.constructor.name === ModelEvent.name && 'aggregateId' in x && 'name' in x && 'data' in x && 'createdAt' in x && 'createdBy' in x)
  }
}

export const ModelEventType = irreducible('ModelEventType', ModelEvent.is)
