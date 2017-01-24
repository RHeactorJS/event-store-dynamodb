/* global describe, it */

import {ModelEvent} from '../src/model-event'
import {expect} from 'chai'

describe('ModelEvent', () => {
  it('should have default values', () => {
    let e = new ModelEvent('17', 'SomeEvent')
    expect(e.data).to.deep.equal({})
    expect(e.createdAt).to.be.at.most(new Date())
    expect(e.createdBy).to.equal(undefined)
  })
  describe('.is()', () => {
    it('should return true, if AggregateRoot is passed', () => {
      expect(ModelEvent.is(new ModelEvent('17', 'SomeEvent'))).to.equal(true)
    })
    it('should return true, if a similar object is passed', () => {
      const root = {
        constructor: {name: ModelEvent.name},
        aggregateId: null,
        name: null,
        data: null,
        createdAt: null,
        createdBy: null
      }
      expect(ModelEvent.is(root)).to.equal(true)
    })
  })
})
