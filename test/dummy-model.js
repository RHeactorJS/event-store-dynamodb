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

DummyModel.aggregate = function (id, events) {
  return Promise
    .try(() => {
      let dummy
      _map(events, (event) => {
        let data = event.eventPayload
        switch (event.eventType) {
          case 'DummyCreatedEvent':
            dummy = new DummyModel(data.email)
            dummy.persisted(id)
            break
          default:
            // TODO: Log
            console.error('Unhandled DummyModel event', event)
            throw new Errors.UnhandledDomainEvent(event)
        }
      })
      return dummy
    })
    .catch((err) => {
      // TODO: Log
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
