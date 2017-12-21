const {EventStore} = require('./event-store')
const {ModelEvent, ModelEventType} = require('./model-event')
const {EntryNotFoundError, EntryDeletedError} = require('@rheactorjs/errors')
const {Promise} = require('bluebird')
const {MaybeStringType, AggregateIdType} = require('./types')
const {irreducible, String: StringType, Function: FunctionType, Object: ObjectType} = require('tcomb')

class AggregateRepository {
  /**
   * Creates a new aggregate repository
   *
   * @param {AggregateRoot} {applyEvent: {Function}}
   * @param {String} alias
   * @param {DynamoDB} dynamoDB
   */
  constructor ({applyEvent}, alias, dynamoDB) {
    FunctionType(applyEvent, ['AggregateRepository', 'root:AggregateRoot'])
    StringType(alias, ['AggregateRepository', 'alias:String'])
    this.applyEvent = applyEvent
    this.alias = alias
    this.prefix = alias.charAt(0).toUpperCase() + alias.slice(1)
    this.eventStore = new EventStore(alias, dynamoDB)
    this.dynamoDB = dynamoDB
  }

  /**
   * Generic method for add aggregates to the collection.
   * The repository will assign an ID to them.
   *
   * Calls applyEvent with the created event on the aggregate.
   *
   * @param {Object} data
   * @param {String} createdBy
   * @returns {Promise.<ModelEvent>}
   */
  add (data, createdBy) {
    ObjectType(data, ['AggregateRepository', 'add()', 'data:Object'])
    MaybeStringType(createdBy, ['AggregateRepository', 'add()', 'createdBy:?String'])
    return this.dynamoDB.incrAsync(this.alias + ':id')
      .then((id) => this.persistEvent(new ModelEvent('' + id, this.prefix + 'CreatedEvent', data, new Date(), createdBy)))
  }

  /**
   * Generic method to persist model events
   *
   * @param {ModelEvent} modelEvent
   * @return {Promise.<ModelEvent>}
   */
  persistEvent (modelEvent) {
    ModelEventType(modelEvent, ['AggregateRepository', 'persistEvent()', 'modelEvent:ModelEvent'])
    return this.eventStore.persist(modelEvent).then(() => modelEvent)
  }

  /**
   * Generic method for removing aggregates from the collection
   *
   * @param {Number} id
   * @param {String} createdBy
   * @returns {Promise.<ModelEvent>}
   */
  remove (id, createdBy) {
    AggregateIdType(id, ['AggregateRepository', 'remove()', 'id:AggregateId'])
    MaybeStringType(createdBy, ['AggregateRepository', 'remove()', 'createdBy:?String'])
    return this.persistEvent(new ModelEvent(id, this.prefix + 'DeletedEvent', {}, new Date(), createdBy))
  }

  /**
   * Generic method for loading aggregates by id
   *
   * @param {String} id
   * @returns {Promise.<AggregateRoot>} or undefined if not found
   */
  findById (id) {
    AggregateIdType(id, ['AggregateRepository', 'findById()', 'id:AggregateId'])
    return this.eventStore.fetch(id)
      .reduce((aggregate, event) => this.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      .then(aggregate => {
        if (!aggregate) return
        return aggregate.meta.isDeleted ? undefined : aggregate
      })
  }

  /**
   * Returns all entities
   *
   * NOTE: naively returns all entities by fetching them one by one by ID starting
   * from 1 to the current max id.
   *
   * @returns {Promise.<Array.<AggregateRoot>>}
   */
  findAll () {
    return this.dynamoDB.getAsync(this.alias + ':id')
      .then((maxId) => {
        let promises = []
        for (let i = 1; i <= maxId; i++) {
          promises.push(this.findById('' + i))
        }
        return Promise.all(promises)
      })
      .filter((item) => {
        return item !== undefined
      })
  }

  /**
   * Generic method for loading aggregates by id
   *
   * @param {String} id
   * @returns {Promise.<AggregateRoot>}
   * @throws {EntryNotFoundError} if entity is not found
   */
  getById (id) {
    AggregateIdType(id, ['AggregateRepository', 'getById()', 'id:AggregateId'])
    return this.eventStore.fetch(id)
      .reduce((aggregate, event) => this.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      .then(aggregate => {
        if (!aggregate) {
          throw new EntryNotFoundError(this.alias + ' with id "' + id + '" not found.')
        }
        if (aggregate.meta.isDeleted) {
          throw new EntryDeletedError(this.alias + ' with id "' + id + '" is deleted.', aggregate)
        }
        return aggregate
      })
  }
}

const AggregateRepositoryType = irreducible('AggregateRepositoryType', x => x instanceof AggregateRepository)

module.exports = {AggregateRepository, AggregateRepositoryType}
