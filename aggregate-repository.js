'use strict'

const EventStore = require('./event-store')
const ModelEvent = require('./model-event')
const _upperFirst = require('lodash/upperFirst')
const _map = require('lodash/map')
const Errors = require('rheactor-value-objects/errors')
const Promise = require('bluebird')
const AggregateRoot = require('./aggregate-root')

/**
 * Creates a new aggregate repository
 *
 * @param {AggregateRoot} aggregateRoot
 * @param {String} aggregateAlias
 * @param {redis.client} redis
 * @constructor
 */
const AggregateRepository = function (aggregateRoot, aggregateAlias, redis) {
  this.aggregateRoot = aggregateRoot
  this.aggregateAlias = aggregateAlias
  this.eventStore = new EventStore(aggregateAlias, redis)
  this.redis = redis
}

/**
 * Generic method for add aggregates to the collection.
 * The repository will assign an ID to them
 *
 * Modifies the aggregate.
 *
 * @param {AggregateRoot} aggregate
 * @returns {Promise.<ModelEvent>}
 */
AggregateRepository.prototype.add = function (aggregate) {
  let self = this
  return self.redis.incrAsync(self.aggregateAlias + ':id')
    .then((id) => {
      let event = new ModelEvent(id, _upperFirst(self.aggregateAlias) + 'CreatedEvent', aggregate)
      return self.persistEvent(event)
        .then(() => {
          aggregate.applyEvent(event)
          return event
        })
    })
}

/**
 * Generic method to persist model events
 *
 * @param {ModelEvent} modelEvent
 * @return {Promise.<ModelEvent>}
 */
AggregateRepository.prototype.persistEvent = function (modelEvent) {
  let self = this
  return self.eventStore
    .persist(modelEvent)
    .then(() => {
      return modelEvent
    })
}

/**
 * Generic method for removing aggregates from the collection
 *
 * Modifies the aggregate.
 *
 * @param {AggregateRoot} aggregate
 * @returns {Promise.<ModelEvent>}
 */
AggregateRepository.prototype.remove = function (aggregate) {
  let self = this
  let event = new ModelEvent(aggregate.aggregateId(), _upperFirst(self.aggregateAlias) + 'DeletedEvent', aggregate)
  return self.persistEvent(event)
    .then(() => {
      aggregate.applyEvent(event)
      return event
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
    .then(self.aggregate.bind(self))
    .then((aggregate) => {
      if (!aggregate) return
      return aggregate.isDeleted() ? undefined : aggregate
    })
}

/**
 * Creates an instance of this repositories aggregate root by applying all events
 *
 * NOTE: Because the signature of the AggregateRoot's constructor may change
 * over time, we bypass the individual constructor of the Model. The model
 * is passed the the complete list of events (including the created event)
 * and must construct itself from that list.
 * This way we can keep hard checks when constructing new model instance from
 * code "new MyExampleModel(arg)" but can handle changing payload of the created
 * event over time.
 *
 * @param {Array.<ModelEvent>} events
 * @returns {AggregateRoot}
 */
AggregateRepository.prototype.aggregate = function (events) {
  let self = this
  if (!events.length) {
    return
  }
  let model = Object.create(self.aggregateRoot.prototype) // Instantiate model
  AggregateRoot.call(model) // Bypass the model constructor, but init necessary data
  _map(events, model.applyEvent.bind(model))
  return model
}

/**
 * Returns all entites
 *
 * NOTE: naively returns all entities by fetching them one by one by ID starting
 * from 1 to the current max id.
 *
 * @returns {Promise.<Array.<AggregateRoot>>}
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
    .then(self.aggregate.bind(self))
    .then((aggregate) => {
      if (!aggregate) {
        throw new Errors.EntityNotFoundError(self.aggregateAlias + ' with id "' + id + '" not found.')
      }
      if (aggregate.isDeleted()) {
        throw new Errors.EntityDeletedError(self.aggregateAlias + ' with id "' + id + '" is deleted.', aggregate)
      }
      return aggregate
    })
}

module.exports = AggregateRepository
