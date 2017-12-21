/* global jest */

const {DynamoDB} = require('aws-sdk')
const {EventStore} = require('../')
const {AggregateRelation} = require('../')
const {AggregateIndex} = require('../')
const dinossauro = require('dinossauro')
const AWS = require('aws-sdk')
const Promise = require('bluebird')
AWS.config.setPromisesDependency(Promise)

jest.setTimeout(30000)

const up = () => Promise
  .try(dinossauro.up)
  .then(() => {
    const p = {
      endpoint: 'http://localhost:8000',
      region: 'us-west-2',
      accessKeyId: 'foo',
      secretAccessKey: 'bar'
    }
    const d = new DynamoDB(p)
    const eventsTable = `events-${Date.now()}`
    const relationsTable = `relations-${Date.now()}`
    const indexTable = `indexes-${Date.now()}`
    const s = new EventStore('foo', d, eventsTable)
    const r = new AggregateRelation(d, relationsTable)
    const i = new AggregateIndex('foo', d, indexTable)
    return Promise
      .join(
        s.createTable(),
        r.createTable(),
        i.createTable()
      )
      .then(() => [d, eventsTable, relationsTable, indexTable])
  })

const close = dinossauro.down

module.exports = {dynamoDB: up, close}
