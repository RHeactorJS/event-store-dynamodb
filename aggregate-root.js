'use strict'

const Joi = require('joi')
const ValidationFailedError = require('rheactor-value-objects/errors/validation-failed')

/**
 * Base class for aggregates
 */
function AggregateRoot () {
  Object.defineProperty(this, '$aggregateMeta', {
    value: {
      id: null,
      version: null,
      deleted: false,
      createdAt: null,
      updatedAt: null,
      deletedAt: null
    }
  })
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
      throw new ValidationFailedError('AggregateRoot validation failed', data, err)
    }
    self.$aggregateMeta.id = '' + data.aggregateId
    self.$aggregateMeta.version = 1
    self.$aggregateMeta.createdAt = data.createdAt
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
      throw new ValidationFailedError('AggregateRoot.updated validation failed', updatedAt, err)
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
      throw new ValidationFailedError('AggregateRoot.deleted validation failed', deletedAt, err)
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
  if (this.$aggregateMeta.deletedAt) {
    return this.$aggregateMeta.deletedAt
  }
  if (this.$aggregateMeta.updatedAt) {
    return this.$aggregateMeta.updatedAt
  }
  return this.$aggregateMeta.createdAt
}

/**
 * Returns the timestamp when the aggregate was deleted
 *
 * @returns {Number|null}
 */
AggregateRoot.prototype.deletedAt = function () {
  return this.$aggregateMeta.deletedAt
}

module.exports = AggregateRoot
