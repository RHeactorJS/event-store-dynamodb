/* global describe expect, it */

const { Pagination } = require('../')

describe('Pagination()', function () {
  it('should have default values', (done) => {
    let p = new Pagination()
    expect(p.offset).toEqual(0)
    expect(p.itemsPerPage).toEqual(10)
    done()
  })

  it('should not exceed max items per page', (done) => {
    let p = new Pagination(0, 101)
    expect(p.offset).toEqual(0)
    expect(p.itemsPerPage).toEqual(100)
    done()
  })

  it('should convert invalid values', (done) => {
    let p = new Pagination(-1, 0)
    expect(p.offset).toEqual(0)
    expect(p.itemsPerPage).toEqual(10)
    done()
  })
})
