const {EntryAlreadyExistsError, EntryNotFoundError} = require('@rheactorjs/errors')
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
    this.aggregateName = t.String(aggregateName, ['AggregateIndex()', ['aggregateName:string']])
    this.dynamoDB = t.Object(dynamoDB, ['AggregateIndex()', 'dynamoDB:Object'])
    this.tableName = t.String(tableName, ['AggregateIndex()', 'tableName:String'])
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
    t.String(indexName, ['AggregateIndex', 'add()', 'indexName:String'])
    t.String(key, ['AggregateIndex', 'add()', 'value:String'])
    t.String(aggregateId, ['AggregateIndex', 'add()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
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
          ':AggregateId': {S: aggregateId}
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
    t.String(indexName, ['AggregateIndex', 'addIfNotPresent()', 'indexName:String'])
    t.String(key, ['AggregateIndex', 'addIfNotPresent()', 'value:String'])
    t.String(aggregateId, ['AggregateIndex', 'addIfNotPresent()', 'aggregateId:String'])
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
    t.String(indexName, ['AggregateIndex', 'remove()', 'indexName:String'])
    t.String(key, ['AggregateIndex', 'remove()', 'value:String'])
    t.String(aggregateId, ['AggregateIndex', 'remove()', 'aggregateId:String'])
    return this.dynamoDB
      .deleteItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
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
    t.String(indexName, ['AggregateIndex', 'addToListIfNotPresent()', 'indexName:String'])
    t.String(aggregateId, ['AggregateIndex', 'addToListIfNotPresent()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
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
          ':AggregateId': {'SS': [aggregateId]},
          ':AggregateIdString': {'S': aggregateId}
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
    t.String(indexName, ['AggregateIndex', 'getList()', 'indexName:String'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
            S: this.aggregateName
          },
          IndexKey: {
            S: indexName
          }
        }
      })
      .promise()
      .then(({Item}) => Item && Item.AggregateIds ? Item.AggregateIds.SS : [])
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
    t.String(indexName, ['AggregateIndex', 'removeFromList()', 'indexName:String'])
    t.String(aggregateId, ['AggregateIndex', 'removeFromList()', 'aggregateId:String'])
    return this.dynamoDB
      .updateItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
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
          ':AggregateId': {'SS': [aggregateId]}
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
    t.String(indexName, ['AggregateIndex', 'get()', 'indexName:String'])
    t.String(key, ['AggregateIndex', 'get()', 'key:String'])
    return this.dynamoDB
      .getItem({
        TableName: this.tableName,
        Key: {
          AggregateIndexName: {
            S: `${this.aggregateName}.${indexName}`
          },
          IndexKey: {
            S: key
          }
        }
      })
      .promise()
      .then(({Item}) => {
        if (Item && Item.AggregateIds) return Item.AggregateIds.S
        throw new EntryNotFoundError(`Item for "${indexName}.${key}" not found.`)
      })
  }

  /**
   * Return all aggregateIds in the given index type
   *
   * @param {String} indexName
   * @returns {Promise}
   */
  getAll (indexName, items = [], ExclusiveStartKey) {
    t.String(indexName, ['AggregateIndex', 'getAll()', 'indexName:String'])
    return this.dynamoDB
      .query({
        TableName: this.tableName,
        ExclusiveStartKey,
        KeyConditionExpression: 'AggregateIndexName = :AggregateIndexName',
        ExpressionAttributeValues: {':AggregateIndexName': {S: `${this.aggregateName}.${indexName}`}}
      })
      .promise()
      .then(({Items, LastEvaluatedKey}) => {
        items = [...items, ...Items.map(({AggregateIds: {S}}) => S)]
        if (LastEvaluatedKey) return this.get(indexName, items, LastEvaluatedKey)
        return items
      })
  }

  createTable () {
    return this.dynamoDB
      .createTable({
        TableName: this.tableName,
        KeySchema: [
          {
            AttributeName: 'AggregateIndexName',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'IndexKey',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'AggregateIndexName',
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

module.exports = {AggregateIndex}
