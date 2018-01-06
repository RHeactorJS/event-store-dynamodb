const t = require('tcomb')

const PositiveInteger = t.refinement(t.Integer, n => n > 0, 'PositiveInteger')
const NonEmptyString = t.refinement(t.String, s => s.length > 0, 'NonEmptyString')

const ItemListType = t.list(t.Object)
const MaybeObject = t.maybe(t.Object)

const ZeroOrPositiveInteger = t.refinement(t.Integer, n => n >= 0, 'ZeroOrPositiveInteger')
const MaybeZeroOrPositiveInteger = t.maybe(ZeroOrPositiveInteger)

module.exports = {
  PositiveInteger,
  NonEmptyString,
  ItemListType,
  MaybeObject,
  MaybeZeroOrPositiveInteger,
  ZeroOrPositiveInteger
}
