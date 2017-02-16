import {union, Integer as IntegerType, String as StringType, maybe, refinement} from 'tcomb'

export const PositiveIntegerType = refinement(IntegerType, n => n > 0, 'PositiveIntegerType')
export const MaybeStringType = maybe(StringType)
export const AggregateIdType = union([StringType, PositiveIntegerType])
export const AggregateVersionType = refinement(IntegerType, n => n > 0, 'AggregateVersionType')
