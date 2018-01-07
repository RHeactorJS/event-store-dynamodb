const {ItemListType, ZeroOrPositiveInteger} = require('./types')
const {PaginatedResult} = require('./paginated-result')

const t = require('tcomb')
const maxItemsPerPage = 100

class Pagination {
  /**
   * @param {Number} offset
   * @param {Number} itemsPerPage
   * @constructor
   */
  constructor (offset, itemsPerPage) {
    offset = Math.max(0, ~~offset || 0)
    itemsPerPage = Math.min(Math.max(1, ~~itemsPerPage || 10), maxItemsPerPage)
    Object.defineProperty(this, 'offset', {value: offset, enumerable: true})
    Object.defineProperty(this, 'itemsPerPage', {value: itemsPerPage, enumerable: true})
  }

  /**
   * splice the array based on the given pagination
   * Useful for selecting a page from a full list of ids
   *
   * @param {Array} list
   * @return {Array}
   */
  splice (list) {
    return list.slice(this.offset, this.offset + this.itemsPerPage)
  }

  /**
   * Create a result based on this pagination
   *
   * @param {Array} items
   * @param {Number} total
   * @param {*} query The query used
   * @return PaginatedResult
   */
  result (items, total, query) {
    ItemListType(items)
    ZeroOrPositiveInteger(total)
    let prevOffset
    let nextOffset
    if (this.offset > 0) {
      prevOffset = this.offset - this.itemsPerPage
    }
    if (items.length === this.itemsPerPage && this.offset + this.itemsPerPage < total) {
      nextOffset = this.offset + this.itemsPerPage
    }
    return new PaginatedResult(items, total, this.itemsPerPage, this.offset, query, prevOffset, nextOffset)
  }
}

const PaginationType = t.irreducible('PaginationType', x => x instanceof Pagination)

module.exports = {
  Pagination,
  PaginationType
}
