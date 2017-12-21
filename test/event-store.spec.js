/* global describe it beforeAll expect */

const {EventStore} = require('../src/event-store')
const {ModelEvent} = require('../src/model-event')
const {Promise} = require('bluebird')
const {clearDb, dynamoDB} = require('./helper')

describe('EventStore', function () {
  beforeAll(clearDb)

  let eventStore

  beforeAll(() => dynamoDB()
    .then(dynamoDB => {
      eventStore = new EventStore('user', dynamoDB, 1)
    }))

  it('should store an event', () => {
    let d1 = new Date('2016-01-02T03:04:05+00:00')
    return Promise
      .join(
        eventStore.persist(new ModelEvent('17', 'SomeEvent', {foo: 'bar'}, d1)),
        eventStore.persist(new ModelEvent('17', 'SomeOtherEvent', {foo: 'baz'}, undefined, 'John Doe'))
      )
      .then(() => eventStore.fetch('17'))
      .then((res) => {
        expect(res.length).toEqual(2)
        expect(res[0]).toBeInstanceOf(ModelEvent)
        expect(res[0].name).toEqual('SomeEvent')
        expect(res[0].data).toEqual({foo: 'bar'})
        expect(res[0].createdAt).toBeInstanceOf(Date)
        expect(res[0].createdAt.getTime()).toBeLessThanOrEqual(d1.getTime())
        expect(res[0].createdBy).toEqual(undefined)
        expect(res[1]).toBeInstanceOf(ModelEvent)
        expect(res[1].name).toEqual('SomeOtherEvent')
        expect(res[1].data).toEqual({foo: 'baz'})
        expect(res[1].createdAt).toBeInstanceOf(Date)
        expect(res[1].createdAt.getTime()).toBeGreaterThan(d1.getTime()) // Use new Date() as default createdAt
        expect(res[1].createdBy).toEqual('John Doe')
      })
  })

  it('should store handle events without a created date', () => {
    let d1 = new Date('1970-01-01T00:00:00+00:00')
    return dynamoDB()
      .then(dynamoDB => Promise.resolve(dynamoDB.rpushAsync('user.events.42', JSON.stringify({eventType: 'SomeEventWithOutCreatedDate'})))
        .then(() => eventStore.fetch('42'))
        .then((res) => {
          expect(res.length).toEqual(1)
          expect(res[0]).toBeInstanceOf(ModelEvent)
          expect(res[0].name).toEqual('SomeEventWithOutCreatedDate')
          expect(res[0].createdAt).toBeInstanceOf(Date)
          expect(res[0].createdAt.getTime()).toBeLessThanOrEqual(d1.getTime())
        }))
  })
})
