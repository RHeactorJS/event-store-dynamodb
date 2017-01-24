import {union, Integer as IntegerType, String as StringType, maybe, refinement} from 'tcomb'

export const MaybeStringType = maybe(StringType)
export const AggregateIdType = union([StringType, refinement(IntegerType, n => n > 0, 'PositiveIntegerType')])
