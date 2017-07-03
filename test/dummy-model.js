import {ImmutableAggregateRoot} from '../src/immutable-aggregate-root'
import {UnhandledDomainEventError} from '@rheactorjs/errors'
import {AggregateMeta} from '../src/aggregate-meta'

export class DummyModel extends ImmutableAggregateRoot {
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
    const {name, data, createdAt, aggregateId} = event
    switch (name) {
      case 'DummyCreatedEvent':
        return new DummyModel(data.email, new AggregateMeta(aggregateId, 1, createdAt))
      case 'DummyDeletedEvent':
        return new DummyModel(dummy.email, dummy.meta.deleted(createdAt))
      default:
        throw new UnhandledDomainEventError(event.name)
    }
  }
}
