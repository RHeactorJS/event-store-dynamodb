const t = require('tcomb')
const {PositiveInteger} = require('./types')

class ModelEvent {
  /**
   * If a model is modified the modifying method should return and instance of this
   * event that represents the change
   *
   * @param {String} aggregateId The id that identifies a specific aggregateName
   * @param {Number} aggregateVersion The version of the aggregateName
   * @param {String} name The name of the event
   * @param {Object} payload The payload of the event
   * @param {Date} createdAt The time of the creation of the event
   */
  constructor (aggregateId, aggregateVersion, name, payload = {}, createdAt = new Date()) {
    Object.defineProperty(this, 'aggregateId', {value: t.String(aggregateId, ['ModelEvent()', ['aggregateId:AggregateId']]), enumerable: true})
    Object.defineProperty(this, 'aggregateVersion', {value: PositiveInteger(aggregateVersion, ['ModelEvent()', ['aggregateVersion:AggregateVersion']]), enumerable: true})
    Object.defineProperty(this, 'name', {value: t.String(name, ['ModelEvent()', ['name:string']]), enumerable: true})
    Object.defineProperty(this, 'payload', {value: t.Object(payload, ['ModelEvent()', ['payload:object']]), enumerable: true})
    Object.defineProperty(this, 'createdAt', {value: t.Date(createdAt, ['ModelEvent()', ['createdAt:Date']]), enumerable: true})
  }
}

const ModelEventType = t.irreducible('ModelEventType', x => x instanceof ModelEvent)
const ModelEventTypeList = t.list(ModelEventType)

module.exports = {ModelEvent, ModelEventType, ModelEventTypeList}
