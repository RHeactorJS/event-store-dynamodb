const {Promise} = require('bluebird')
const {ModelEvent, ModelEventType} = require('./model-event')
const {AggregateIdType, PositiveIntegerType} = require('./types')
const {String: StringType, Object: ObjectType} = require('tcomb')

class EventStore {
  /**
   * Creates a new EventStore for the given aggregate, e.g. 'user'.
   *
   * An event store maintains a version counter per aggregate id which guarantees that events have an ever increasing
   * version id.
   *
   * @param {String} aggregate
   * @param {DynamoDB} dynamoDB
   * @param {Number} numEvents
   */
  constructor (aggregate, dynamoDB, numEvents = 100) {
    StringType(aggregate)
    ObjectType(dynamoDB)
    PositiveIntegerType(numEvents)
    this.aggregate = aggregate
    this.dynamoDB = dynamoDB
    this.numEvents = numEvents
  }

  /**
   * Persists an event
   *
   * The dynamoDB list type guarantees the order of insertion. So we don't need to jump through hoops to manage a version
   * id per aggregate. This can simply be done in the fetch method.
   *
   * @param {ModelEvent} event
   * @return {Promise}
   */
  persist (event) {
    ModelEventType(event)
    let aggregateEvents = this.aggregate + '.events.' + event.aggregateId
    let data = {
      eventType: event.name,
      eventPayload: event.data,
      eventCreatedAt: event.createdAt.getTime()
    }
    if (event.createdBy) {
      data.eventCreatedBy = event.createdBy
    }
    return Promise.resolve(this.dynamoDB.rpushAsync(aggregateEvents, JSON.stringify(data)))
  }

  /**
   * Returns the events for the aggregate identified by aggregateId.
   *
   * @param {String} aggregateId
   * @return {Promise.<Array.<ModelEvent>>}
   */
  fetch (aggregateId) {
    AggregateIdType(aggregateId)
    let aggregateEvents = this.aggregate + '.events.' + aggregateId
    let start = 0
    let fetchedEvents = []
    let fetchEvents = start => {
      return Promise
        .resolve(this.dynamoDB.lrangeAsync(aggregateEvents, start, start + this.numEvents - 1))
        .then((res) => {
          return Promise
            .map(res, (e) => {
              fetchedEvents.push(e)
            })
            .then(() => {
              if (res.length === this.numEvents) {
                return fetchEvents(start + this.numEvents)
              } else {
                return fetchedEvents
              }
            })
        })
    }
    return fetchEvents(start)
      .map((e) => {
        const event = JSON.parse(e)
        const createdAt = new Date(event.eventCreatedAt || 0) // events did not always have this
        return new ModelEvent(aggregateId, event.eventType, event.eventPayload, createdAt, event.eventCreatedBy)
      })
  }
}

module.exports = {EventStore}
