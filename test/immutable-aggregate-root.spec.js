/* global describe, it */

import {ImmutableAggregateRoot, AggregateMeta} from '../src'
import {ModelEvent} from '../src/model-event'
import {expect} from 'chai'

describe('ImmutableAggregateRoot', () => {
  describe('.is()', () => {
    it('should return true, if ImmutableAggregateRoot is passed', () => {
      expect(ImmutableAggregateRoot.is(new ImmutableAggregateRoot(new AggregateMeta('17', 1)))).to.equal(true)
    })
    it('should return true, if a similar object is passed', () => {
      const root = {
        constructor: {name: ImmutableAggregateRoot.name},
        meta: () => {},
        applyEvent: () => {}
      }
      expect(ImmutableAggregateRoot.is(root)).to.equal(true)
    })
  })
  describe('.applyEvent()', () => {
    it('should throw an exception if not implemented', () => {
      expect(() => ImmutableAggregateRoot.applyEvent(new ModelEvent('17', 'SomeEvent'))).to.throw(/UnhandledDomainEventError/)
    })
  })
  describe('.meta', () => {
    it('should return the meta object', () => {
      const m = new AggregateMeta('17', 1)
      const r = new ImmutableAggregateRoot(m)
      expect(r.meta).to.equal(m)
    })
  })
})
