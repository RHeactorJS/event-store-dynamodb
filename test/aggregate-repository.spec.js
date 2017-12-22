/* global describe it beforeAll afterAll expect */

const {AggregateRepository, AggregateRoot, AggregateMeta, AggregateMetaType, EventStore} = require('../')
const {Promise} = require('bluebird')

const {ModelEvent} = require('../')
const {EntryNotFoundError, EntryDeletedError, UnhandledDomainEventError} = require('@rheactorjs/errors')
const {dynamoDB, close} = require('./helper')

class DummyModel extends AggregateRoot {
  constructor (email, meta) {
    AggregateMetaType(meta, ['DummyModel', 'meta:AggregateMeta'])
    super(meta)
    this.email = email
  }

  /**
   * @param {ModelEvent} event
   * @param {AggregateRoot|undefined} aggregate
   * @return {AggregateRoot}
   */
  static applyEvent (event, aggregate) {
    switch (event.name) {
      case 'DummyCreatedEvent':
        return new DummyModel(event.payload.email, new AggregateMeta(event.aggregateId, 1, event.createdAt))
      case 'DummyDeletedEvent':
        return new DummyModel(aggregate.email, aggregate.meta.deleted(event.createdAt))
      default:
        throw new UnhandledDomainEventError(event.name)
    }
  }
}

describe('AggregateRepository', function () {
  let repository

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable) => {
      repository = new AggregateRepository(
        DummyModel,
        new EventStore('Dummy', dynamoDB, eventsTable))
    }))

  afterAll(close)

  describe('.add()', () => {
    it('should add entities', () => {
      return Promise.join(repository.add({email: 'john.doe@example.invalid'}), repository.add({email: 'jane.doe@example.invalid'}))
        .spread((event1, event2) => {
          expect(event1).toBeInstanceOf(ModelEvent)
          expect(event1.name).toEqual('DummyCreatedEvent')
          expect(event2).toBeInstanceOf(ModelEvent)
          return Promise
            .join(repository.getById(event1.aggregateId), repository.getById(event2.aggregateId))
            .spread((u1, u2) => {
              expect(u1.email).toEqual('john.doe@example.invalid')
              expect(u1.meta.version).toEqual(1)
              expect(u2.email).toEqual('jane.doe@example.invalid')
              expect(u2.meta.version).toEqual(1)
            })
        })
    })
  })

  describe('.remove()', () => {
    it('should remove entities', () => {
      return repository.add({email: 'mike.doe@example.invalid'})
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedMike) => {
          expect(persistedMike.meta.isDeleted).toEqual(false)
          return repository
            .remove(persistedMike.meta.id, persistedMike.meta.version, {foo: 'bar'})
            .then((deletedEvent) => {
              expect(deletedEvent).toBeInstanceOf(ModelEvent)
              expect(deletedEvent.name).toEqual('DummyDeletedEvent')
              expect(deletedEvent.payload).toEqual({foo: 'bar'})
              return repository.getById(deletedEvent.aggregateId)
                .catch(EntryDeletedError, err => {
                  expect(err.entry.meta.isDeleted).toEqual(true)
                })
            })
        })
    })
  })

  describe('.findById()', () => {
    it(
      'should return undefined if entity not found',
      () => repository.findById('9999999')
        .then((user) => {
          expect(user).toEqual(undefined)
        })
    )
    it('should return undefined if entity is deleted', () => {
      repository.add({email: 'jim.doe@example.invalid'})
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedJim) => {
          return repository
            .remove(persistedJim.meta.id)
            .then(() => {
              repository.findById(persistedJim.meta.id)
                .then((user) => {
                  expect(user).toEqual(undefined)
                })
            })
        })
    })
  })

  describe('.getById()', () => {
    it(
      'should throw an EntryNotFoundError if entity not found',
      () => Promise.try(repository.getById.bind(repository, '9999999'))
        .catch(EntryNotFoundError, err => {
          expect(err.message).toContain('Dummy with id "9999999" not found.')
        })
    )
    it('should throw an EntryDeletedError if entity is deleted', () => {
      return repository.add({email: 'jack.doe@example.invalid'})
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedJack) => {
          return repository
            .remove(persistedJack.meta.id)
            .then(() => {
              Promise
                .try(repository.getById.bind(repository, persistedJack.meta.id))
                .catch(EntryDeletedError, err => {
                  expect(err.message).toContain('Dummy with id "' + persistedJack.meta.id + '" is deleted.')
                  expect(err.entry.meta.id).toEqual(persistedJack.meta.id)
                  expect(err.entry.email).toEqual(persistedJack.email)
                })
            })
        })
    })
  })

  describe('.findAll()', () => {
    it('should return all entities', () => repository
      .findAll()
      .then((entities) => {
        expect(entities.length).toEqual(2)
        const emails = entities.map(({email}) => email)
        expect(emails).toContain('john.doe@example.invalid')
        expect(emails).toContain('jane.doe@example.invalid')
      })
    )
  })
})
