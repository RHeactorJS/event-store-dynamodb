const {DynamoDB, Credentials} = require('aws-sdk')
// const dinossauro = require('dinossauro')

const up = new Promise(resolve => {
  /*
  dinossauro
    .up()
    .then(() => {
    */
  const p = {
    endpoint: 'http://localhost:8000',
    apiVersion: '2012-08-10',
    region: 'us-east-1',
    accessKeyId: 'foo',
    secretAccessKey: 'bar'
  }
  const d = new DynamoDB(p)
  d.config.credentials = Credentials(p)
  return resolve(d)
    // })
})

const dynamoDB = up

/*
const clearDb = () => up()
  .then(dynamoDB.listTables().promise())
  .then(({TableNames}) => Promise.all(TableNames.map(TableName => dynamoDB.deleteTable({TableName}).promise())))
  */
const clearDb = Promise.resolve

// const close = dinossauro.down
const close = Promise.resolve

module.exports = {dynamoDB, clearDb, close}
