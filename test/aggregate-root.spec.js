'use strict'

/* global describe, it, before */

const AggregateRoot = require('../aggregator').AggregateRoot
const expect = require('chai').expect

describe('AggregateRoot', () => {
  describe('.modifiedAt()', () => {
    it('should return the last modified date if it has no creation date (legacy)', (done) => {
      let a = new AggregateRoot()
      a.persisted('42')
      let updatedAt = new Date('2016-01-02T03:04:05+00:00').getTime()
      a.updated(updatedAt)
      expect(a.modifiedAt()).to.equal(updatedAt)
      done()
    })
  })
})
