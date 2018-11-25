const t = require('tcomb')
const { NonEmptyString } = require('./types')

class AggregateRelation {
  /**
   * Manages relations for aggregates
   *
   * @param {string} aggregateName
   * @param {DynamoDB} dynamoDB
   * @param {string} tableName
   */
  constructor (aggregateName, dynamoDB, tableName = 'relations') {
    this.aggregateName = NonEmptyString(aggregateName, ['AggregateRelation()', ['aggregateName:string']])
    this.dynamoDB = t.Object(dynamoDB, ['AggregateRelation()', 'dynamoDB:Object'])
    this.tableName = NonEmptyString(tableName, ['AggregateRelation()', 'tableName:String'])
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
    NonEmptyString(relation, ['AggregateRelation.findByRelatedId()', 'relation:String'])
    NonEmptyString(relatedId, ['AggregateRelation.findByRelatedId()', 'relatedId:RelatedId'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${relation}`
          },
          IndexKey: {
            S: relatedId
          }
        }
      })
      .promise()
      .then(({ Item }) => Item && Item.AggregateIds ? Item.AggregateIds.SS : [])
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
    NonEmptyString(relation, ['AggregateRelation.addRelatedId()', 'relation:String'])
    NonEmptyString(relatedId, ['AggregateRelation.addRelatedId()', 'relatedId:String'])
    NonEmptyString(aggregateId, ['AggregateRelation.addRelatedId()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${relation}`
          },
          IndexKey: {
            S: relatedId
          }
        },
        UpdateExpression: 'ADD #AggregateIds :AggregateId',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': { 'SS': [aggregateId] }
        }
      })
      .promise()
  }

  /**
   * A helper function for removing the aggregateId with the given relatedId of the relation
   *
   * @param {String} relation
   * @param {String} relatedId
   * @param {String} aggregateId
   * @returns {Promise}
   */
  removeRelatedId (relation, relatedId, aggregateId) {
    NonEmptyString(relation, ['AggregateRelation.removeRelatedId()', 'relation:String'])
    NonEmptyString(relatedId, ['AggregateRelation.removeRelatedId()', 'relatedId:RelatedId'])
    NonEmptyString(aggregateId, ['AggregateRelation.removeRelatedId()', 'aggregateId:RelatedId'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${relation}`
          },
          IndexKey: {
            S: relatedId
          }
        },
        UpdateExpression: 'DELETE #AggregateIds :AggregateId',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': { 'SS': [aggregateId] }
        }
      })
      .promise()
  }

  /**
   * Remove all relations to the given aggregateId from the given relation
   *
   * @param {String} relation
   * @param {String} aggregateId
   */
  removeRelation (relation, aggregateId) {
    NonEmptyString(relation, ['AggregateRelation.removeRelatedId()', 'relation:String'])
    NonEmptyString(aggregateId, ['AggregateRelation.removeRelatedId()', 'aggregateId:RelatedId'])
    const deleteRelations = (ExclusiveStartKey) => this.dynamoDB
      .query({
        TableName: this.tableName,
        ExclusiveStartKey,
        KeyConditionExpression: 'IndexName = :IndexName AND IndexKey > :IndexKey',
        ExpressionAttributeValues: { ':IndexName': { 'S': `${this.aggregateName}.${relation}` }, ':IndexKey': { 'S': '0' } }
      })
      .promise()
      .then(async ({ Items, LastEvaluatedKey }) => {
        await Promise.all(
          Items.map(({ IndexName, IndexKey }) => this.dynamoDB.deleteItem({
            TableName: this.tableName,
            Key: { IndexName, IndexKey }
          }).promise())
        ).then()
        if (LastEvaluatedKey) return deleteRelations(LastEvaluatedKey)
      })
    return deleteRelations()
  }
}

module.exports = { AggregateRelation }
