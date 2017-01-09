import {AggregateRoot} from '../src/aggregate-root'
import {UnhandledDomainEvent} from 'rheactor-value-objects/errors'

export class DummyModel extends AggregateRoot {
  constructor (email) {
    super()
    this.email = email
  }

  /**
   * @param {ModelEvent} event
   * @return {ModelEvent} event
   */
  applyEvent (event) {
    switch (event.name) {
      case 'DummyCreatedEvent':
        this.email = event.data.email
        this.persisted(event.aggregateId, event.createdAt)
        break
      case 'DummyDeletedEvent':
        this.deleted(event.createdAt)
        break
      default:
        throw new UnhandledDomainEvent(event.name)
    }
  }
}
