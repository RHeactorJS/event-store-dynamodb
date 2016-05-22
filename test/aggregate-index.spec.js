'use strict'

/* global describe, it, before */

const AggregateIndex = require('../aggregate-index')
const Promise = require('bluebird')
const helper = require('./helper')
const expect = require('chai').expect

describe('AggregateIndex', function () {
  before(helper.clearDb)

  let aggregateIndex

  before(function () {
    aggregateIndex = new AggregateIndex('user', helper.redis)
  })

  describe('.add()', function () {
    it('should add and overwrite indices for the same value', (done) => {
      Promise
        .join(
          aggregateIndex.add('email', 'john.doe@example.invalid', '17'),
          aggregateIndex.add('email', 'jane.doe@example.invalid', '18')
        )
        .then(() => {
          return aggregateIndex.find('email', 'jane.doe@example.invalid')
        })
        .then((res) => {
          expect(res).to.equal('18')
          done()
        })
    })
  })

  describe('.addIfNotPresent()', function () {
    it('should only add and index for a value if it is not present', (done) => {
      Promise
        .join(
          aggregateIndex.addIfNotPresent('email', 'jill.doe@example.invalid', '17'),
          aggregateIndex.addIfNotPresent('email', 'jill.doe@example.invalid', '18')
        )
        .catch((err) => {
          expect(err.name).to.be.equal('EntryAlreadyExistsError')
          expect(err.message).to.be.contain('jill.doe@example.invalid')
          done()
        })
    })
  })
})
