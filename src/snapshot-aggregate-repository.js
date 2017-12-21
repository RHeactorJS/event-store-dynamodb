const {AggregateRepositoryType} = require('./aggregate-repository')
const {AggregateIdType} = require('./types')
const {Date: DateType} = require('tcomb')

class SnapshotAggregateRepository {
  constructor (repo) {
    this.repo = AggregateRepositoryType(repo, ['SnapshotAggregateRepository()', 'repo:AggregateRepository'])
  }

  /**
   * Returns a scope function, which needs to be called with at
   * @param {String} id
   * @return {Function}
   */
  getById (id) {
    AggregateIdType(id)
    return {
      until: until => {
        DateType(until)
        return this.repo.eventStore.fetch(id)
          .filter(event => event.createdAt <= until)
          .reduce((aggregate, event) => this.repo.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      }
    }
  }
}

module.exports = {SnapshotAggregateRepository}
