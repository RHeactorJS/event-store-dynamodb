const {EventStoreType} = require('./event-store')
const {EntryNotFoundError, EntryDeletedError} = require('@rheactorjs/errors')
const t = require('tcomb')
const {NonEmptyString} = require('./types')

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
   * Generic method for loading aggregates by id
   *
   * @param {String} id
   * @returns {Promise.<AggregateRoot>} or undefined if not found
   */
  findById (id) {
    NonEmptyString(id, ['AggregateRepository.findById()', 'id:String'])
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
    NonEmptyString(id, ['AggregateRepository.getById()', 'id:String'])
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
