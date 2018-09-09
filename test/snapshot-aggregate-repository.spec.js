/* global describe it beforeAll afterAll expect */

const { EventStore } = require('../')
const { ModelEvent } = require('../')
const { AggregateRepository } = require('../')
const { SnapshotAggregateRepository } = require('../')
const { Promise } = require('bluebird')

const { AggregateRoot } = require('../')
const { AggregateMeta } = require('../')
const { dynamoDB, close } = require('./helper')

class DummyModel extends AggregateRoot {
  /**
   * Applies the event
   *
   * @param {ModelEvent} event
   * @param {DummyModel|undefined} dummy
   * @return {DummyModel}
   */
  static applyEvent (event, dummy) {
    const { createdAt, aggregateId } = event
    if (!dummy) return new DummyModel(new AggregateMeta(aggregateId, 1, createdAt))
    return new DummyModel(dummy.meta.updated(createdAt))
  }
}

describe('SnapshotAggregateRepository', () => {
  let snapshotRepo
  let eventStore

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable) => {
      eventStore = new EventStore('user', dynamoDB, eventsTable)
      snapshotRepo = new SnapshotAggregateRepository(new AggregateRepository(
        DummyModel,
        eventStore
      ))
    }))

  afterAll(close)

  describe('getById().until()', () => {
    it('should aggregateName only to a given date', () => {
      const d = new Date('2016-01-02T04:04:05+00:00')
      return Promise
        .join(
          eventStore.persist(new ModelEvent('17', 1, 'EventBefore', {}, new Date('2016-01-02T03:04:05+00:00'))),
          eventStore.persist(new ModelEvent('17', 2, 'EventBefore', {}, d)),
          eventStore.persist(new ModelEvent('17', 3, 'EventAfter', {}, new Date('2016-01-02T05:04:05+00:00')))
        )
        .then(() => snapshotRepo.getById('17').until(new Date('2016-01-02T05:00:00+00:00')))
        .then(aggregate => {
          expect(aggregate.meta.version).toEqual(2)
          expect(aggregate.meta.modifiedAt.getTime()).toEqual(d.getTime())
        })
    })
  })
})
