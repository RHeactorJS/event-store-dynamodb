const {DynamoDB, Credentials} = require('aws-sdk')
const {EventStore} = require('../src/event-store')
const {AggregateRelation} = require('../src/aggregate-relation')
const {AggregateIndex} = require('../src/aggregate-index')
const dinossauro = require('dinossauro')
const AWS = require('aws-sdk')
const Promise = require('bluebird')
AWS.config.setPromisesDependency(Promise)

let db = false

const up = () => {
  if (!db) {
    db = new Promise(resolve => {
      dinossauro.up()
        .then(() => {
          const p = {
            endpoint: 'http://localhost:8000',
            apiVersion: '2012-08-10',
            region: 'us-east-1'
          }
          const d = new DynamoDB(p)
          const eventsTable = `events-${Date.now()}`
          const relationsTable = `relations-${Date.now()}`
          const indexTable = `indexes-${Date.now()}`
          const s = new EventStore('foo', d, eventsTable)
          const r = new AggregateRelation(d, relationsTable)
          const i = new AggregateIndex('foo', d, indexTable)
          return Promise.join(
            s.createTable(),
            r.createTable(),
            i.createTable()
          ).then(() => resolve([d, eventsTable, relationsTable, indexTable]))
        })
        .catch(err => {
          console.error(err)
        })
    })
  }
  return db
}

const close = dinossauro.down

module.exports = {dynamoDB: up, close}
