'use strict'

/* global describe, it, before */

const AggregateRelation = require('../aggregate-relation')
const AggregateRepository = require('../aggregate-repository')
const Promise = require('bluebird')
const helper = require('./helper')
const expect = require('chai').expect
const DummyModel = require('./dummy-model')

describe('AggregateRelation', function () {
  before(helper.clearDb)

  let repository, relation

  before(() => {
    repository = new AggregateRepository(
      DummyModel,
      'dummy',
      helper.redis
    )
    relation = new AggregateRelation(repository, helper.redis)
  })

  it('should add items', (done) => {
    const josh = new DummyModel('josh.doe@example.invalid')
    const jasper = new DummyModel('jasper.doe@example.invalid')
    Promise.join(repository.add(josh), repository.add(jasper))
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
            done()
          })
      })
  })
})
