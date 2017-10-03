import { Promise } from 'bluebird'
import redis from 'redis'

Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

const clientPromise = () => new Promise(resolve => {
  const client = redis.createClient()
  client.selectAsync(8)
    .then(() => resolve(client))
})

export default {
  clearDb: () => clientPromise().then(client => client.flushdbAsync()),
  redis: clientPromise,
  close: () => clientPromise().then(client => client.quitAsync())
}
