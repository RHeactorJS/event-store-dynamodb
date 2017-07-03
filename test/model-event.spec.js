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
})
