const {AggregateRepositoryType} = require('./aggregate-repository')
const t = require('tcomb')

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
    t.String(id)
    return {
      until: until => {
        t.Date(until)
        return this.repo.eventStore.fetch(id)
          .filter(event => event.createdAt <= until)
          .reduce((aggregate, event) => this.repo.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      }
    }
  }
}

module.exports = {SnapshotAggregateRepository}
