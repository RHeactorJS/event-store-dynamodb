const {union, Integer: IntegerType, String: StringType, maybe, refinement} = require('tcomb')

const PositiveIntegerType = refinement(IntegerType, n => n > 0, 'PositiveIntegerType')
const MaybeStringType = maybe(StringType)
const AggregateIdType = union([StringType, PositiveIntegerType])
const MaybeAggregateIdType = maybe(AggregateIdType)
const AggregateVersionType = refinement(IntegerType, n => n > 0, 'AggregateVersionType')

module.exports = {PositiveIntegerType, MaybeStringType, AggregateIdType, MaybeAggregateIdType, AggregateVersionType}
