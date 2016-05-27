'use strict'

/**
 * Models should return and instance of this model from their setters
 *
 * @param {String} aggregateId
 * @param {object} data
 * @constructor
 */
function ModelEvent (aggregateId, data) {
  Object.defineProperty(this, 'aggregateId', {value: aggregateId, enumerable: true})
  Object.defineProperty(this, 'data', {value: data || {}, enumerable: true})
}

module.exports = ModelEvent
