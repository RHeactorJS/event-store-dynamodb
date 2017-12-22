const {ModelEvent, ModelEventType} = require('./model-event')
const t = require('tcomb')
const {NonEmptyString} = require('./types')

class EventStore {
  /**
   * Creates a new EventStore for the given aggregateName, e.g. 'user'.
   *
   * An event store maintains a version counter per aggregateName id which guarantees that events have an ever increasing
   * version id.
   *
   * @param {String} aggregateName
   * @param {DynamoDB} dynamoDB
   * @param {string} tableName
   */
  constructor (aggregateName, dynamoDB, tableName = 'events') {
    this.aggregateName = NonEmptyString(aggregateName, ['EventStore()', ['aggregateName:string']])
    this.dynamoDB = t.Object(dynamoDB, ['EventStore()', ['dynamoDB:object']])
    this.tableName = NonEmptyString(tableName, ['EventStore()', ['tableName:string']])
  }

  getId (aggregateId) {
    NonEmptyString(aggregateId, ['EventStore.getId()', 'aggregateId:String'])
    return `${this.aggregateName}.${aggregateId}`
  }

  /**
   * Persists an event
   *
   * The dynamoDB list type guarantees the order of insertion. So we don't need to jump through hoops to manage a version
   * id per aggregateName. This can simply be done in the fetch method.
   *
   * @param {ModelEvent} event
   * @return {Promise}
   */
  persist (event) {
    ModelEventType(event, ['EventStore.persist()', 'event:ModelEvent'])
    return this.dynamoDB
      .putItem({
        Item: {
          Id: {
            S: this.getId(event.aggregateId)
          },
          Version: {
            N: `${event.aggregateVersion}`
          },
          AggregateId: {
            S: event.aggregateId
          },
          AggregateName: {
            S: this.aggregateName
          },
          Name: {
            S: event.name
          },
          CreatedAt: {
            S: event.createdAt.toISOString()
          },
          Payload: {
            S: JSON.stringify(event.payload)
          }
        },
        TableName: this.tableName
      })
      .promise()
  }

  /**
   * Returns the events for the aggregateName identified by aggregateId.
   *
   * @param {String} aggregateId
   * @return {Promise.<Array.<ModelEvent>>}
   */
  fetch (aggregateId) {
    NonEmptyString(aggregateId, ['EventStore.fetch()', 'aggregateId:String'])
    const fetchEvents = (events = [], ExclusiveStartKey) => this.dynamoDB
      .query({
        TableName: this.tableName,
        ExclusiveStartKey,
        KeyConditionExpression: 'Id = :id AND Version > :version',
        ExpressionAttributeValues: {':id': {'S': this.getId(aggregateId)}, ':version': {'N': '0'}}
      })
      .promise()
      .then(({Items, LastEvaluatedKey}) => {
        events = events.concat(Items)
        if (LastEvaluatedKey) return fetchEvents(events, LastEvaluatedKey)
        return events
      })
    return fetchEvents()
      .map(event => new ModelEvent(aggregateId, +event.Version.N, event.Name.S, JSON.parse(event.Payload.S), new Date(event.CreatedAt.S)))
  }

  /**
   * Returns the ids of all aggregates
   *
   * @return {Promise<string[]>}
   */
  list () {
    const fetchAggregates = (aggregates = [], ExclusiveStartKey) => this.dynamoDB
      .query({
        TableName: this.tableName,
        IndexName: 'Aggregate-index',
        ExclusiveStartKey,
        KeyConditionExpression: 'AggregateName = :AggregateName',
        ExpressionAttributeValues: {':AggregateName': {'S': this.aggregateName}}
      })
      .promise()
      .then(({Items, LastEvaluatedKey}) => {
        aggregates = aggregates.concat(Items.map(({AggregateId}) => AggregateId.S))
        if (LastEvaluatedKey) return fetchAggregates(aggregates, LastEvaluatedKey)
        return aggregates
      })
    return fetchAggregates()
      .then(aggregates => aggregates.reduce((aggregates, aggregate) => {
        if (!aggregates.includes(aggregate)) aggregates.push(aggregate)
        return aggregates
      }, []))
  }

  static createTable (dynamoDB, TableName) {
    return dynamoDB
      .createTable({
        TableName,
        KeySchema: [
          {
            AttributeName: 'Id',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'Version',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'Id',
            AttributeType: 'S'
          },
          {
            AttributeName: 'Version',
            AttributeType: 'N'
          },
          {
            AttributeName: 'AggregateName',
            AttributeType: 'S'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        },
        GlobalSecondaryIndexes: [
          {
            IndexName: 'Aggregate-index',
            KeySchema: [
              {
                AttributeName: 'AggregateName',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'INCLUDE',
              NonKeyAttributes: ['AggregateId']
            },
            ProvisionedThroughput: {
              ReadCapacityUnits: 1,
              WriteCapacityUnits: 1
            }
          }
        ]
      })
      .promise()
  }
}

const EventStoreType = t.irreducible('EventStoreType', x => x instanceof EventStore)

module.exports = {EventStore, EventStoreType}
