'use strict'

const Promise = require('bluebird')
const ModelEvent = require('./model-event')

/**
 * Creates a new EventStore for the given aggregate, e.g. 'user'.
 *
 * An event store maintains a version counter per aggregate id which guarantees that events have an ever increasing
 * version id.
 *
 * @param {String} aggregate
 * @param {redis.client} redis
 * @param {Number} numEvents
 * @constructor
 */
function EventStore (aggregate, redis, numEvents) {
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
EventStore.prototype.persist = function (event) {
  let self = this
  let aggregateEvents = self.aggregate + '.events.' + event.aggregateId
  let data = {
    eventType: event.name,
    eventPayload: event.data,
    eventCreatedAt: event.createdAt
  }
  return Promise.resolve(self.redis.rpushAsync(aggregateEvents, JSON.stringify(data)))
}

/**
 * Returns the events for the aggregate identified by aggregateId.
 *
 * @param {String} aggregateId
 * @return {Promise.<Array.<ModelEvent>>}
 */
EventStore.prototype.fetch = function (aggregateId) {
  let self = this
  let aggregateEvents = self.aggregate + '.events.' + aggregateId
  let start = 0
  let fetchedEvents = []
  let fetchEvents = function (start) {
    return Promise
      .resolve(self.redis.lrangeAsync(aggregateEvents, start, start + self.numEvents - 1))
      .then((res) => {
        return Promise
          .map(res, (e) => {
            fetchedEvents.push(e)
          })
          .then(() => {
            if (res.length === self.numEvents) {
              return fetchEvents(start + self.numEvents)
            } else {
              return fetchedEvents
            }
          })
      })
  }
  return fetchEvents(start)
    .map((e) => {
      let event = JSON.parse(e)
      return new ModelEvent(aggregateId, event.eventType, event.eventPayload, event.eventCreatedAt)
    })
}

module.exports = EventStore
