import {ImmutableAggregateRepositoryType} from './immutable-aggregate-repository'
import {AggregateIdType} from './types'
import {Date as DateType} from 'tcomb'

export class SnapshotAggregateRepository {
  constructor (repo) {
    this.repo = ImmutableAggregateRepositoryType(repo, ['SnapshotAggregateRepository()', 'repo:ImmutableAggregateRepository'])
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
