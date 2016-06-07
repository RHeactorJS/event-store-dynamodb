'use strict'

/**
 * Models should return and instance of this model from their setters
 *
 * @param {String} aggregateId ID of the aggregate
 * @param {Number} aggregateVersion New version of the aggregate
 * @param {Number} createdAt Time of event creation, defaults to Date.now()
 * @param {object} data Necessary data to replay the event
 * @constructor
 */
function ModelEvent (aggregateId, aggregateVersion, createdAt, data) {
  Object.defineProperty(this, 'aggregateId', {value: aggregateId, enumerable: true})
  Object.defineProperty(this, 'aggregateVersion', {value: aggregateVersion, enumerable: true})
  Object.defineProperty(this, 'createdAt', {value: createdAt || Date.now(), enumerable: true})
  Object.defineProperty(this, 'data', {value: data || {}, enumerable: true})
}

module.exports = ModelEvent
