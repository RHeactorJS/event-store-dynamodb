/* global describe it expect */

const {AggregateRoot, AggregateMeta} = require('../')
const {ModelEvent} = require('../')

const {UnhandledDomainEventError} = require('@rheactorjs/errors')

describe('AggregateRoot', () => {
  describe('.applyEvent()', () => {
    it('should throw an exception if not implemented', () => {
      expect(() => AggregateRoot.applyEvent(new ModelEvent('17', 1, 'SomeEvent'))).toThrow(UnhandledDomainEventError)
    })
  })
  describe('.meta', () => {
    it('should return the meta object', () => {
      const m = new AggregateMeta('17', 1)
      const r = new AggregateRoot(m)
      expect(r.meta).toEqual(m)
    })
  })
})
