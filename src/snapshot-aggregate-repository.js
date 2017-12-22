const {AggregateRepositoryType} = require('./aggregate-repository')
const t = require('tcomb')
const {NonEmptyString} = require('./types')

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
    NonEmptyString(id, ['SnapshotAggregateRepository.getById()', 'id:String'])
    return {
      until: until => {
        t.Date(until, ['SnapshotAggregateRepository.getById().until()', 'until:Date'])
        return this.repo.eventStore.fetch(id)
          .filter(event => event.createdAt <= until)
          .reduce((aggregate, event) => this.repo.applyEvent(event, aggregate === false ? undefined : aggregate), false)
      }
    }
  }
}

module.exports = {SnapshotAggregateRepository}
