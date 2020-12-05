import debug from 'debug'
import { detectTypes, MetaChecks, typeRankings } from './utils/type-helpers.js'
const log = debug('schema-builder:index')
// const cache = new StatsMap();
// const detectTypesCached = mem(_detectTypes, { cache, maxAge: 1000 * 600 }) // keep cache up to 10 minutes

export { schemaBuilder, pivotFieldDataByType, getNumberRangeStats, isValidDate }

/**
 * @param {string | number | Date | undefined | any} date
 * @returns {Date | false}
 */
function isValidDate (date) {
  date = date instanceof Date ? date : new Date(date)
  return isNaN(date.getFullYear()) ? false : date
}

/**
 * @param {string | number | boolean | Date} date
 */
const parseDate = (date) => {
  date = isValidDate(date)
  return date && date.toISOString && date.toISOString()
}

/**
 * Analysis results.
 * @typedef TypeSummary
 * @type {{
 *  fields: TypeAnalysis,
 *  totalRows: number;
 * }}
 */
/**
 * Analysis results.
 * @typedef TypeAnalysis
 * @type {{
 *    Array?: FieldTypeStats,
 *    Boolean?: FieldTypeStats,
 *    Currency?: FieldTypeStats,
 *    Date?: FieldTypeStats,
 *    Email?: FieldTypeStats,
 *    Float?: FieldTypeStats,
 *    Null?: FieldTypeStats,
 *    Number?: FieldTypeStats,
 *    Object?: FieldTypeStats,
 *    ObjectId?: FieldTypeStats,
 *    String?: FieldTypeStats,
 *    Timestamp?: FieldTypeStats,
 *    Unknown?: FieldTypeStats,
 *    UUID?: FieldTypeStats,
 *  }}
*/

/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
 * @private
 * @typedef FieldTypeData
 * @type {Object}
 * @property {number[]} [value] - array of values, pre processing into an AggregateSummary
 * @property {number[]} [length] - array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {number[]} [precision] - only applies to Float types. Array of sizes of the value both before and after the decimal.
 * @property {number[]} [scale] - only applies to Float types. Array of sizes of the value after the decimal.
 * @property {number} [count] - number of times the type was matched
 * @property {number} [rank] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 *
 * @typedef FieldTypeStats
 * @type {Object}
 * @property {AggregateSummary} [value] - summary of array of values, pre processing into an AggregateSummary
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} [count=0] - number of times the type was matched
 * @property {number} [rank=0] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 * @typedef FieldInfo
 * @type {object}
 * @property {Object.<string, FieldTypeStats>} types - field stats organized by type
 * @property {boolean} nullable - is the field nullable
 * @property {boolean} unique - is the field unique
 * @property {string[]|number[]} [enum] - enumeration detected, the values are listed on this property.
 */

/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 * @typedef AggregateSummary
 * @type {{min: number, max: number, mean: number, p25: number, p33: number, p50: number, p66: number, p75: number, p99: number}}
 */

/**
 * This callback is displayed as a global member.
 * @callback progressCallback
 * @param {{totalRows: number, currentRow: number}} progress - The current progress of processing.
 */

/**
 * schemaBuilder is the main function and where all the analysis & processing happens.
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{ onProgress?: progressCallback, enumMinimumRowCount?: number, enumAbsoluteLimit?: number, enumPercentThreshold?: number, nullableRowsThreshold?: number, uniqueRowsThreshold?: number, strictMatching?: boolean }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
function schemaBuilder (
  input,
  {
    onProgress = ({ totalRows, currentRow }) => {},
    strictMatching = true,
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = {
    onProgress: ({ totalRows, currentRow }) => {},
    strictMatching: true,
    enumMinimumRowCount: 100,
    enumAbsoluteLimit: 10,
    enumPercentThreshold: 0.01,
    nullableRowsThreshold: 0.02,
    uniqueRowsThreshold: 1.0
  }
) {
  if (!Array.isArray(input) || typeof input !== 'object') throw Error('Input Data must be an Array of Objects')
  if (typeof input[0] !== 'object') throw Error('Input Data must be an Array of Objects')
  if (input.length < 5) throw Error('Analysis requires at least 5 records. (Use 200+ for great results.)')
  const isEnumEnabled = input.length >= enumMinimumRowCount

  log('Starting')
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then((schema) => {
      log('Built summary from Field Type data.')
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
          const types = schema.fields[fieldName]
          /** @type {FieldInfo} */
          fieldInfo[fieldName] = {
            types
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

          const isIdentity = (types.Number || types.UUID) && fieldInfo[fieldName].unique && /id$/i.test(fieldName)
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
        totalRows: schema.totalRows
        // uniques: uniques,
        // fields: schema.fields
      }
    })

  /**
   * @param {object[]} docs
   * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData[]; }; }} schema
   */
  function pivotRowsGroupedByType (docs) {
    const detectedSchema = { uniques: isEnumEnabled ? {} : null, fieldsData: {}, totalRows: null }
    log(`  About to examine every row & cell. Found ${docs.length} records...`)
    const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema)
    log('  Extracted data points from Field Type analysis')
    return pivotedSchema
  }

  /**
   * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData[]; }; }} schema
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
      const typeFingerprint = getFieldMetadata({
        value: row[fieldName],
        strictMatching
      })
      const typeNames = Object.keys(typeFingerprint)
      const isEnumType = typeNames.includes('Number') || typeNames.includes('String')

      if (isEnumEnabled && isEnumType) {
        schema.uniques[fieldName] = schema.uniques[fieldName] || []
        if (!schema.uniques[fieldName].includes(row[fieldName])) schema.uniques[fieldName].push(row[fieldName])
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
 *
 * @param {{ fieldsData: Object.<string, FieldTypeData[]>, uniques: Object.<string, any[]>, totalRows: number}} schema
 * @returns {{fields: Object.<string, FieldInfo>, uniques: Object.<string, any[]>, totalRows: number}}
 */
function condenseFieldData (schema) {
  const { fieldsData } = schema
  const fieldNames = Object.keys(fieldsData)

  /** @type {Object.<string, FieldInfo>} */
  const fieldSummary = {}
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`)
  fieldNames
    .forEach((fieldName) => {
      /** @type {Object.<string, FieldInfo>} */
      const pivotedData = pivotFieldDataByType(fieldsData[fieldName])
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData)
    })
  log('Post-condenseFieldSizes(fields[fieldName])')
  log('Replaced fieldData with fieldSummary')
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

// /**
//  * @param {Object.<string, { typeName: string, count: number, value?: any[], length?: any[], scale?: any[], precision?: any[], invalid?: any }>[]} typeSizeData - An object containing the
//  * @returns {Object.<string, FieldTypeData>}
//  */
/**
 * @param {any[]} typeSizeData
 */
function pivotFieldDataByType (typeSizeData) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  log(`Processing ${typeSizeData.length} type guesses`)
  /**
   * @param {{ [x: string]: any; }} pivotedData
   * @param {{ [s: string]: any; } | ArrayLike<any>} currentTypeGuesses
   */
  /**
   * @param {{ [x: string]: any; }} pivotedData
   * @param {{ [s: string]: any; } | ArrayLike<any>} currentTypeGuesses
   */
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
 * @param {Object.<string, FieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
 * @returns {Object.<string, FieldTypeStats>} - The final output, with histograms of significant points
 */
function condenseFieldSizes (pivotedDataByType) {
  /** @type {Object.<string, FieldTypeStats>} */
  const aggregateSummary = {}
  log('Starting condenseFieldSizes()')
  Object.keys(pivotedDataByType)
    .map((typeName) => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName],
        count: pivotedDataByType[typeName].count
      }
      if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value)
      if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length, true)
      if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale, true)
      if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision, true)

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
  /**
   * @param {{ [x: string]: any; }} analysis
   * @param {string} typeGuess
   * @param {number} rank
   */
  return typeGuesses.reduce((analysis, typeGuess, rank) => {
    let length
    let precision
    let scale

    analysis[typeGuess] = { rank: rank + 1 }

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
    if (typeGuess === 'Array') {
      length = value.length
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
function getNumberRangeStats (numbers, useSortedDataForPercentiles = false) {
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
 * @param {{ min: any; max: any; mean: any; p25: any; p33: any; p50: any; p66: any; p75: any; p99: any; }} stats
 * @param {{ (date: any): any; (arg0: any): any; }} formatter
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
