/* global describe, it */

import {ImmutableAggregateRoot, AggregateMeta} from '../src'
import {ModelEvent} from '../src/model-event'
import {expect} from 'chai'
import {UnhandledDomainEventError} from '@rheactorjs/errors'

describe('ImmutableAggregateRoot', () => {
  describe('.applyEvent()', () => {
    it('should throw an exception if not implemented', () => {
      expect(() => ImmutableAggregateRoot.applyEvent(new ModelEvent('17', 'SomeEvent'))).to.throw(UnhandledDomainEventError)
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
