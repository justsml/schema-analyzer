import { detectTypes, MetaChecks, typeRankings } from './utils/type-helpers'
const debug = require('debug')
const log = debug('schema-builder:index')

// export { schemaAnalyzer, pivotFieldDataByType, getNumberRangeStats, isValidDate }

function isValidDate (date: string | Date | any): boolean {
  date = date instanceof Date ? date : new Date(date)
  return isNaN(date.getFullYear()) ? false : date
}

const parseDate = (date) => {
  date = isValidDate(date)
  return date && date.toISOString && date.toISOString()
}

export type TypeDescriptorName = 'enum' | 'nullable' | 'unique';
export type TypeNameString = '$ref' |
    'Unknown' |
    'ObjectId' |
    'UUID' |
    'Boolean' |
    'Date' |
    'Timestamp' |
    'Currency' |
    'Float' |
    'Number' |
    'Email' |
    'String' |
    'Array' |
    'Object' |
    'Null'

export interface ISchemaAnalyzerOptions {
    onProgress?: progressCallback | undefined;
    enumMinimumRowCount?: number | undefined;
    enumAbsoluteLimit?: number | undefined;
    enumPercentThreshold?: number | undefined;
    nullableRowsThreshold?: number | undefined;
    uniqueRowsThreshold?: number | undefined;
    strictMatching?: boolean | undefined;
    disableNestedTypes?: boolean | undefined;
    bogusSizeThreshold?: number | undefined,
}

/**
 * Includes the results of main top-level schema.
 */
export type TypeSummary = {
    fields: {
        [x: string]: FieldInfo;
    };
    totalRows: number;
    nestedTypes?: {
        [x: string]: TypeSummary;
    } | undefined;
};
/**
 * Describes one or more potential types discovered for a field. The `types` object will have a `$ref` key if any nested structures were found.
 */
export type FieldInfo = {
    /**
     * - field stats organized by type
     */
    types: {
        [x: TypeNameString]: FieldTypeSummary;
    };
    /**
     * - is the field nullable
     */
    nullable: boolean;
    /**
     * - is the field unique
     */
    unique: boolean;
    /**
     * - enumeration detected, the values are listed on this property.
     */
    enum?: string[] | number[] | undefined;
};
/**
 * Contains stats for a given field's (potential) type.
 *
 * TODO: Add string property for the type name.
 *    We currently uses object key structure: {"String": FieldTypeSummary}
 */
export type FieldTypeSummary = {
    /**
     * - for nested type support.
     */
    typeAlias?: string | undefined;
    /**
     * - extracted field values, placed into an array. This simplifies (at expense of memory) type analysis and summarization when creating the `AggregateSummary`.
     */
    value?: AggregateSummary | undefined;
    /**
     * - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
     */
    length?: AggregateSummary | undefined;
    /**
     * - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
     */
    precision?: AggregateSummary | undefined;
    /**
     * - only applies to Float types. Summary of array of sizes of the value after the decimal.
     */
    scale?: AggregateSummary | undefined;
    /**
     * - if enum rules were triggered will contain the detected unique values.
     */
    enum?: string[] | number[] | undefined;
    /**
     * - number of times the type was matched
     */
    count: number;
    /**
     * - absolute priority of the detected TypeName, defined in the object `typeRankings`
     */
    rank: number;
};
/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
 */
export type InternalFieldTypeData = {
    /**
     * - array of values, pre processing into an AggregateSummary
     */
    value?: any[] | undefined;
    /**
     * - array of string (or decimal) sizes, pre processing into an AggregateSummary
     */
    length?: number[] | undefined;
    /**
     * - only applies to Float types. Array of sizes of the value both before and after the decimal.
     */
    precision?: number[] | undefined;
    /**
     * - only applies to Float types. Array of sizes of the value after the decimal.
     */
    scale?: number[] | undefined;
    /**
     * - number of times the type was matched
     */
    count?: number | undefined;
    /**
     * - absolute priority of the detected TypeName, defined in the object `typeRankings`
     */
    rank?: number | undefined;
};
/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 */
export type AggregateSummary = {
    min: number;
    max: number;
    mean: number;
    p25: number;
    p33: number;
    p50: number;
    p66: number;
    p75: number;
    p99: number;
};
/**
 * This callback is displayed as a global member.
 */
export type progressCallback = (progress: {
    totalRows: number;
    currentRow: number;
}) => any;


// export function getNumberRangeStats(numbers: number[], useSortedDataForPercentiles?: boolean): AggregateSummary;
// export function isValidDate(date: any): any;
/**
 * Returns a fieldName keyed-object with type detection summary data.
 *
 * ### Example `fieldSummary`:
 * ```
 * {
 *  "id": {
 *    "UUID": {
 *      "rank": 2,
 *      "count": 25
 *    },
 *    "Number": {
 *      "rank": 8,
 *      "count": 1,
 *      "value": {
 *        "min": 9999999,
 *        "mean": 9999999,
 *        "max": 9999999,
 *        "p25": 9999999,
 *        "p33": 9999999,
 *        "p50": 9999999,
 *        "p66": 9999999,
 *        "p75": 9999999,
 *        "p99": 9999999
 *      }
 *    }
 *  }
 * }
 * ```
 */
function schemaAnalyzer (
  schemaName: string, 
  input: Array<Object>, 
  options: ISchemaAnalyzerOptions | undefined = {
    onProgress: ({ totalRows, currentRow }) => {},
    strictMatching: true,
    disableNestedTypes: false,
    enumMinimumRowCount: 100,
    enumAbsoluteLimit: 10,
    enumPercentThreshold: 0.01,
    nullableRowsThreshold: 0.02,
    uniqueRowsThreshold: 1.0,
    bogusSizeThreshold: 0.1
  }
) {
  if (!Array.isArray(input) || typeof input !== 'object') throw Error('Input Data must be an Array of Objects')
  if (typeof input[0] !== 'object') throw Error('Input Data must be an Array of Objects')
  if (input.length < 5) throw Error('Analysis requires at least 5 records. (Use 200+ for great results.)')
  const {
    onProgress = ({ totalRows, currentRow }) => {},
    strictMatching = true,
    disableNestedTypes = false,
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = options
  const isEnumEnabled = input.length >= enumMinimumRowCount
  const nestedData = {}

  log('Starting')
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then(async (schema) => {
      log('Built summary from Field Type data.')
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
          const typesInfo = schema.fields[fieldName]
          /* //* @type {FieldInfo} */
          fieldInfo[fieldName] = {
            ...typesInfo
          }
          fieldInfo[fieldName] = MetaChecks.TYPE_ENUM.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { enumAbsoluteLimit, enumPercentThreshold })
          fieldInfo[fieldName] = MetaChecks.TYPE_NULLABLE.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { nullableRowsThreshold })
          fieldInfo[fieldName] = MetaChecks.TYPE_UNIQUE.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { uniqueRowsThreshold })
          // typesInfo.$ref
          const isIdentity = (typesInfo.Number || typesInfo.UUID) && fieldInfo[fieldName].unique && /id$/i.test(fieldName)
          if (isIdentity) {
            fieldInfo[fieldName].identity = true
          }

          if (schema.uniques && schema.uniques[fieldName]) {
            fieldInfo[fieldName].uniqueCount = schema.uniques[fieldName].length
          }
          return fieldInfo
        }, {})

      return {
        fields,
        totalRows: schema.totalRows,
        nestedTypes: disableNestedTypes ? undefined : await nestedschemaAnalyzer(nestedData)
      }
    })

  function nestedschemaAnalyzer (nestedData) {
    return Object.entries(nestedData)
      .reduce(async (nestedTypeSummaries, [fullTypeName, data]) => {
        const nameParts = fullTypeName.split('.')
        // @ts-ignore
        const nameSuffix = nameParts[nameParts.length - 1]
        nestedTypeSummaries[fullTypeName] = await schemaAnalyzer(nameSuffix, data, options)
        return nestedTypeSummaries
      }, {})
  }

  /**
     * @param {object[]} docs
     * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     */
  function pivotRowsGroupedByType (docs) {
    const detectedSchema = { uniques: isEnumEnabled ? {} : null, fieldsData: {}, totalRows: null }
    log(`  About to examine every row & cell. Found ${docs.length} records...`)
    const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema)
    log('  Extracted data points from Field Type analysis')
    return pivotedSchema
  }

  /**
     * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     * @param {{ [x: string]: any; }} row
     * @param {number} index
     * @param {any[]} array
     */
    function evaluateSchemaLevel (schema, row, index, array) { // eslint-disable-line
    schema.totalRows = schema.totalRows || array.length
    const fieldNames = Object.keys(row)
    log(`Processing Row # ${index + 1}/${schema.totalRows}...`)
    fieldNames.forEach((fieldName, index, array) => {
      if (index === 0) log(`Found ${array.length} Column(s)!`)
      const value = row[fieldName]
      const typeFingerprint = getFieldMetadata({ value, strictMatching })
      const typeNames = Object.keys(typeFingerprint)
      const isPossibleEnumType = typeNames.includes('Number') || typeNames.includes('String')

      if (!disableNestedTypes) {
        // TODO: Review hackey pattern here (buffers too much, better association of custom types, see `$ref`)
        // Steps: 1. Check if Array of Objects, 2. Add to local `nestedData` to hold data for post-processing.
        if (Array.isArray(value) && value.length >= 1 && typeof value[0] === 'object') {
          nestedData[`${schemaName}.${fieldName}`] = nestedData[`${schemaName}.${fieldName}`] || []
          nestedData[`${schemaName}.${fieldName}`].push(...value)
          typeFingerprint.$ref = `${schemaName}.${fieldName}`
        }
      }

      if (isEnumEnabled && isPossibleEnumType) {
        schema.uniques[fieldName] = schema.uniques[fieldName] || []
        if (!schema.uniques[fieldName].includes(value)) schema.uniques[fieldName].push(row[fieldName])
        // } else {
        //   schema.uniques[fieldName] = null
      }
      schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || []
      schema.fieldsData[fieldName].push(typeFingerprint)
    })
    onProgress({ totalRows: schema.totalRows, currentRow: index + 1 })
    return schema
  }
}

/**
 * Returns a fieldName keyed-object with type detection summary data.
 *
 * ### Example `fieldSummary`:
 * ```
 * {
 *  "id": {
 *    "UUID": {
 *      "rank": 2,
 *      "count": 25
 *    },
 *    "Number": {
 *      "rank": 8,
 *      "count": 1,
 *      "value": {
 *        "min": 9999999,
 *        "mean": 9999999,
 *        "max": 9999999,
 *        "p25": 9999999,
 *        "p33": 9999999,
 *        "p50": 9999999,
 *        "p66": 9999999,
 *        "p75": 9999999,
 *        "p99": 9999999
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * @param {{ fieldsData: Object.<string, InternalFieldTypeData[]>, uniques: Object.<string, any[]>, totalRows: number}} schema
 * @returns {{
 *  fields: Object.<string, Object.<string, FieldTypeSummary>>,
 *  uniques: Object.<string, any[]>,
 *  totalRows: number
 * }}
 */
function condenseFieldData (schema: {
  fieldsData: {
      [x: string]: InternalFieldTypeData[];
  };
  uniques: {
      [x: string]: any[];
  };
  totalRows: number;
}): {
  fields: {
      [x: string]: {
          [x: TypeNameString]: FieldTypeSummary;
      };
  };
  uniques: {
      [x: string]: any[];
  };
  totalRows: number;
} {
  const { fieldsData } = schema
  const fieldNames = Object.keys(fieldsData)

  /** @type {Object.<string, Object.<string, FieldTypeSummary>>} */
  const fieldSummary = {}
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`)
  fieldNames
    .forEach((fieldName) => {
      /** @type {Object.<string, InternalFieldTypeData>} */
      const pivotedData = pivotFieldDataByType(fieldsData[fieldName])
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData)
      if (pivotedData.$ref && pivotedData.$ref.count > 1) {
        // Prevent overriding the $ref type label
        // 1. Find the first $ref
        const refType = fieldsData[fieldName].find(typeRefs => typeRefs.$ref)
        fieldSummary[fieldName].$ref.typeAlias = refType.$ref
      }

      // console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName])
    })
  log('Post-condenseFieldSizes(fields[fieldName])')
  log('Replaced fieldData with fieldSummary')
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

/* //*
 * @param {Object.<string, { value?, length?, scale?, precision?, invalid? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, InternalFieldTypeData>}
 */
function pivotFieldDataByType (typeSizeData) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  log(`Processing ${typeSizeData.length} type guesses`)
  return typeSizeData.reduce((pivotedData, currentTypeGuesses) => {
    Object.entries(currentTypeGuesses)
      .map(([typeName, { value, length, scale, precision }]) => {
      // console.log(typeName, JSON.stringify({ length, scale, precision }))
        pivotedData[typeName] = pivotedData[typeName] || { typeName, count: 0 }
        // if (!pivotedData[typeName].count) pivotedData[typeName].count = 0
        if (Number.isFinite(length) && !pivotedData[typeName].length) pivotedData[typeName].length = []
        if (Number.isFinite(scale) && !pivotedData[typeName].scale) pivotedData[typeName].scale = []
        if (Number.isFinite(precision) && !pivotedData[typeName].precision) pivotedData[typeName].precision = []
        if (Number.isFinite(value) && !pivotedData[typeName].value) pivotedData[typeName].value = []

        pivotedData[typeName].count++
        // if (invalid != null) pivotedData[typeName].invalid++
        if (length) pivotedData[typeName].length.push(length)
        if (scale) pivotedData[typeName].scale.push(scale)
        if (precision) pivotedData[typeName].precision.push(precision)
        if (value) pivotedData[typeName].value.push(value)
        // pivotedData[typeName].rank = typeRankings[typeName]
        return pivotedData[typeName]
      })
    return pivotedData
  }, {})
  /*
  > Example of sumCounts at this point
  {
    Float: { count: 4, scale: [ 5, 5, 5, 5 ], precision: [ 2, 2, 2, 2 ] },
    String: { count: 3, length: [ 2, 3, 6 ] },
    Number: { count: 1, length: [ 6 ] }
  }
*/
}

/**
 * Internal function which analyzes and summarizes each columns data by type. Sort of a histogram of significant points.
 * @private
 * @param {Object.<string, InternalFieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
 * @returns {Object.<string, FieldTypeSummary>} - The final output, with histograms of significant points
 */
function condenseFieldSizes (pivotedDataByType) {
  /** @type {Object.<string, FieldTypeSummary>} */
  const aggregateSummary = {}
  log('Starting condenseFieldSizes()')
  Object.keys(pivotedDataByType)
    .map((typeName) => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName] || -42,
        count: pivotedDataByType[typeName].count
      }
      if (typeName === '$ref') {
        // console.log('pivotedDataByType.$ref', JSON.stringify(pivotedDataByType.$ref, null, 2));
        aggregateSummary[typeName].typeAlias = pivotedDataByType.$ref
      } else {
        if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value)
        if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length, true)
        if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale, true)
        if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision, true)
      }

      // if (pivotedDataByType[typeName].invalid) { aggregateSummary[typeName].invalid = pivotedDataByType[typeName].invalid }

      if (['Timestamp', 'Date'].indexOf(typeName) > -1) {
        aggregateSummary[typeName].value = formatRangeStats(aggregateSummary[typeName].value, parseDate)
      }
    })
  log('Done condenseFieldSizes()...')
  return aggregateSummary
}

function getFieldMetadata ({
  value,
  strictMatching
}) {
  // Get initial pass at the data with the TYPE_* `.check()` methods.
  const typeGuesses = detectTypes(value, strictMatching)

  // Assign initial metadata for each matched type below
  return typeGuesses.reduce((analysis, typeGuess, rank) => {
    let length
    let precision
    let scale

    analysis[typeGuess] = { rank: rank + 1 }

    if (typeGuess === 'Array') {
      length = value.length
      analysis[typeGuess] = { ...analysis[typeGuess], length }
    }
    if (typeGuess === 'Float') {
      value = parseFloat(value)
      analysis[typeGuess] = { ...analysis[typeGuess], value }
      const significandAndMantissa = String(value).split('.')
      if (significandAndMantissa.length === 2) {
        precision = significandAndMantissa.join('').length // total # of numeric positions before & after decimal
        scale = significandAndMantissa[1].length
        analysis[typeGuess] = { ...analysis[typeGuess], precision, scale }
      }
    }
    if (typeGuess === 'Number') {
      value = Number(value)
      analysis[typeGuess] = { ...analysis[typeGuess], value }
    }
    if (typeGuess === 'Date' || typeGuess === 'Timestamp') {
      const checkedDate = isValidDate(value)
      if (checkedDate) {
        analysis[typeGuess] = { ...analysis[typeGuess], value: checkedDate.getTime() }
      // } else {
      //   analysis[typeGuess] = { ...analysis[typeGuess], invalid: true, value: value }
      }
    }
    if (typeGuess === 'String' || typeGuess === 'Email') {
      length = String(value).length
      analysis[typeGuess] = { ...analysis[typeGuess], length }
    }
    return analysis
  }, {})
}

/**
 * Accepts an array of numbers and returns summary data about
 *  the range & spread of points in the set.
 *
 * @param {number[]} numbers - sequence of unsorted data points
 * @returns {AggregateSummary}
 */
function getNumberRangeStats (numbers: number[], useSortedDataForPercentiles = false) {
  if (!numbers || numbers.length < 1) return undefined
  const sortedNumbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1)
  const sum = numbers.reduce((a, b) => a + b, 0)
  if (useSortedDataForPercentiles) numbers = sortedNumbers
  return {
    // size: numbers.length,
    min: sortedNumbers[0],
    mean: sum / numbers.length,
    max: sortedNumbers[numbers.length - 1],
    p25: numbers[parseInt(String(numbers.length * 0.25), 10)],
    p33: numbers[parseInt(String(numbers.length * 0.33), 10)],
    p50: numbers[parseInt(String(numbers.length * 0.50), 10)],
    p66: numbers[parseInt(String(numbers.length * 0.66), 10)],
    p75: numbers[parseInt(String(numbers.length * 0.75), 10)],
    p99: numbers[parseInt(String(numbers.length * 0.99), 10)]
  }
}

/**
 *
 */
function formatRangeStats (stats, formatter) {
  // if (!stats || !formatter) return undefined
  return {
    // size: stats.size,
    min: formatter(stats.min),
    mean: formatter(stats.mean),
    max: formatter(stats.max),
    p25: formatter(stats.p25),
    p33: formatter(stats.p33),
    p50: formatter(stats.p50),
    p66: formatter(stats.p66),
    p75: formatter(stats.p75),
    p99: formatter(stats.p99)
  }
}

export {
  // pivotRowsGroupedByType as _pivotRowsGroupedByType,
  // evaluateSchemaLevel as _evaluateSchemaLevel,
  condenseFieldData as _condenseFieldData,
  pivotFieldDataByType as _pivotFieldDataByType,
  getNumberRangeStats as _getNumberRangeStats,
  formatRangeStats as _formatRangeStats,
  schemaAnalyzer,
  isValidDate as _isValidDate
}
