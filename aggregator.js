'use strict'

const _forEach = require('lodash/forEach')
const Joi = require('joi')
const ValidationFailedException = require('rheactor-value-objects/errors').ValidationFailedException

/**
 * Aggregator build aggregates from events read from the eventStore
 *
 * @param {AggregateRoot} aggregateRoot
 * @constructor
 */
function Aggregator (aggregateRoot) {
  this.aggregateRoot = aggregateRoot
}

/**
 * Simple merge function
 * @param {AggregateRoot} aggregateRoot
 * @param {PersistedEvent} event
 */
Aggregator.merge = (aggregateRoot, event) => {
  _forEach(event.eventPayload, function (value, key) {
    aggregateRoot[key] = event.eventPayload[key] || undefined
  })
}

/**
 * Base class for aggregates
 */
function AggregateRoot () {
}

/**
 * @param {String} aggregateId
 * @param {Number} createdAt
 */
AggregateRoot.prototype.persisted = function (aggregateId, createdAt) {
  let self = this
  createdAt = createdAt || Date.now()
  let schema = Joi.object().keys({
    aggregateId: Joi.alternatives().try(Joi.number().min(1), Joi.string().trim()).required(),
    createdAt: Joi.number().min(1)
  })
  Joi.validate({aggregateId, createdAt}, schema, {stripUnknown: true}, (err, data) => {
    if (err) {
      throw new ValidationFailedException('AggregateRoot validation failed', data, err)
    }
    self.$aggregateMeta = {
      id: '' + data.aggregateId,
      version: 1,
      deleted: false,
      createdAt: data.createdAt,
      updatedAt: null,
      deletedAt: null
    }
  })
}

/**
 * @param {Number} updatedAt
 * @returns {number}
 */
AggregateRoot.prototype.updated = function (updatedAt) {
  updatedAt = updatedAt || Date.now()
  Joi.validate(updatedAt, Joi.number().min(1), (err, updatedAt) => {
    if (err) {
      throw new ValidationFailedException('AggregateRoot.updated validation failed', updatedAt, err)
    }
    this.$aggregateMeta.updatedAt = updatedAt
    return ++this.$aggregateMeta.version
  })
}

/**
 * @param {Number} deletedAt
 * @returns {number}
 */
AggregateRoot.prototype.deleted = function (deletedAt) {
  deletedAt = deletedAt || Date.now()
  Joi.validate(deletedAt, Joi.number().min(1), (err, deletedAt) => {
    if (err) {
      throw new ValidationFailedException('AggregateRoot.deleted validation failed', deletedAt, err)
    }
    this.$aggregateMeta.deletedAt = deletedAt
    this.$aggregateMeta.deleted = true
    return ++this.$aggregateMeta.version
  })
}

/**
 * Returns the aggregate version
 *
 * @returns {number} Version of the aggregation
 */
AggregateRoot.prototype.aggregateVersion = function () {
  return this.$aggregateMeta.version
}

/**
 * Returns the aggregate id
 *
 * @returns {String} ID of the aggregation
 */
AggregateRoot.prototype.aggregateId = function () {
  return this.$aggregateMeta.id
}

/**
 * Returns the aggregate meta data
 *
 * @returns {String} meta data of the aggregation
 */
AggregateRoot.prototype.aggregateMeta = function () {
  return this.$aggregateMeta
}

/**
 * Returns if the aggregate is deleted
 *
 * @returns {Boolean}
 */
AggregateRoot.prototype.isDeleted = function () {
  return this.$aggregateMeta.deleted
}

/**
 * Returns the timestamp when the aggregate was created
 *
 * @returns {Number}
 */
AggregateRoot.prototype.createdAt = function () {
  return this.$aggregateMeta.createdAt
}

/**
 * Returns the timestamp when the aggregate was updated
 *
 * @returns {Number|null}
 */
AggregateRoot.prototype.updatedAt = function () {
  return this.$aggregateMeta.updatedAt
}

/**
 * Returns the timestamp when the aggregate was modified the last time, which is the latest value of
 * createdAt, updatedAt or deletedAt
 *
 * @returns {Number}
 */
AggregateRoot.prototype.modifiedAt = function () {
  return Math.max(Math.max(this.$aggregateMeta.createdAt, this.$aggregateMeta.updatedAt), this.$aggregateMeta.deletedAt)
}

/**
 * Returns the timestamp when the aggregate was deleted
 *
 * @returns {Number|null}
 */
AggregateRoot.prototype.deletedAt = function () {
  return this.$aggregateMeta.deletedAt
}

/**
 * Applies the event
 *
 * @param {String} eventName
 * @param {object} payload
 * @param {Number} eventCreatedAt
 */
AggregateRoot.prototype.apply = function (eventName, payload, eventCreatedAt) {
  throw new Error(this.constructor.name + '.apply(eventName, payload, eventCreatedAt) not implemented!')
}

module.exports = {
  Aggregator,
  AggregateRoot
}
