/* global describe it beforeAll afterAll expect */

const {AggregateRelation} = require('../')
const {EventStore} = require('../')
const {AggregateRepository} = require('../')
const {Promise} = require('bluebird')
const {DummyModel} = require('./dummy-model')
const {dynamoDB, close} = require('./helper')

describe('AggregateRelation', function () {
  let repository, relation

  beforeAll(() => dynamoDB()
    .spread((dynamoDB, eventsTable, relationsTable) => {
      repository = new AggregateRepository(
        DummyModel,
        new EventStore('Dummy', dynamoDB, eventsTable)
      )
      relation = new AggregateRelation('Dummy', dynamoDB, relationsTable)
    }))

  afterAll(close)

  it('should add items', () => Promise
    .join(repository.add({email: 'josh.doe@example.invalid'}), repository.add({email: 'jasper.doe@example.invalid'}))
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
    .join(repository.add({email: 'jill.doe@example.invalid'}), repository.add({email: 'jane.doe@example.invalid'}))
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
})
