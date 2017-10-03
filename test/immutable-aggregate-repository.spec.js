/* global describe it beforeAll expect */

import { ImmutableAggregateRepository, ImmutableAggregateRoot, AggregateMeta, AggregateMetaType } from '../src'
import { Promise } from 'bluebird'
import helper from './helper'

import { ModelEvent } from '../src/model-event'
import { EntryNotFoundError, EntryDeletedError, UnhandledDomainEventError } from '@rheactorjs/errors'

class DummyModel extends ImmutableAggregateRoot {
  constructor (email, meta) {
    AggregateMetaType(meta, ['DummyModel', 'meta:AggregateMeta'])
    super(meta)
    this.email = email
  }

  /**
   * @param {ModelEvent} event
   * @param {ImmutableAggregateRoot|undefined} aggregate
   * @return {ImmutableAggregateRoot}
   */
  static applyEvent (event, aggregate) {
    switch (event.name) {
      case 'DummyCreatedEvent':
        return new DummyModel(event.data.email, new AggregateMeta(event.aggregateId, 1, event.createdAt))
      case 'DummyDeletedEvent':
        return new DummyModel(aggregate.email, aggregate.meta.deleted(event.createdAt))
      default:
        throw new UnhandledDomainEventError(event.name)
    }
  }
}

describe('ImmutableAggregateRepository', function () {
  beforeAll(helper.clearDb)

  let repository

  beforeAll(() => helper.redis()
    .then(client => {
      repository = new ImmutableAggregateRepository(
        DummyModel,
        'dummy',
        client
      )
    }))

  describe('.add()', () => {
    it('should add entities', () => {
      return Promise.join(repository.add({email: 'john.doe@example.invalid'}, 'someAuthor'), repository.add({email: 'jane.doe@example.invalid'}))
        .spread((event1, event2) => {
          expect(event1).toBeInstanceOf(ModelEvent)
          expect(event1.name).toEqual('DummyCreatedEvent')
          expect(event1.createdBy).toEqual('someAuthor')
          expect(event2).toBeInstanceOf(ModelEvent)
          expect(event2.createdBy).toEqual(undefined)
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
            .remove(persistedMike.meta.id, 'someAuthor')
            .then((deletedEvent) => {
              expect(deletedEvent).toBeInstanceOf(ModelEvent)
              expect(deletedEvent.name).toEqual('DummyDeletedEvent')
              expect(deletedEvent.createdBy).toEqual('someAuthor')
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
          expect(err.message).toContain('dummy with id "9999999" not found.')
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
                  expect(err.message).toContain('dummy with id "' + persistedJack.meta.id + '" is deleted.')
                  expect(err.entry.meta.id).toEqual(persistedJack.meta.id)
                  expect(err.entry.email).toEqual(persistedJack.email)
                })
            })
        })
    })
  })

  describe('.findAll()', () => {
    it(
      'should return all entities',
      () => repository.findAll()
        .then((entities) => {
          expect(entities.length).toEqual(2)
          expect(entities[0].email).toEqual('john.doe@example.invalid')
          expect(entities[1].email).toEqual('jane.doe@example.invalid')
        })
    )
  })
})
