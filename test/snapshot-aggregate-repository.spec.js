/* global describe it beforeAll expect */

const { EventStore } = require('../src/event-store')
const { ModelEvent } = require('../src/model-event')
const { AggregateRepository } = require('../src/aggregate-repository')
const { SnapshotAggregateRepository } = require('../src/snapshot-aggregate-repository')
const { Promise } = require('bluebird')

const { AggregateRoot } = require('../src/aggregate-root')
const { AggregateMeta } = require('../src/aggregate-meta')
const {clearDb, dynamoDB} = require('./helper')

class DummyModel extends AggregateRoot {
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
  beforeAll(clearDb)

  let snapshotRepo
  let eventStore

  beforeAll(() => dynamoDB()
    .then(dynamoDB => {
      snapshotRepo = new SnapshotAggregateRepository(new AggregateRepository(
        DummyModel,
        'user',
        dynamoDB
      ))
      eventStore = new EventStore('user', dynamoDB, 1)
    }))

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
          expect(aggregate.meta.version).toEqual(2)
          expect(aggregate.meta.modifiedAt.getTime()).toEqual(d.getTime())
        })
    })
  })
})
