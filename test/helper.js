'use strict'

const Promise = require('bluebird')
const redis = require('redis')
Promise.promisifyAll(redis.RedisClient.prototype)
Promise.promisifyAll(redis.Multi.prototype)

const client = redis.createClient()

exports.clearDb = function () {
  return client.flushdb()
}

exports.redis = client
