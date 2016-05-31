'use strict'

/**
 * Models should return and instance of this model from their setters
 *
 * @param {String} aggregateId
 * @param {object} data
 * @param {Number} createdAt
 * @constructor
 */
function ModelEvent (aggregateId, data, createdAt) {
  Object.defineProperty(this, 'aggregateId', {value: aggregateId, enumerable: true})
  Object.defineProperty(this, 'data', {value: data || {}, enumerable: true})
  Object.defineProperty(this, 'createdAt', {value: createdAt || Date.now(), enumerable: true})
}

module.exports = ModelEvent
