const { AggregateRoot } = require('../')
const { UnhandledDomainEventError } = require('@rheactorjs/errors')
const { AggregateMeta } = require('../')

class DummyModel extends AggregateRoot {
  /**
   * @param {string} email
   * @param {AggregateMeta} meta
   */
  constructor (email, meta) {
    super(meta)
    this.email = email
  }

  /**
   * Applies the event
   *
   * @param {ModelEvent} event
   * @param {DummyModel|undefined} dummy
   * @return {DummyModel}
   */
  static applyEvent (event, dummy) {
    const { name, payload, createdAt, aggregateId } = event
    switch (name) {
      case 'DummyCreatedEvent':
        return new DummyModel(payload.email, new AggregateMeta(aggregateId, 1, createdAt))
      case 'DummyDeletedEvent':
        return new DummyModel(dummy.email, dummy.meta.deleted(createdAt))
      default:
        throw new UnhandledDomainEventError(event.name)
    }
  }
}

module.exports = { DummyModel }
