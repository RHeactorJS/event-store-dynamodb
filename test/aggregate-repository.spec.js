/* global describe it beforeAll afterAll expect */

const { AggregateRepository, AggregateRoot, AggregateMeta, AggregateMetaType, EventStore } = require('../')
const { Promise } = require('bluebird')

const { ModelEvent } = require('../')
const { EntryNotFoundError, EntryDeletedError, UnhandledDomainEventError } = require('@rheactorjs/errors')
const { dynamoDB, close } = require('./helper')
const { v4 } = require('uuid')

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
  let es

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable) => {
      es = new EventStore('Dummy', dynamoDB, eventsTable)
      repository = new AggregateRepository(
        DummyModel,
        es
      )
    }))

  afterAll(close)

  describe('.findById()', () => {
    it('should return undefined if entity not found', () => repository
      .findById('9999999')
      .then((user) => {
        expect(user).toEqual(undefined)
      })
    )
    it('should return undefined if entity is deleted', () => es
      .persist(new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jim.doe@example.invalid' }))
      .then(({ aggregateId }) => repository.getById(aggregateId))
      .then((persistedJim) => es
        .persist(new ModelEvent(persistedJim.meta.id, 2, 'DummyDeletedEvent'))
        .then(() => repository.findById(persistedJim.meta.id)
          .then((user) => {
            expect(user).toEqual(undefined)
          })
        )
      )
    )
  })

  describe('.getById()', () => {
    it('should throw an EntryNotFoundError if entity not found', () => Promise
      .try(() => repository.getById('9999999'))
      .catch(EntryNotFoundError, err => {
        expect(err.message).toContain('Dummy with id "9999999" not found.')
      })
    )
    it('should throw an EntryDeletedError if entity is deleted', () => es
      .persist(new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jack.doe@example.invalid' }))
      .then(({ aggregateId }) => repository.getById(aggregateId))
      .then((persistedJack) => es
        .persist(new ModelEvent(persistedJack.meta.id, 2, 'DummyDeletedEvent'))
        .then(() => {
          Promise
            .try(repository.getById.bind(repository, persistedJack.meta.id))
            .catch(EntryDeletedError, err => {
              expect(err.message).toContain('Dummy with id "' + persistedJack.meta.id + '" is deleted.')
              expect(err.entry.meta.id).toEqual(persistedJack.meta.id)
              expect(err.entry.email).toEqual(persistedJack.email)
            })
        })
      )
    )
  })

  describe('.findAll()', () => {
    it('should return all entities', () => Promise
      .all([
        new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'john.doe@example.invalid' }),
        new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jane.doe@example.invalid' })
      ].map(event => es.persist(event)))
      .then(() => repository.findAll())
      .then((entities) => {
        expect(entities.length).toEqual(2)
        const emails = entities.map(({ email }) => email)
        expect(emails).toContain('john.doe@example.invalid')
        expect(emails).toContain('jane.doe@example.invalid')
      })
    )
  })
})
