const {EventStoreType} = require('./event-store')
const {ModelEvent, ModelEventType} = require('./model-event')
const {EntryNotFoundError, EntryDeletedError} = require('@rheactorjs/errors')
const t = require('tcomb')
const {v4} = require('uuid')
const {PositiveInteger, NonEmptyString} = require('./types')

class AggregateRepository {
  /**
   * Creates a new aggregateName repository
   *
   * @param {AggregateRoot} {applyEvent: {Function}}
   * @param {EventStore} eventStore
   */
  constructor ({applyEvent}, eventStore) {
    this.applyEvent = t.Function(applyEvent, ['AggregateRepository()', 'root:AggregateRoot'])
    this.eventStore = EventStoreType(eventStore, ['AggregateRepository()', 'eventStore:EventStore'])
  }

  /**
   * Generic method for add aggregates to the collection.
   * The repository will assign an ID to them.
   *
   * Calls applyEvent with the created event on the aggregateName.
   *
   * @param {Object} payload
   * @returns {Promise.<ModelEvent>}
   */
  add (payload) {
    t.Object(payload, ['AggregateRepository.add()', 'payload:Object'])
    return this.persistEvent(new ModelEvent(v4(), 1, this.eventStore.aggregateName + 'CreatedEvent', payload, new Date()))
  }

  /**
   * Generic method to persist model events
   *
   * @param {ModelEvent} modelEvent
   * @return {Promise.<ModelEvent>}
   */
  persistEvent (modelEvent) {
    ModelEventType(modelEvent, ['AggregateRepository.persistEvent()', 'modelEvent:ModelEvent'])
    return this.eventStore.persist(modelEvent).then(() => modelEvent)
  }

  /**
   * Generic method for removing aggregates from the collection
   *
   * @param {String} id
   * @param {Number} version
   * @param {Object} payload
   * @returns {Promise.<ModelEvent>}
   */
  remove (id, version, payload = {}) {
    NonEmptyString(id, ['AggregateRepository.remove()', 'id:AggregateId'])
    t.maybe(PositiveInteger)(version, ['AggregateRepository.remove()', 'version?:int>0'])
    if (!version) {
      return this.findById(id).then(aggregate => this.remove(id, aggregate.meta.version))
    }
    return this.persistEvent(new ModelEvent(id, version + 1, this.eventStore.aggregateName + 'DeletedEvent', payload, new Date()))
  }

  /**
   * Generic method for loading aggregates by id
   *
   * @param {String} id
   * @returns {Promise.<AggregateRoot>} or undefined if not found
   */
  findById (id) {
    NonEmptyString(id, ['AggregateRepository.findById()', 'id:AggregateId'])
    return this.eventStore
      .fetch(id)
      .reduce((aggregate, event) => this.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      .then(aggregate => {
        if (!aggregate) return
        return aggregate.meta.isDeleted ? undefined : aggregate
      })
  }

  /**
   * Generic method for loading all aggregates
   *
   * @returns {Promise.<AggregateRoot[]>}
   */
  findAll () {
    return this.eventStore
      .list()
      .map(id => this.findById(id))
      .filter(aggregate => aggregate) // remove deleted
  }

  /**
   * Generic method for loading aggregates by id
   *
   * @param {String} id
   * @returns {Promise.<AggregateRoot>}
   * @throws {EntryNotFoundError} if entity is not found
   */
  getById (id) {
    NonEmptyString(id, ['AggregateRepository.getById()', 'id:AggregateId'])
    return this.eventStore.fetch(id)
      .reduce((aggregate, event) => this.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      .then(aggregate => {
        if (!aggregate) {
          throw new EntryNotFoundError(this.eventStore.aggregateName + ' with id "' + id + '" not found.')
        }
        if (aggregate.meta.isDeleted) {
          throw new EntryDeletedError(this.eventStore.aggregateName + ' with id "' + id + '" is deleted.', aggregate)
        }
        return aggregate
      })
  }
}

const AggregateRepositoryType = t.irreducible('AggregateRepositoryType', x => x instanceof AggregateRepository)

module.exports = {AggregateRepository, AggregateRepositoryType}
