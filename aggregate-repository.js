'use strict'

const EventStore = require('./event-store')
const _capitalize = require('lodash/capitalize')
const Errors = require('rheactor-value-objects/errors')
const Promise = require('bluebird')

/**
 * Creates a new aggregate repository
 *
 * @param {AggregateRoot} aggregateRoot
 * @param {String} aggregateAlias
 * @param {redis.client} redis
 * @constructor
 */
var AggregateRepository = function (aggregateRoot, aggregateAlias, redis) {
  this.aggregateRoot = aggregateRoot
  this.aggregateAlias = aggregateAlias
  this.eventStore = new EventStore.EventStore(aggregateAlias, redis)
  this.redis = redis
}

/**
 * Generic method for storing new aggregates
 *
 * @param {AggregateRoot} aggregate
 * @returns {Promise.<String>} of the id
 */
AggregateRepository.prototype.create = function (aggregate) {
  let self = this
  return self.redis.incrAsync(self.aggregateAlias + ':id')
    .then((id) => {
      return this.eventStore
        .persist(id, new EventStore.Event(_capitalize(self.aggregateAlias) + 'CreatedEvent', aggregate))
        .then(() => {
          return id
        })
    })
    .then((id) => {
      return id
    })
}

/**
 * Generic method for loading aggregates by id
 *
 * @param {String} id
 * @returns {Promise.<AggregateRoot>} or undefined if not found
 */
AggregateRepository.prototype.findById = function (id) {
  let self = this
  return self.eventStore.fetch(id)
    .then(self.aggregateRoot.aggregate.bind(self.aggregateRoot, id))
    .then((aggregate) => {
      if (!aggregate) return
      return aggregate.isDeleted() ? undefined : aggregate
    })
}

/**
 * Returns all items
 *
 * NOTE: naively returns all entities by fetching them by ID.
 * FIXME: Replace by using other iterable lists
 *
 * @returns {Promise.<[AggregateRoot]>}
 */
AggregateRepository.prototype.findAll = function () {
  let self = this
  return self.redis.getAsync(self.aggregateAlias + ':id')
    .then((maxId) => {
      let promises = []
      for (let i = 1; i <= maxId; i++) {
        promises.push(self.findById('' + i))
      }
      return Promise.all(promises)
    })
    .filter((item) => {
      return item !== undefined
    })
}

/**
 * Generic method for loading aggregates by id
 *
 * @param {String} id
 * @returns {Promise.<AggregateRoot>}
 * @throws {EntityNotFoundError} if entity is not found
 */
AggregateRepository.prototype.getById = function (id) {
  let self = this
  return self.eventStore.fetch(id)
    .then(self.aggregateRoot.aggregate.bind(self.aggregateRoot, id))
    .then((aggregate) => {
      if (!aggregate) {
        throw new Errors.EntityNotFoundError(self.aggregateAlias + ' with id "' + id + '" not found.')
      }
      if (aggregate.isDeleted()) {
        throw new Errors.EntityDeletedError(self.aggregateAlias + ' with id "' + id + '" is deleted.')
      }
      return aggregate
    })
}

AggregateRepository.findByRelatedId = function (repo, relatedName, relatedId) {
  return repo.redis.smembersAsync(repo.aggregateAlias + ':' + relatedName + ':' + relatedId)
    .map((id) => {
      return repo.getById(id)
        .then((model) => {
          return model
        })
        .catch((err) => {
          if (!/EntityDeletedError/.test(err.name)) {
            console.error('AggregateRepository error: the item ' + id + ' for  ' + repo.aggregateAlias + ' was not found!')
          }
        })
    })
    .filter((model) => {
      return model !== undefined
    })
    .catch((err) => {
      if (!/EntityNotFoundError/.test(err.name)) {
        console.error('AggregateRepository', err)
      }
      return []
    })
}

module.exports = AggregateRepository
