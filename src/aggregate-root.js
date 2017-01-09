import Joi from 'joi'
import {ValidationFailedError} from 'rheactor-value-objects/errors'

export class AggregateRoot {
  /**
   * Base class for aggregates
   */
  constructor () {
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
  persisted (aggregateId, createdAt) {
    createdAt = createdAt || Date.now()
    let schema = Joi.object().keys({
      aggregateId: Joi.alternatives().try(Joi.number().min(1), Joi.string().trim()).required(),
      createdAt: Joi.number().min(1)
    })
    Joi.validate({aggregateId, createdAt}, schema, {stripUnknown: true}, (err, data) => {
      if (err) {
        throw new ValidationFailedError('AggregateRoot validation failed', data, err)
      }
      this.$aggregateMeta.id = '' + data.aggregateId
      this.$aggregateMeta.version = 1
      this.$aggregateMeta.createdAt = data.createdAt
    })
  }

  /**
   * @param {Number} updatedAt
   * @returns {number}
   */
  updated (updatedAt) {
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
  deleted (deletedAt) {
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
  aggregateVersion () {
    return this.$aggregateMeta.version
  }

  /**
   * Returns the aggregate id
   *
   * @returns {String} ID of the aggregation
   */
  aggregateId () {
    return this.$aggregateMeta.id
  }

  /**
   * Returns if the aggregate is deleted
   *
   * @returns {Boolean}
   */
  isDeleted () {
    return this.$aggregateMeta.deleted
  }

  /**
   * Returns the timestamp when the aggregate was created
   *
   * @returns {Number}
   */
  createdAt () {
    return this.$aggregateMeta.createdAt
  }

  /**
   * Returns the timestamp when the aggregate was updated
   *
   * @returns {Number|null}
   */
  updatedAt () {
    return this.$aggregateMeta.updatedAt
  }

  /**
   * Returns the timestamp when the aggregate was modified the last time, which is the latest value of
   * createdAt, updatedAt or deletedAt
   *
   * @returns {Number}
   */
  modifiedAt () {
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
  deletedAt () {
    return this.$aggregateMeta.deletedAt
  }

}
