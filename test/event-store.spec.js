/* global describe it beforeAll afterAll expect */

const { EventStore } = require('../')
const { ModelEvent } = require('../')
const { Promise } = require('bluebird')
const { dynamoDB, close } = require('./helper')

describe('EventStore', function () {
  let eventStore

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable) => {
      eventStore = new EventStore('user', dynamoDB, eventsTable)
    }))

  afterAll(close)

  describe('persist()', () => {
    it('should store an event', () => {
      let d1 = new Date('2016-01-02T03:04:05+00:00')
      return Promise
        .join(
          eventStore.persist(new ModelEvent('17', 1, 'SomeEvent', { foo: 'bar' }, d1)),
          eventStore.persist(new ModelEvent('17', 2, 'SomeOtherEvent', { foo: 'baz' }, undefined, 'John Doe'))
        )
        .then(() => eventStore.fetch('17'))
        .then((res) => {
          expect(res.length).toEqual(2)
          expect(res[0]).toBeInstanceOf(ModelEvent)
          expect(res[0].aggregateVersion).toEqual(1)
          expect(res[0].name).toEqual('SomeEvent')
          expect(res[0].payload).toEqual({ foo: 'bar' })
          expect(res[0].createdAt).toBeInstanceOf(Date)
          expect(res[0].createdAt.getTime()).toBeLessThanOrEqual(d1.getTime())
          expect(res[1]).toBeInstanceOf(ModelEvent)
          expect(res[1].aggregateVersion).toEqual(2)
          expect(res[1].name).toEqual('SomeOtherEvent')
          expect(res[1].payload).toEqual({ foo: 'baz' })
          expect(res[1].createdAt).toBeInstanceOf(Date)
          expect(res[1].createdAt.getTime()).toBeGreaterThan(d1.getTime()) // Use new Date() as default createdAt
        })
    })
  })

  describe('list()', () => {
    it('should list all aggregates', () => {
      expect.assertions(1)
      return eventStore
        .list()
        .then(aggregates => {
          expect(aggregates).toHaveLength(1)
        })
    })
  })
})
