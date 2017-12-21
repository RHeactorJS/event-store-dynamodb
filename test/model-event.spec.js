/* global describe it expect */

const {ModelEvent} = require('../src/model-event')

describe('ModelEvent', () => {
  it('should have default values', () => {
    let e = new ModelEvent('17', 1, 'SomeEvent')
    expect(e.payload).toEqual({})
    expect(e.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
  })
})
