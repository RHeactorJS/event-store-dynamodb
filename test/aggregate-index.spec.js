/* global describe it beforeAll afterAll expect */

const {AggregateIndex} = require('../src/aggregate-index')
const {Promise} = require('bluebird')
const {clearDb, close, dynamoDB} = require('./helper')

const {EntryAlreadyExistsError} = require('@rheactorjs/errors')

describe('AggregateIndex', () => {
  beforeAll(clearDb)
  afterAll(close)

  let aggregateIndex

  beforeAll(() => dynamoDB().then(dynamoDB => {
    aggregateIndex = new AggregateIndex('user', dynamoDB)
  }))

  describe('.add()', () => {
    it(
      'should add and overwrite indices for the same value',
      () => Promise
        .join(
          aggregateIndex.add('email', 'john.doe@example.invalid', '17'),
          aggregateIndex.add('email', 'jane.doe@example.invalid', '18')
        )
        .then(() => aggregateIndex.find('email', 'jane.doe@example.invalid'))
        .then(res => {
          expect(res).toEqual('18')
        })
    )
  })

  describe('.getAll()', () => {
    it(
      'should return all entries',
      () => aggregateIndex
        .getAll('email')
        .then(res => {
          expect(res).toEqual(['17', '18'])
        })
    )
  })

  describe('.remove()', () => {
    it(
      'should remove a value from an index',
      () => aggregateIndex.add('some-type', 'some-value', 'some-aggregateId')
        .then(() => aggregateIndex.remove('some-type', 'some-value', 'some-aggregateId'))
        .then(() => aggregateIndex.find('some-type', 'some-value'))
        .then(res => {
          expect(res).toEqual(null)
        })
    )
  })

  describe('.addIfNotPresent()', () => {
    it(
      'should only add and index for a value if it is not present',
      () => Promise
        .join(
          aggregateIndex.addIfNotPresent('email', 'jill.doe@example.invalid', '17'),
          aggregateIndex.addIfNotPresent('email', 'jill.doe@example.invalid', '18')
        )
        .catch(EntryAlreadyExistsError, err => {
          expect(err.message).toContain('jill.doe@example.invalid')
        })
    )
  })

  describe('.addToListIfNotPresent()', () => {
    it(
      'should add a value to the list if it is not present',
      () => aggregateIndex.addToListIfNotPresent('meeting-users:42', '17')
    )
    it(
      'should not add the value to the list if it is present',
      () => aggregateIndex.addToListIfNotPresent('meeting-users:42', '17')
        .catch(EntryAlreadyExistsError, err => {
          expect(err.message).toEqual('Aggregate "17" already member of "user.meeting-users:42.list".')
        })
    )
  })

  describe('.getList()', () => {
    it(
      'should add a value to the list if it is not present',
      () => Promise
        .join(
          aggregateIndex.addToListIfNotPresent('meeting-users:256', '19'),
          aggregateIndex.addToListIfNotPresent('meeting-users:256', '20')
        )
        .then(() => aggregateIndex.getList('meeting-users:256'))
        .spread((id1, id2) => {
          expect(id1).toEqual('19')
          expect(id2).toEqual('20')
        })
    )
  })

  describe('.removeFromList()', () => {
    it(
      'should add a value to the list if it is not present',
      () => aggregateIndex.addToListIfNotPresent('meeting-users:127', '18')
        .then(() => aggregateIndex.getList('meeting-users:127'))
        .spread((id) => expect(id).toEqual('18'))
        .then(() => aggregateIndex.removeFromList('meeting-users:127', '18'))
        .then(() => aggregateIndex.getList('meeting-users:127'))
        .then(members => {
          expect(members).toEqual([])
        })
    )
  })
})
