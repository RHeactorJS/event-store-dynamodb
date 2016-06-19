'use strict'

const Promise = require('bluebird')

/**
 * Manages relations for aggregates
 *
 * @param {AggregateRepository} repository
 * @param {redis.client} redis
 * @constructor
 */
const AggregateRelation = function (repository, redis) {
  this.repository = repository
  this.redis = redis
}

/**
 * Finds all entities that are associated with the given relation of the given relationId
 *
 * The need to be added via addRelatedId()
 *
 * @param {String} relation
 * @param {String} relatedId
 * @returns {Promise.<Array.<AggregateRoot>>}
 */
AggregateRelation.prototype.findByRelatedId = function (relation, relatedId) {
  let self = this
  return Promise
    .resolve(self.redis.smembersAsync(self.repository.aggregateAlias + ':' + relation + ':' + relatedId))
    .map(self.repository.findById.bind(self.repository))
    .filter((model) => {
      return model !== undefined
    })
}

/**
 * A helper function for associating the the aggregateId with the given relatedId of the relation
 *
 * e.g. Associate the user (aggregateId='17') with the meeting (relation='meeting') of id 42 (relatedId='42')
 * Now all users of meeting 42 can be returned via findByRelatedId('meeting', '42')
 *
 * @param {String} relation
 * @param {String} relatedId
 * @param {String} aggregateId
 * @returns {Promise}
 */
AggregateRelation.prototype.addRelatedId = function (relation, relatedId, aggregateId) {
  let self = this
  return Promise
    .resolve(self.redis.saddAsync(self.repository.aggregateAlias + ':' + relation + ':' + relatedId, aggregateId))
}

module.exports = AggregateRelation
