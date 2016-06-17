'use strict'

const util = require('util')
const AggregateRoot = require('../aggregate-root')
const Errors = require('rheactor-value-objects/errors')

function DummyModel (email) {
  AggregateRoot.call(this)
  this.email = email
}
util.inherits(DummyModel, AggregateRoot)

DummyModel.$aggregateName = 'dummy'

/**
 * @param {ModelEvent} event
 */
DummyModel.prototype.applyEvent = function (event) {
  let self = this
  let data = event.data
  switch (event.name) {
    case 'DummyCreatedEvent':
      this.email = event.data.email
      this.persisted(event.aggregateId, event.createdAt)
      break
    case 'DummyDeletedEvent':
      this.deleted(event.createdAt)
      break
    default:
      throw new Errors.UnhandledDomainEvent(event.name)
  }
}

module.exports = DummyModel
