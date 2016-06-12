'use strict'

const util = require('util')
const Aggregator = require('../aggregator')
const Promise = require('bluebird')
const _map = require('lodash/map')
const Errors = require('rheactor-value-objects/errors')

function DummyModel (email) {
  this.email = email
}
util.inherits(DummyModel, Aggregator.AggregateRoot)

DummyModel.$aggregateName = 'dummy'

/**
 * @param {Array.<ModelEvent>} events
 * @returns {Promise}
 */
DummyModel.aggregate = function (events) {
  return Promise
    .try(() => {
      let dummy
      _map(events, (event) => {
        let data = event.data
        switch (event.name) {
          case 'DummyCreatedEvent':
            dummy = new DummyModel(data.email)
            dummy.persisted(event.aggregateId, event.createdAt)
            break
          default:
            throw new Errors.UnhandledDomainEvent(event)
        }
      })
      return dummy
    })
    .catch((err) => {
      console.error(err)
      return null
    })
}

/**
 * @param {AggregateRoot} aggregateRoot
 * @constructor
 */
function SampleAggregator (aggregateRoot) {
  Aggregator.Aggregator.call(this, aggregateRoot)
}
util.inherits(SampleAggregator, Aggregator.Aggregator)

module.exports = DummyModel
