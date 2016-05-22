'use strict'

const util = require('util')
const _map = require('lodash/map')

/**
 * Creates a new EventStore for the given aggregate, e.g. 'user'.
 *
 * An event store maintains a version counter per aggregate id which guarantees that events have an ever increasing
 * version id.
 *
 * @param {String} aggregate
 * @param {redis.client} redis
 * @constructor
 */
function EventStore (aggregate, redis) {
  this.aggregate = aggregate
  this.redis = redis
}

/**
 * Persists an event for the aggregate identified by aggregateId.
 *
 * The redis list type guarantees the order of insertion. So we don't need to jump through hoops to manage a version
 * id per aggregate. This can simply be done in the fetch method.
 *
 * @param {String} aggregateId
 * @param {Event} event
 * @return {bluebird.Promise} of {PersistedEvent}
 */
EventStore.prototype.persist = function (aggregateId, event) {
  let self = this
  let aggregateEvents = self.aggregate + '.events.' + aggregateId
  return self.redis.rpushAsync(aggregateEvents, JSON.stringify(event))
}

/**
 * Returns the events for the aggregate identified by aggregateId.
 *
 * @param {String} aggregateId
 * @return {bluebird.Promise} of {Array<PersistedEvent>}
 */
EventStore.prototype.fetch = function (aggregateId) {
  let self = this
  let aggregateEvents = self.aggregate + '.events.' + aggregateId
  let start = 0
  let numEvents = 100
  let fetchEvents = function (start) {
    return self.redis.lrangeAsync(aggregateEvents, start, numEvents)
  }
  let events = []
  return fetchEvents(start)
    .then((res) => {
      let index = start
      _map(res, (event) => {
        let data = JSON.parse(event)
        events.push(new PersistedEvent(data.eventType, data.eventPayload, data.eventCreatedAt, ++index))
      })
      if (res.length === numEvents) {
        start = start + numEvents
        return fetchEvents(start)
      } else {
        return events
      }
    })
}

/**
 * An event that can be persisted by the {EventStore} of the given type.
 * data contains the event payload and will be json encoded
 *
 * @param {String} eventType
 * @param {Object} eventPayload
 * @param {Number} eventCreatedAt
 * @constructor
 */
function Event (eventType, eventPayload, eventCreatedAt) {
  Object.defineProperty(this, 'eventType', {value: eventType, enumerable: true})
  Object.defineProperty(this, 'eventPayload', {value: eventPayload, enumerable: true})
  Object.defineProperty(this, 'eventCreatedAt', {value: eventCreatedAt || Date.now(), enumerable: true})
}

/**
 * An event that has been persisted by the {EventStore}. In addition to all fields of {Event} it
 * the internal index for this aggregate's events
 *
 * @param {String} eventType
 * @param {Object} eventPayload
 * @param {Number} eventCreatedAt
 * @param {Number} eventIndex
 * @constructor
 */
function PersistedEvent (eventType, eventPayload, eventCreatedAt, eventIndex) {
  Event.call(this, eventType, eventPayload, eventCreatedAt)
  Object.defineProperty(this, 'eventIndex', {value: eventIndex, enumerable: true})
}
util.inherits(PersistedEvent, Event)

module.exports = {
  Event,
  EventStore,
  PersistedEvent
}
