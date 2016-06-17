'use strict'

const Errors = require('rheactor-value-objects/errors')

/**
 * Manages indices for aggregates
 *
 * @param {String} aggregate
 * @param {redis.client} redis
 * @constructor
 */
var AggregateIndex = function (aggregate, redis) {
  this.aggregate = aggregate
  this.redis = redis
}

/**
 * Add the value to the index of the given type for the aggregate identified by the given aggregateId
 *
 * @param {String} type
 * @param {String} value
 * @param {String} aggregateId
 * @returns {Promise}
 */
AggregateIndex.prototype.add = function (type, value, aggregateId) {
  var self = this
  return self.redis.hmsetAsync(self.aggregate + '.' + type + '.index', value, aggregateId)
}

/**
 * Add the value to the index of the given type for the aggregate identified by the given aggregateId
 * if it is not already present
 *
 * @param {String} type
 * @param {String} value
 * @param {String} aggregateId
 * @returns {Promise}
 * @throws EntryAlreadyExistsError If entry exists
 */
AggregateIndex.prototype.addIfNotPresent = function (type, value, aggregateId) {
  var self = this
  let index = self.aggregate + '.' + type + '.index'
  return self.redis.evalAsync(
    'local v = redis.call(\'HMGET\',ARGV[1],ARGV[2]) if v[1] == false then redis.call(\'HMSET\',ARGV[1],ARGV[2],ARGV[3]) return true else return false end',
    0, index, value, aggregateId
  )
    .then((res) => {
      if (res === null) {
        throw new Errors.EntryAlreadyExistsError('Entry for index "' + index + '" with key "' + value + '" already ' +
          'exists. Tried to add aggregate "' + aggregateId + '".')
      }
      return true
    })
}

/**
 * Remove the aggregate identified by the given aggregateId from the index of the given type for the given value
 *
 * @param {String} type
 * @param {String} value
 * @param {String} aggregateId
 * @returns {Promise}
 */
AggregateIndex.prototype.remove = function (type, value, aggregateId) {
  var self = this
  let index = self.aggregate + '.' + type + '.index'
  return self.redis.hdelAsync(index, value, aggregateId)
}

/**
 * Add the value to the list of the given type for the aggregate identified by the given aggregateId
 * if it is not already present
 *
 * @param {String} type
 * @param {String} aggregateId
 * @returns {Promise}
 * @throws EntryAlreadyExistsError If entry exists
 */
AggregateIndex.prototype.addToListIfNotPresent = function (type, aggregateId) {
  var self = this
  let index = self.aggregate + '.' + type + '.list'
  return self.redis.saddAsync(index, aggregateId)
    .then((res) => {
      if (!res) {
        throw new Errors.EntryAlreadyExistsError('Aggregate "' + aggregateId + '" already member of "' + index + '".')
      }
      return true
    })
}

/**
 * Returns the entries of the list
 *
 * @param {String} type
 * @returns {Promise.<Array>}
 */
AggregateIndex.prototype.getList = function (type) {
  var self = this
  let index = self.aggregate + '.' + type + '.list'
  return self.redis.smembersAsync(index)
}

/**
 * Remove the value from the list of the given type for the aggregate identified by the given aggregateId
 *
 * @param {String} type
 * @param {String} aggregateId
 * @returns {Promise}
 * @throws EntryAlreadyExistsError If entry exists
 */
AggregateIndex.prototype.removeFromList = function (type, aggregateId) {
  var self = this
  let index = self.aggregate + '.' + type + '.list'
  return self.redis.sremAsync(index, aggregateId)
}

/**
 * Find an aggregateId by the given index type and value
 *
 * @param {String} type
 * @param {String} value
 * @returns {Promise}
 */
AggregateIndex.prototype.find = function (type, value) {
  var self = this
  return self.get(type, value)
    .catch(Errors.EntityNotFoundError, () => {
      return null
    })
}

/**
 * Retrun an aggregateId by the given index type and value
 *
 * @param {String} type
 * @param {String} value
 * @returns {Promise}
 * @throws EntityNotFoundError
 */
AggregateIndex.prototype.get = function (type, value) {
  var self = this
  return self.redis
    .hmgetAsync(self.aggregate + '.' + type + '.index', value)
    .then((res) => {
      if (res[0] === null) {
        throw new Errors.EntityNotFoundError('Aggregate not found with ' + type + ' "' + value + '"')
      }
      return res[0]
    })
}

module.exports = AggregateIndex
