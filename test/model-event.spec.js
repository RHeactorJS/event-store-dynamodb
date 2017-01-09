/* global describe, it */

import {ModelEvent} from '../src/model-event'
import {expect} from 'chai'

describe('ModelEvent', () => {
  it('should have default values', (done) => {
    let e = new ModelEvent()
    expect(e.data).to.deep.equal({})
    expect(e.createdAt).to.be.at.most(Date.now())
    expect(e.createdBy).to.equal(undefined)
    done()
  })
})
