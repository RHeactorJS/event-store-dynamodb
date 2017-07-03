/* global describe, it, before */

import {EventStore} from '../src/event-store'
import {ModelEvent} from '../src/model-event'
import {ImmutableAggregateRepository} from '../src/immutable-aggregate-repository'
import {SnapshotAggregateRepository} from '../src/snapshot-aggregate-repository'
import {Promise} from 'bluebird'
import helper from './helper'
import {expect} from 'chai'
import {ImmutableAggregateRoot} from '../src/immutable-aggregate-root'
import {AggregateMeta} from '../src/aggregate-meta'

class DummyModel extends ImmutableAggregateRoot {
  /**
   * Applies the event
   *
   * @param {ModelEvent} event
   * @param {DummyModel|undefined} dummy
   * @return {DummyModel}
   */
  static applyEvent (event, dummy) {
    const {createdAt, aggregateId} = event
    if (!dummy) return new DummyModel(new AggregateMeta(aggregateId, 1, createdAt))
    return new DummyModel(dummy.meta.updated(createdAt))
  }
}

describe('SnapshotAggregateRepository', () => {
  before(helper.clearDb)

  let snapshotRepo
  let eventStore

  before(() => {
    snapshotRepo = new SnapshotAggregateRepository(new ImmutableAggregateRepository(
      DummyModel,
      'user',
      helper.redis
    ))
    eventStore = new EventStore('user', helper.redis, 1)
  })

  describe('getById().until()', () => {
    it('should aggregate only to a given date', () => {
      const d = new Date('2016-01-02T04:04:05+00:00')
      return Promise
        .join(
          eventStore.persist(new ModelEvent('17', 'EventBefore', {}, new Date('2016-01-02T03:04:05+00:00'))),
          eventStore.persist(new ModelEvent('17', 'EventBefore', {}, d)),
          eventStore.persist(new ModelEvent('17', 'EventAfter', {}, new Date('2016-01-02T05:04:05+00:00')))
        )
        .then(() => snapshotRepo.getById('17').until(new Date('2016-01-02T05:00:00+00:00')))
        .then(aggregate => {
          expect(aggregate.meta.version).to.equal(2)
          expect(aggregate.meta.modifiedAt.getTime()).to.equal(d.getTime())
        })
    })
  })
})
