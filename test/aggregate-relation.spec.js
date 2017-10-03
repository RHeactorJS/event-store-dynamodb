/* global describe it beforeAll expect */

import { AggregateRelation } from '../src/aggregate-relation'
import { ImmutableAggregateRepository } from '../src/immutable-aggregate-repository'
import { Promise } from 'bluebird'
import helper from './helper'
import { DummyModel } from './dummy-model'

describe('AggregateRelation', function () {
  beforeAll(helper.clearDb)

  let repository, relation

  beforeAll(() => helper.redis()
    .then(client => {
      repository = new ImmutableAggregateRepository(
        DummyModel,
        'dummy',
        client
      )
      relation = new AggregateRelation(repository, client)
    }))

  it('should add items', () => Promise
    .join(repository.add({email: 'josh.doe@example.invalid'}), repository.add({email: 'jasper.doe@example.invalid'}))
    .spread((event1, event2) => {
      return Promise
        .join(
          relation.addRelatedId('meeting', '42', event1.aggregateId),
          relation.addRelatedId('meeting', '42', event2.aggregateId)
        )
        .then(() => {
          return relation.findByRelatedId('meeting', '42')
        })
        .spread((u1, u2) => {
          expect(u1.email).toEqual('josh.doe@example.invalid')
          expect(u2.email).toEqual('jasper.doe@example.invalid')
        })
    })
  )

  it('should remove items', () => Promise
    .join(repository.add({email: 'jill.doe@example.invalid'}), repository.add({email: 'jane.doe@example.invalid'}))
    .spread((event1, event2) => {
      return Promise
        .join(
          relation.addRelatedId('acme', '17', event1.aggregateId),
          relation.addRelatedId('acme', '17', event2.aggregateId)
        )
        .then(() => relation.removeRelatedId('acme', '17', event1.aggregateId))
        .then(() => relation.findByRelatedId('acme', '17'))
        .then((items) => {
          expect(items.length).toEqual(1)
          expect(items[0].email).toEqual('jane.doe@example.invalid')
        })
    })
  )

  it('should honor repository alias', (done) => {
    const relation = new AggregateRelation({alias: 'foo'})
    relation.redis = {
      saddAsync: (key, id) => {
        expect(key).toEqual('foo:acme:42')
        expect(id).toEqual('17')
        done()
      }
    }
    relation.addRelatedId('acme', '42', '17')
  })
})
