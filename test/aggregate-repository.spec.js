'use strict'

/* global describe, it, before */

const AggregateRepository = require('../aggregate-repository')
const Promise = require('bluebird')
const helper = require('./helper')
const expect = require('chai').expect
const DummyModel = require('./dummy-model')
const ModelEvent = require('../model-event')
const Errors = require('rheactor-value-objects/errors')

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

  describe('.add()', () => {
    it('should add entities', (done) => {
      const john = new DummyModel('john.doe@example.invalid')
      const jane = new DummyModel('jane.doe@example.invalid')
      Promise.join(repository.add(john), repository.add(jane))
        .spread((event1, event2) => {
          expect(event1).to.be.instanceOf(ModelEvent)
          expect(event1.name).to.equal('DummyCreatedEvent')
          expect(event2).to.be.instanceOf(ModelEvent)
          return Promise
            .join(repository.getById(event1.aggregateId), repository.getById(event2.aggregateId))
            .spread((u1, u2) => {
              expect(u1.email).to.equal('john.doe@example.invalid')
              expect(u1.aggregateVersion()).to.equal(1)
              expect(u2.email).to.equal('jane.doe@example.invalid')
              expect(u2.aggregateVersion()).to.equal(1)
              done()
            })
        })
    })
  })

  describe('.remove()', () => {
    it('should remove entities', (done) => {
      const mike = new DummyModel('mike.doe@example.invalid')
      repository.add(mike)
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedMike) => {
          expect(persistedMike.isDeleted()).to.equal(false)
          return repository
            .remove(persistedMike)
            .then((deletedEvent) => {
              expect(deletedEvent).to.be.instanceOf(ModelEvent)
              expect(deletedEvent.name).to.equal('DummyDeletedEvent')
              expect(persistedMike.isDeleted()).to.equal(true)
              done()
            })
        })
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
    it('should return undefined if entity is deleted', (done) => {
      const jim = new DummyModel('jim.doe@example.invalid')
      repository.add(jim)
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedJim) => {
          return repository
            .remove(persistedJim)
            .then(() => {
              repository.findById(persistedJim.aggregateId())
                .then((user) => {
                  expect(user).to.equal(undefined)
                  done()
                })
            })
        })
    })
  })

  describe('.getById()', () => {
    it('should throw an EntityNotFoundError if entity not found', (done) => {
      Promise.try(repository.getById.bind(repository, 9999999))
        .catch(Errors.EntityNotFoundError, (err) => {
          expect(err.message).to.be.contain('dummy with id "9999999" not found.')
          done()
        })
    })
    it('should throw an EntityDeletedError if entity is deleted', (done) => {
      const jack = new DummyModel('jack.doe@example.invalid')
      repository.add(jack)
        .then((createdEvent) => {
          return repository.getById(createdEvent.aggregateId)
        })
        .then((persistedJack) => {
          return repository
            .remove(persistedJack)
            .then(() => {
              Promise
                .try(repository.getById.bind(repository, persistedJack.aggregateId()))
                .catch(Errors.EntityDeletedError, (err) => {
                  expect(err.message).to.be.contain('dummy with id "' + persistedJack.aggregateId() + '" is deleted.')
                  expect(err.entity).to.deep.equal(persistedJack)
                  done()
                })
            })
        })
    })
  })

  describe('.findAll()', () => {
    it('should return all entities', (done) => {
      repository.findAll()
        .then((entities) => {
          expect(entities.length).to.equal(2)
          expect(entities[0].email).to.equal('john.doe@example.invalid')
          expect(entities[1].email).to.equal('jane.doe@example.invalid')
          done()
        })
    })
  })
})
