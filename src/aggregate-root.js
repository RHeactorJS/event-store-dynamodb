const {maybe, irreducible} = require('tcomb')
const {ModelEventType} = require('./model-event')
const {UnhandledDomainEventError} = require('@rheactorjs/errors')
const {AggregateMetaType} = require('./aggregate-meta')

/**
 * Base class for aggregates
 */
class AggregateRoot {
  /**
   * @param {AggregateMeta} meta
   */
  constructor (meta) {
    AggregateMetaType(meta, ['AggregateRoot', 'meta:AggregateMeta'])
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
   * @param {AggregateRoot|undefined} aggregate May be undefined for the first event (usually the create event)
   * @returns {AggregateRoot}
   */
  static applyEvent (event, aggregate) {
    ModelEventType(event, ['AggregateRoot', 'applyEvent()', 'event:ModelEvent'])
    MaybeAggregateRootType(aggregate, ['AggregateRoot', 'applyEvent()', 'aggregate:?AggregateRoot'])
    throw new UnhandledDomainEventError(`${event.name} because applyEvent is not implemented.`)
  }
}

const AggregateRootType = irreducible('AggregateRootType', x => x instanceof AggregateRoot)
const MaybeAggregateRootType = maybe(AggregateRootType)

module.exports = {AggregateRoot, AggregateRootType, MaybeAggregateRootType}
