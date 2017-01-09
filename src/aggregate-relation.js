import {String as StringType, Number as NumberType, union} from 'tcomb'

const scalarType = union([StringType, NumberType])

export class AggregateRelation {
  /**
   * Manages relations for aggregates
   *
   * @param {AggregateRepository} repository
   * @param {redis.client} promisified redis client
   */
  constructor (repository, redis) {
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
  findByRelatedId (relation, relatedId) {
    StringType(relation)
    scalarType(relatedId)
    let self = this
    return self.redis.smembersAsync(self.repository.aggregateAlias + ':' + relation + ':' + relatedId)
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
  addRelatedId (relation, relatedId, aggregateId) {
    StringType(relation)
    scalarType(relatedId)
    scalarType(aggregateId)
    let self = this
    return self.redis.saddAsync(self.repository.aggregateAlias + ':' + relation + ':' + relatedId, aggregateId)
  }

  /**
   * A helper function for removing the the aggregateId with the given relatedId of the relation
   *
   * @param {String} relation
   * @param {String} relatedId
   * @param {String} aggregateId
   * @returns {Promise}
   */
  removeRelatedId (relation, relatedId, aggregateId) {
    StringType(relation)
    scalarType(relatedId)
    scalarType(aggregateId)
    let self = this
    return self.redis.sremAsync(self.repository.aggregateAlias + ':' + relation + ':' + relatedId, aggregateId)
  }
}
