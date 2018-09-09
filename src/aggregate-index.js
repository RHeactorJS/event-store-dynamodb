const { EntryAlreadyExistsError, EntryNotFoundError } = require('@rheactorjs/errors')
const { NonEmptyString } = require('./types')
const t = require('tcomb')

class AggregateIndex {
  /**
   * Manages indices for aggregates
   *
   * @param {String} aggregateName
   * @param {DynamoDB} dynamoDB
   * @param {String} tableName
   */
  constructor (aggregateName, dynamoDB, tableName = 'indexes') {
    this.aggregateName = NonEmptyString(aggregateName, ['AggregateIndex()', 'aggregateName:string'])
    this.dynamoDB = t.Object(dynamoDB, ['AggregateIndex()', 'dynamoDB:Object'])
    this.tableName = NonEmptyString(tableName, ['AggregateIndex()', 'tableName:String'])
  }

  /**
   * Add the aggregateId for the given key to the index
   *
   * @param {String} indexName
   * @param {String} key
   * @param {String} aggregateId
   * @returns {Promise}
   */
  add (indexName, key, aggregateId) {
    NonEmptyString(indexName, ['AggregateIndex.add()', 'indexName:String'])
    NonEmptyString(key, ['AggregateIndex.add()', 'value:String'])
    NonEmptyString(aggregateId, ['AggregateIndex.add()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${indexName}`
          },
          IndexKey: {
            S: key
          }
        },
        UpdateExpression: 'SET #AggregateIds = :AggregateId',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': { S: aggregateId }
        }
      })
      .promise()
  }

  /**
   * Store the aggregateId for the given key if it is not already present in the index
   *
   * This realizes a unique key index
   *
   * @param {String} indexName
   * @param {String} key
   * @param {String} aggregateId
   * @returns {Promise}
   * @throws EntryAlreadyExistsError If entry exists
   */
  addIfNotPresent (indexName, key, aggregateId) {
    NonEmptyString(indexName, ['AggregateIndex.addIfNotPresent()', 'indexName:String'])
    NonEmptyString(key, ['AggregateIndex.addIfNotPresent()', 'value:String'])
    NonEmptyString(aggregateId, ['AggregateIndex.addIfNotPresent()', 'aggregateId:String'])
    return this.addToListIfNotPresent(`${indexName}.${key}`, aggregateId)
  }

  /**
   * Remove the aggregateId for the given key from index
   *
   * @param {String} indexName
   * @param {String} key
   * @param {String} aggregateId
   * @returns {Promise}
   */
  remove (indexName, key, aggregateId) {
    NonEmptyString(indexName, ['AggregateIndex.remove()', 'indexName:String'])
    NonEmptyString(key, ['AggregateIndex.remove()', 'value:String'])
    NonEmptyString(aggregateId, ['AggregateIndex.remove()', 'aggregateId:String'])
    return this.dynamoDB
      .deleteItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${indexName}`
          },
          IndexKey: {
            S: key
          }
        }
      })
      .promise()
  }

  /**
   * Add the value to the list of the given type for the aggregateName identified by the given aggregateId
   * if it is not already present
   *
   * @param {String} indexName
   * @param {String} aggregateId
   * @returns {Promise}
   * @throws EntryAlreadyExistsError If entry exists
   */
  addToListIfNotPresent (indexName, aggregateId) {
    NonEmptyString(indexName, ['AggregateIndex.addToListIfNotPresent()', 'indexName:String'])
    NonEmptyString(aggregateId, ['AggregateIndex.addToListIfNotPresent()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: this.aggregateName
          },
          IndexKey: {
            S: indexName
          }
        },
        UpdateExpression: 'ADD #AggregateIds :AggregateId',
        ConditionExpression: 'NOT contains(#AggregateIds, :AggregateIdString)',
        ExpressionAttributeNames: {
          '#AggregateIds': 'AggregateIds'
        },
        ExpressionAttributeValues: {
          ':AggregateId': { 'SS': [aggregateId] },
          ':AggregateIdString': { 'S': aggregateId }
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
      .catch(err => {
        if (err.code === 'ConditionalCheckFailedException') throw new EntryAlreadyExistsError(`Aggregate "${aggregateId}" already member of "${indexName}"!`)
        throw err
      })
  }

  /**
   * Returns the entries of the list
   *
   * @param {String} indexName
   * @returns {Promise.<Array>}
   */
  getList (indexName) {
    NonEmptyString(indexName, ['AggregateIndex.getList()', 'indexName:String'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: this.aggregateName
          },
          IndexKey: {
            S: indexName
          }
        }
      })
      .promise()
      .then(({ Item }) => Item && Item.AggregateIds ? Item.AggregateIds.SS : [])
  }

  /**
   * Remove the value from the list of the given type for the aggregateName identified by the given aggregateId
   *
   * @param {String} indexName
   * @param {String} aggregateId
   * @returns {Promise}
   * @throws EntryAlreadyExistsError If entry exists
   */
  removeFromList (indexName, aggregateId) {
    NonEmptyString(indexName, ['AggregateIndex.removeFromList()', 'indexName:String'])
    NonEmptyString(aggregateId, ['AggregateIndex.removeFromList()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: this.aggregateName
          },
          IndexKey: {
            S: indexName
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
   * Find an aggregateId by the given index type and value
   *
   * @param {String} type
   * @param {String} value
   * @returns {Promise}
   */
  find (type, value) {
    return this.get(type, value)
      .catch(EntryNotFoundError, () => {
        return null
      })
  }

  /**
   * Return an aggregateId by the given index type and key
   *
   * @param {String} indexName
   * @param {String} key
   * @returns {Promise}
   * @throws EntryNotFoundError
   */
  get (indexName, key) {
    NonEmptyString(indexName, ['AggregateIndex.get()', 'indexName:String'])
    NonEmptyString(key, ['AggregateIndex.get()', 'key:String'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        Key: {
          IndexName: {
            S: `${this.aggregateName}.${indexName}`
          },
          IndexKey: {
            S: key
          }
        }
      })
      .promise()
      .then(({ Item }) => {
        if (Item && Item.AggregateIds) return Item.AggregateIds.S
        throw new EntryNotFoundError(`Item for "${indexName}.${key}" not found.`)
      })
  }

  /**
   * Return all aggregateIds in the given index type
   *
   * @param {String} indexName
   * @param {String[]} items
   * @param {Object} ExclusiveStartKey
   * @returns {Promise}
   */
  getAll (indexName, items = [], ExclusiveStartKey) {
    NonEmptyString(indexName, ['AggregateIndex.getAll()', 'indexName:String'])
    return this.dynamoDB
      .query({
        TableName: this.tableName,
        ExclusiveStartKey,
        KeyConditionExpression: 'IndexName = :IndexName',
        ExpressionAttributeValues: { ':IndexName': { S: `${this.aggregateName}.${indexName}` } }
      })
      .promise()
      .then(({ Items, LastEvaluatedKey }) => {
        items = items.concat(Items.map(({ AggregateIds: { S } }) => S))
        if (LastEvaluatedKey) return this.getAll(indexName, items, LastEvaluatedKey)
        return items
      })
  }

  static createTable (dynamoDB, TableName) {
    return dynamoDB
      .createTable({
        TableName,
        KeySchema: [
          {
            AttributeName: 'IndexName',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'IndexKey',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'IndexName',
            AttributeType: 'S'
          },
          {
            AttributeName: 'IndexKey',
            AttributeType: 'S'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      })
      .promise()
  }
}

module.exports = { AggregateIndex }
