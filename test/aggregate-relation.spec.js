/* global describe test it beforeAll afterAll expect */

const { AggregateRelation } = require('../')
const { EventStore } = require('../')
const { Promise } = require('bluebird')
const { dynamoDB, close } = require('./helper')
const { v4 } = require('uuid')
const { ModelEvent } = require('../')

describe('AggregateRelation', function () {
  let relation, es

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable, indexTable) => {
      es = new EventStore('Dummy', dynamoDB, eventsTable)
      relation = new AggregateRelation('Dummy', dynamoDB, indexTable)
    }))

  afterAll(close)

  it('should add items', () => Promise
    .all([
      new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'josh.doe@example.invalid' }),
      new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jasper.doe@example.invalid' })
    ].map(event => es.persist(event)))
    .spread((event1, event2) => {
      return Promise
        .join(
          relation.addRelatedId('meeting', '42', event1.aggregateId),
          relation.addRelatedId('meeting', '42', event2.aggregateId)
        )
        .then(() => {
          return relation.findByRelatedId('meeting', '42')
        })
        .then(ids => {
          expect(ids).toContain(event1.aggregateId)
          expect(ids).toContain(event2.aggregateId)
        })
    })
  )

  it('should remove items', () => Promise
    .all([
      new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jill.doe@example.invalid' }),
      new ModelEvent(v4(), 1, 'DummyCreatedEvent', { email: 'jane.doe@example.invalid' })
    ].map(event => es.persist(event)))
    .spread((event1, event2) => {
      return Promise
        .join(
          relation.addRelatedId('acme', '17', event1.aggregateId),
          relation.addRelatedId('acme', '17', event2.aggregateId)
        )
        .then(() => relation.removeRelatedId('acme', '17', event1.aggregateId))
        .then(() => relation.findByRelatedId('acme', '17'))
        .then((items) => {
          expect(items.length).toEqual(1)
          expect(items[0]).toEqual(event2.aggregateId)
        })
    })
  )

  test('removeRelation() should remove all items', async () => {
    const aggregateId1 = v4()
    const aggregateId2 = v4()
    const user1 = v4()
    const user2 = v4()

    await Promise.all(
      [
        relation.addRelatedId('acme', user1, aggregateId1),
        relation.addRelatedId('acme', user2, aggregateId1),
        relation.addRelatedId('acme', user1, aggregateId2),
        relation.addRelatedId('acme', user2, aggregateId2)
      ]
    )

    expect(await relation.findByRelatedId('acme', user1)).toHaveLength(2)
    expect(await relation.findByRelatedId('acme', user2)).toHaveLength(2)

    await relation.removeRelation('acme', aggregateId1)

    expect(await relation.findByRelatedId('acme', user1)).toEqual([aggregateId2])
    expect(await relation.findByRelatedId('acme', user2)).toEqual([aggregateId2])
  })
})
