const t = require('tcomb')
const {PositiveInteger} = require('./types')
const MaybeDateType = t.maybe(t.Date)

class AggregateMeta {
  /**
   * @param {String} id
   * @param {Number} version
   * @param {Date} createdAt
   * @param {Date|undefined} updatedAt
   * @param {Date|undefined} deletedAt
   */
  constructor (id, version, createdAt = new Date(), updatedAt, deletedAt) {
    this._id = t.String(id, ['AggregateMeta', 'id:AggregateId'])
    this._version = PositiveInteger(version, ['AggregateMeta', 'version:AggregateVersion'])
    this._createdAt = createdAt
    this._updatedAt = MaybeDateType(updatedAt, ['AggregateMeta', 'updatedAt:?Date'])
    this._deletedAt = MaybeDateType(deletedAt, ['AggregateMeta', 'deletedAt:?Date'])
  }

  /**
   * @returns {String}
   */
  get id () {
    return this._id
  }

  /**
   * @returns {Number}
   */
  get version () {
    return this._version
  }

  /**
   * @returns {Date}
   */
  get createdAt () {
    return this._createdAt
  }

  /**
   * @returns {Date|undefined}
   */
  get updatedAt () {
    return this._updatedAt
  }

  /**
   * @returns {Date|undefined}
   */
  get deletedAt () {
    return this._deletedAt
  }

  /**
   * Returns if the aggregateName is deleted
   *
   * @returns {Boolean}
   */
  get isDeleted () {
    return this.deletedAt !== undefined
  }

  /**
   * Returns the timestamp when the aggregateName was modified the last time, which is the latest value of
   * createdAt, updatedAt or deletedAt
   *
   * @returns {Date}
   */
  get modifiedAt () {
    if (this.deletedAt) {
      return this.deletedAt
    }
    if (this.updatedAt) {
      return this.updatedAt
    }
    return this.createdAt
  }

  /**
   * Returns an instance of this with updated version and the updatedAt timestamp set
   *
   * @param {Date} updatedAt
   * @returns {AggregateMeta}
   */
  updated (updatedAt = new Date()) {
    t.Date(updatedAt)
    return new AggregateMeta(this.id, this.version + 1, this.createdAt, updatedAt)
  }

  /**
   * Returns an instance of this with updated version and the deletedAt timestamp set
   *
   * @param {Date} deletedAt
   * @returns {AggregateMeta}
   */
  deleted (deletedAt = new Date()) {
    t.Date(deletedAt)
    return new AggregateMeta(this.id, this.version + 1, this.createdAt, this.updatedAt, deletedAt)
  }
}

const AggregateMetaType = t.irreducible('AggregateMetaType', x => x instanceof AggregateMeta)

module.exports = {
  AggregateMeta,
  AggregateMetaType
}
