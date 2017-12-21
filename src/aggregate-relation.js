const t = require('tcomb')

class AggregateRelation {
  /**
   * Manages relations for aggregates
   *
   * @param {DynamoDB} dynamoDB
   * @param {string} tableName
   */
  constructor (dynamoDB, tableName = 'relations') {
    this.dynamoDB = t.Object(dynamoDB, ['AggregateRelation()', 'dynamoDB:Object'])
    this.tableName = t.String(tableName, ['AggregateRelation()', 'tableName:String'])
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
    t.String(relation, ['AggregateRelation.findByRelatedId()', 'relation:String'])
    t.String(relatedId, ['AggregateRelation.findByRelatedId()', 'relatedId:RelatedId'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        // KeyConditionExpression: 'AggregateRelation = :AggregateRelation AND RelatedId = :RelatedId',
        // ExpressionAttributeValues: {':AggregateRelation': {'S': relation}, ':RelatedId': {'S': relatedId}}
        Key: {
          AggregateRelation: {
            S: relation
          },
          RelatedId: {
            S: relatedId
          }
        }
      })
      .promise()
      .then(({Item}) => Item && Item.AggregateIds ? Item.AggregateIds.SS : [])
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
    t.String(relation, ['AggregateRelation.addRelatedId()', 'relation:String'])
    t.String(relatedId, ['AggregateRelation.addRelatedId()', 'relatedId:String'])
    t.String(aggregateId, ['AggregateRelation.addRelatedId()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          AggregateRelation: {
            S: relation
          },
          RelatedId: {
            S: relatedId
          }
        },
        UpdateExpression: 'ADD #AggregateIds :AggregateId',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': {'SS': [aggregateId]}
        }
      })
      .promise()
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
    t.String(relation, ['AggregateRelation.removeRelatedId()', 'relation:String'])
    t.String(relatedId, ['AggregateRelation.removeRelatedId()', 'relatedId:RelatedId'])
    t.String(aggregateId, ['AggregateRelation.removeRelatedId()', 'aggregateId:RelatedId'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          AggregateRelation: {
            S: relation
          },
          RelatedId: {
            S: relatedId
          }
        },
        UpdateExpression: 'DELETE #AggregateIds :AggregateId',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': {'SS': [aggregateId]}
        }
      })
      .promise()
  }

  createTable () {
    return this.dynamoDB.createTable({
      TableName: this.tableName,
      KeySchema: [
        {
          AttributeName: 'AggregateRelation',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'RelatedId',
          KeyType: 'RANGE'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'AggregateRelation',
          AttributeType: 'S'
        },
        {
          AttributeName: 'RelatedId',
          AttributeType: 'S'
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }).promise()
  }
}

module.exports = {AggregateRelation}
