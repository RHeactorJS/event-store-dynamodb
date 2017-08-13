/* global describe, it, before */

import { AggregateRelation } from '../src/aggregate-relation'
import { ImmutableAggregateRepository } from '../src/immutable-aggregate-repository'
import { Promise } from 'bluebird'
import helper from './helper'
import { expect } from 'chai'
import { DummyModel } from './dummy-model'

describe('AggregateRelation', function () {
  before(helper.clearDb)

  let repository, relation

  before(() => {
    repository = new ImmutableAggregateRepository(
      DummyModel,
      'dummy',
      helper.redis
    )
    relation = new AggregateRelation(repository, helper.redis)
  })

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
          expect(u1.email).to.equal('josh.doe@example.invalid')
          expect(u2.email).to.equal('jasper.doe@example.invalid')
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
          expect(items.length).to.equal(1)
          expect(items[0].email).to.equal('jane.doe@example.invalid')
        })
    })
  )

  it('should honor repository alias', (done) => {
    const relation = new AggregateRelation({alias: 'foo'})
    relation.redis = {
      saddAsync: (key, id) => {
        expect(key).to.equal('foo:acme:42')
        expect(id).to.equal('17')
        done()
      }
    }
    relation.addRelatedId('acme', '42', '17')
  })
})
