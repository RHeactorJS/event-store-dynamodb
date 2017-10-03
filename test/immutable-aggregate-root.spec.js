/* global describe it expect */

import {ImmutableAggregateRoot, AggregateMeta} from '../src'
import {ModelEvent} from '../src/model-event'

import {UnhandledDomainEventError} from '@rheactorjs/errors'

describe('ImmutableAggregateRoot', () => {
  describe('.applyEvent()', () => {
    it('should throw an exception if not implemented', () => {
      expect(() => ImmutableAggregateRoot.applyEvent(new ModelEvent('17', 'SomeEvent'))).toThrow(UnhandledDomainEventError)
    })
  })
  describe('.meta', () => {
    it('should return the meta object', () => {
      const m = new AggregateMeta('17', 1)
      const r = new ImmutableAggregateRoot(m)
      expect(r.meta).toEqual(m)
    })
  })
})
