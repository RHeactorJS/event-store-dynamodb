module.exports = Object.assign(
  {},
  require('./aggregate-index'),
  require('./aggregate-meta'),
  require('./aggregate-relation'),
  require('./snapshot-aggregate-repository'),
  require('./aggregate-root'),
  require('./aggregate-repository'),
  require('./event-store'),
  require('./model-event'),
  require('./types')
)
