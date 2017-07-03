import {maybe, irreducible} from 'tcomb'
import {ModelEventType} from './model-event'
import {UnhandledDomainEventError} from '@rheactorjs/errors'
import {AggregateMetaType} from './aggregate-meta'

/**
 * Base class for aggregates
 */
export class ImmutableAggregateRoot {
  /**
   * @param {AggregateMeta} meta
   */
  constructor (meta) {
    AggregateMetaType(meta, ['ImmutableAggregateRoot', 'meta:AggregateMeta'])
    this._meta = meta
  }

  /**
   * @returns {AggregateMeta}
   */
  get meta () {
    return this._meta
  }

  /**
   * Applies the event to the aggregate.
   * Return a new, updated aggregate.
   *
   * @param {ModelEvent} event
   * @param {ImmutableAggregateRoot|undefined} aggregate May be undefined for the first event (usually the create event)
   * @returns {ImmutableAggregateRoot}
   */
  static applyEvent (event, aggregate) {
    ModelEventType(event, ['ImmutableAggregateRoot', 'applyEvent()', 'event:ModelEvent'])
    MaybeImmutableAggregateRootType(aggregate, ['ImmutableAggregateRoot', 'applyEvent()', 'aggregate:?ImmutableAggregateRoot'])
    throw new UnhandledDomainEventError(`${event.name} because applyEvent is not implemented.`)
  }
}

export const ImmutableAggregateRootType = irreducible('ImmutableAggregateRootType', x => x instanceof ImmutableAggregateRoot)
export const MaybeImmutableAggregateRootType = maybe(ImmutableAggregateRootType)
