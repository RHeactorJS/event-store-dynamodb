/* global describe it expect */

const {ModelEvent} = require('../src/model-event')

describe('ModelEvent', () => {
  it('should have default values', () => {
    let e = new ModelEvent('17', 'SomeEvent')
    expect(e.data).toEqual({})
    expect(e.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
    expect(e.createdBy).toEqual(undefined)
  })
})
