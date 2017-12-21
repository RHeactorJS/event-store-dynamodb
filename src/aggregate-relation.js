const {AggregateIdType} = require('./types')
const {String: StringType} = require('tcomb')

class AggregateRelation {
  /**
   * Manages relations for aggregates
   *
   * @param {AggregateRepository} repository
   * @param {DynamoDB} dynamoDB
   */
  constructor (repository, dynamoDB) {
    this.repository = repository
    this.dynamoDB = dynamoDB
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
    StringType(relation, ['AggregateRelation.findByRelatedId()', 'relation:String'])
    AggregateIdType(relatedId, ['AggregateRelation.findByRelatedId()', 'relatedId:AggregateId'])
    return this.dynamoDB.smembersAsync(this.repository.alias + ':' + relation + ':' + relatedId)
      .map(id => this.repository.findById(id))
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
    StringType(relation, ['AggregateRelation.addRelatedId()', 'relation:String'])
    AggregateIdType(relatedId, ['AggregateRelation.addRelatedId()', 'relatedId:AggregateId'])
    AggregateIdType(aggregateId, ['AggregateRelation.addRelatedId()', 'aggregateId:AggregateId'])
    return this.dynamoDB.saddAsync(this.repository.alias + ':' + relation + ':' + relatedId, aggregateId)
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
    StringType(relation, ['AggregateRelation.removeRelatedId()', 'relation:String'])
    AggregateIdType(relatedId, ['AggregateRelation.removeRelatedId()', 'relatedId:AggregateId'])
    AggregateIdType(aggregateId, ['AggregateRelation.removeRelatedId()', 'aggregateId:AggregateId'])
    return this.dynamoDB.sremAsync(this.repository.alias + ':' + relation + ':' + relatedId, aggregateId)
  }
}

module.exports = {AggregateRelation}
