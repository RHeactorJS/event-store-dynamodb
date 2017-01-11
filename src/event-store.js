import {Promise} from 'bluebird'
import {ModelEvent, ModelEventType} from './model-event'

export class EventStore {
  /**
   * Creates a new EventStore for the given aggregate, e.g. 'user'.
   *
   * An event store maintains a version counter per aggregate id which guarantees that events have an ever increasing
   * version id.
   *
   * @param {String} aggregate
   * @param {redis.client} redis
   * @param {Number} numEvents
   */
  constructor (aggregate, redis, numEvents) {
    this.aggregate = aggregate
    this.redis = redis
    this.numEvents = numEvents || 100
  }

  /**
   * Persists an event
   *
   * The redis list type guarantees the order of insertion. So we don't need to jump through hoops to manage a version
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
      eventCreatedAt: event.createdAt
    }
    if (event.createdBy) {
      data.eventCreatedBy = event.createdBy
    }
    return Promise.resolve(this.redis.rpushAsync(aggregateEvents, JSON.stringify(data)))
  }

  /**
   * Returns the events for the aggregate identified by aggregateId.
   *
   * @param {String} aggregateId
   * @return {Promise.<Array.<ModelEvent>>}
   */
  fetch (aggregateId) {
    let aggregateEvents = this.aggregate + '.events.' + aggregateId
    let start = 0
    let fetchedEvents = []
    let fetchEvents = start => {
      return Promise
        .resolve(this.redis.lrangeAsync(aggregateEvents, start, start + this.numEvents - 1))
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
        let event = JSON.parse(e)
        return new ModelEvent(aggregateId, event.eventType, event.eventPayload, event.eventCreatedAt, event.eventCreatedBy)
      })
  }

}

