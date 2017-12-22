const t = require('tcomb')

const PositiveInteger = t.refinement(t.Integer, n => n > 0, 'PositiveInteger')
const NonEmptyString = t.refinement(t.String, s => s.length > 0, 'NonEmptyString')

module.exports = {PositiveInteger, NonEmptyString}
