'use strict'

/* global describe, it, before */

const AggregateRepository = require('../aggregate-repository')
const Promise = require('bluebird')
const helper = require('./helper')
const expect = require('chai').expect
const DummyModel = require('./dummy-model')
const ModelEvent = require('../model-event')

describe('AggregateRepository', function () {
  before(helper.clearDb)

  let repository

  before(() => {
    repository = new AggregateRepository(
      DummyModel,
      'dummy',
      helper.redis
    )
  })

  it('should create', (done) => {
    Promise.join(repository.create({email: 'john.doe@example.invalid'}), repository.create({email: 'jane.doe@example.invalid'}))
      .spread((event1, event2) => {
        expect(event1).to.be.instanceOf(ModelEvent)
        expect(event2).to.be.instanceOf(ModelEvent)
        return Promise.join(repository.findById(event1.aggregateId), repository.findById(event2.aggregateId))
      })
      .spread((u1, u2) => {
        expect(u1.email).to.equal('john.doe@example.invalid')
        expect(u1.aggregateVersion()).to.equal(1)
        expect(u2.email).to.equal('jane.doe@example.invalid')
        expect(u2.aggregateVersion()).to.equal(1)
        done()
      })
  })

  describe('.findById()', () => {
    it('should return undefined if entity not found', (done) => {
      repository.findById(9999999)
        .then((user) => {
          expect(user).to.equal(undefined)
          done()
        })
    })
  })

  describe('.getById()', () => {
    it('should throw an EntityNotFoundError if entity not found', (done) => {
      Promise.try(repository.getById.bind(repository, 9999999))
        .catch((err) => {
          expect(err.name).to.be.equal('EntityNotFoundError')
          expect(err.message).to.be.contain('dummy with id "9999999" not found.')
          done()
        })
    })
  })
})
