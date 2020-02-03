import {
  isBoolish,
  isCurrency,
  isDateString,
  isEmailShaped,
  isFloatish,
  isNullish,
  isNumeric,
  isObjectId,
  isTimestamp,
  isUuid
} from './utils/type-detectors.js'

const hasLeadingZero = /^0+/

/**
 * Returns an array of TypeName.
 * @param {any} value - input data
 * @returns {string[]}
 */
function detectTypes (value, strictMatching = true) {
  const excludedTypes = []
  const matchedTypes = prioritizedTypes.reduce((types, typeHelper) => {
    if (typeHelper.check(value)) {
      if (typeHelper.supercedes) excludedTypes.push(...typeHelper.supercedes)
      types.push(typeHelper.type)
    }
    return types
  }, [])
  return !strictMatching ? matchedTypes : matchedTypes.filter(type => excludedTypes.indexOf(type) === -1)
}

/**
 * MetaChecks are used to analyze the intermediate results, after the Basic (discreet) type checks are complete.
 * They have access to all the data points before it is finally processed.
 */
const MetaChecks = {
  TYPE_ENUM: {
    type: 'enum',
    matchBasicTypes: ['String', 'Number'],
    check: (typeInfo, { rowCount, uniques }, { enumAbsoluteLimit, enumPercentThreshold }) => {
      if (!uniques || uniques.length === 0) return typeInfo
      // TODO: calculate uniqueness using ALL uniques combined from ALL types, this only sees consistently typed data
      // const uniqueness = rowCount / uniques.length
      const relativeEnumLimit = Math.min(parseInt(String(rowCount * enumPercentThreshold), 10), enumAbsoluteLimit)
      if (uniques.length > relativeEnumLimit) return typeInfo
      // const enumLimit = uniqueness < enumAbsoluteLimit && relativeEnumLimit < enumAbsoluteLimit
      //   ? enumAbsoluteLimit
      //   : relativeEnumLimit

      return { enum: uniques, ...typeInfo }
      // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    }
  },
  TYPE_NULLABLE: {
    type: 'nullable',
    // matchBasicTypes: ['String', 'Number'],
    check: (typeInfo, { rowCount, uniques }, { nullableRowsThreshold }) => {
      if (!uniques || uniques.length === 0) return typeInfo
      const { types } = typeInfo
      let nullishTypeCount = 0
      if (types.Null) {
        nullishTypeCount += types.Null.count
      }
      // if (types.Unknown) {
      //   nullishTypeCount += types.Unknown.count
      // }
      const nullLimit = rowCount * nullableRowsThreshold
      const isNotNullable = nullishTypeCount <= nullLimit
      // TODO: Look into specifically checking 'Null' or 'Unknown' type stats
      return { nullable: !isNotNullable, ...typeInfo }
      // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    }
  },
  TYPE_UNIQUE: {
    type: 'unique',
    // matchBasicTypes: ['String', 'Number'],
    check: (typeInfo, { rowCount, uniques }, { uniqueRowsThreshold }) => {
      if (!uniques || uniques.length === 0) return typeInfo
      // const uniqueness = rowCount / uniques.length
      const isUnique = uniques.length === (rowCount * uniqueRowsThreshold)
      // TODO: Look into specifically checking 'Null' or 'Unknown' type stats
      return { unique: isUnique, ...typeInfo }
      // return {unique: uniqueness >= uniqueRowsThreshold, ...typeInfo}
      // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    }
  }
}

// Basic Type Filters - rudimentary data sniffing used to tally up "votes" for a given field
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
const TYPE_UNKNOWN = {
  type: 'Unknown',
  check: value => value === undefined || value === 'undefined'
}
const TYPE_OBJECT_ID = {
  type: 'ObjectId',
  supercedes: ['String'],
  check: isObjectId
}
const TYPE_UUID = {
  type: 'UUID',
  supercedes: ['String'],
  check: isUuid
}
const TYPE_BOOLEAN = {
  type: 'Boolean',
  supercedes: ['String'],
  check: isBoolish
}
const TYPE_DATE = {
  type: 'Date',
  supercedes: ['String'],
  check: isDateString
}
const TYPE_TIMESTAMP = {
  type: 'Timestamp',
  supercedes: ['String', 'Number'],
  check: isTimestamp
}
const TYPE_CURRENCY = {
  type: 'Currency',
  supercedes: ['String', 'Number'],
  check: isCurrency
}
const TYPE_FLOAT = {
  type: 'Float',
  supercedes: ['String', 'Number'],
  check: isFloatish
}
const TYPE_NUMBER = {
  type: 'Number',
  check: value => {
    if (hasLeadingZero.test(String(value))) return false
    return !!(value !== null && !Array.isArray(value) && (Number.isInteger(value) || isNumeric(value)))
  }
}
const TYPE_EMAIL = {
  type: 'Email',
  supercedes: ['String'],
  check: isEmailShaped
}
const TYPE_STRING = {
  type: 'String',
  check: value => typeof value === 'string' // && value.length >= 1
}
const TYPE_ARRAY = {
  type: 'Array',
  check: value => {
    return Array.isArray(value)
  }
}
const TYPE_OBJECT = {
  type: 'Object',
  check: value => {
    return !Array.isArray(value) && value != null && typeof value === 'object'
  }
}
const TYPE_NULL = {
  type: 'Null',
  check: isNullish
}

const prioritizedTypes = [
  TYPE_UNKNOWN,
  TYPE_OBJECT_ID,
  TYPE_UUID,
  TYPE_BOOLEAN,
  TYPE_DATE,
  TYPE_TIMESTAMP,
  TYPE_CURRENCY,
  TYPE_FLOAT,
  TYPE_NUMBER,
  TYPE_NULL,
  TYPE_EMAIL,
  TYPE_STRING,
  TYPE_ARRAY,
  TYPE_OBJECT
]

/**
 * Type Rank Map: Use to sort Lowest to Highest
 */
const typeRankings = {
  [TYPE_UNKNOWN.type]: -1,
  [TYPE_OBJECT_ID.type]: 1,
  [TYPE_UUID.type]: 2,
  [TYPE_BOOLEAN.type]: 3,
  [TYPE_DATE.type]: 4,
  [TYPE_TIMESTAMP.type]: 5,
  [TYPE_CURRENCY.type]: 6,
  [TYPE_FLOAT.type]: 7,
  [TYPE_NUMBER.type]: 8,
  [TYPE_NULL.type]: 10,
  [TYPE_EMAIL.type]: 11,
  [TYPE_STRING.type]: 12,
  [TYPE_ARRAY.type]: 13,
  [TYPE_OBJECT.type]: 14
}

export {
  typeRankings,
  prioritizedTypes,
  detectTypes,
  MetaChecks,
  TYPE_UNKNOWN,
  TYPE_OBJECT_ID,
  TYPE_UUID,
  TYPE_BOOLEAN,
  TYPE_DATE,
  TYPE_TIMESTAMP,
  TYPE_CURRENCY,
  TYPE_FLOAT,
  TYPE_NUMBER,
  TYPE_NULL,
  TYPE_EMAIL,
  TYPE_STRING,
  TYPE_ARRAY,
  TYPE_OBJECT
}
// const TYPE_ENUM = {
//   type: "String",
//   check: (value, fieldInfo, schemaInfo) => {
//     // Threshold set to 5% - 5 (or fewer) out of 100 unique strings should enable 'enum' mode
//     if (schemaInfo.inputRowCount < 100) return false; // disabled if set too small
//   }
// };
