import {irreducible} from 'tcomb'

export class ModelEvent {
  /**
   * If a model is modified the modifying method should return and instance of this
   * event that represents the change
   *
   * @param {String} aggregateId The id that identifies a specific aggregate
   * @param {String} name The name of the event
   * @param {object} data The data associated with the event
   * @param {Number} createdAt The time of the creation of the event
   * @param {String} createdBy Information about the author of the event
   */
  constructor (aggregateId, name, data, createdAt, createdBy) {
    Object.defineProperty(this, 'aggregateId', {value: aggregateId, enumerable: true})
    Object.defineProperty(this, 'name', {value: name, enumerable: true})
    Object.defineProperty(this, 'data', {value: data || {}, enumerable: true})
    Object.defineProperty(this, 'createdAt', {value: createdAt || Date.now(), enumerable: true})
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
