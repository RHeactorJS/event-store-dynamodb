'use strict'

/* global describe, it, before */

const EventStore = require('../event-store')
const Promise = require('bluebird')
const helper = require('./helper')
const expect = require('chai').expect

describe('EventStore', function () {
  before(helper.clearDb)

  let eventStore

  before(function () {
    eventStore = new EventStore.EventStore('user', helper.redis)
  })

  it('should store an event', (done) => {
    let d1 = new Date('2016-01-02T03:04:05+00:00').getTime()
    Promise
      .join(
        eventStore.persist(17, new EventStore.Event('SomeEvent', {foo: 'bar'}, d1)),
        eventStore.persist(17, new EventStore.Event('SomeOtherEvent', {foo: 'baz'}))
      )
      .then(() => {
        return eventStore.fetch(17)
      })
      .then((res) => {
        expect(res.length).to.equal(2)
        expect(res[0]).to.be.instanceof(EventStore.PersistedEvent)
        expect(res[0].eventType).to.equal('SomeEvent')
        expect(res[0].eventPayload).to.deep.equal({foo: 'bar'})
        expect(res[0].eventIndex).to.equal(1)
        expect(res[0].eventCreatedAt).to.be.a('Number')
        expect(res[0].eventCreatedAt).to.equal(d1)
        expect(res[1]).to.be.instanceof(EventStore.PersistedEvent)
        expect(res[1].eventType).to.equal('SomeOtherEvent')
        expect(res[1].eventPayload).to.deep.equal({foo: 'baz'})
        expect(res[1].eventIndex).to.equal(2)
        expect(res[1].eventCreatedAt).to.be.a('Number')
        expect(res[1].eventCreatedAt).to.be.above(d1) // Use Date.now() as default eventCreatedAt
        done()
      })
  })
})
