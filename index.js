import debug from 'debug'
// import FP from 'functional-promises';
// import { detectTypes } from './type-helpers.js'
// import StatsMap from 'stats-map';
// import mem from 'mem';
import { detectTypes, MetaChecks, typeRankings } from './type-helpers.js'
const log = debug('schema-builder:index')
// const cache = new StatsMap();
// const detectTypesCached = mem(_detectTypes, { cache, maxAge: 1000 * 600 }) // keep cache up to 10 minutes

export { schemaBuilder, pivotFieldDataByType, getNumberRangeStats }

/**
 * Includes the results of input analysis.
 * @typedef TypeSummary
 * @type {{ fields: Object.<string, FieldTypeSummary>; totalRows: number; }}
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
 * @typedef FieldTypeSummary
 * @type {Object}
 * @property {AggregateSummary} [value] - summary of array of values, pre processing into an AggregateSummary
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} count - number of times the type was matched
 * @property {number} rank - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 * @typedef FieldInfo
 * @type {object}
 * @property {Object.<string, FieldTypeSummary>} types - field stats organized by type
 * @property {boolean} nullable - is the field nullable
 * @property {boolean} unique - is the field unique
 * @property {string[]|number[]} [enum] - enumeration detected, the values are listed on this property.
 */

/**
 * Used to represent a number series of any size.
 * Includes the lowest (`min`), highest (`max`), mean/average (`mean`) and measurements at certain `percentiles`.
 * @typedef AggregateSummary
 * @type {{min: number, max: number, mean: number, percentiles: number[]}}
 */

/**
 * This callback is displayed as a global member.
 * @callback progressCallback
 * @param {{totalRows: number, currentRow: number}} progress - The current progress of processing.
 */

 /**
 * schemaBuilder is the main function and where all the analysis & processing happens.
 * @param {String} name - Name of the resource, Table or collection.
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{ onProgress?: progressCallback, enumMinimumRowCount?: number, enumAbsoluteLimit?: number, enumPercentThreshold?: number, nullableRowsThreshold?: number, uniqueRowsThreshold?: number }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
function schemaBuilder (
  name, input,
  {
    onProgress = ({totalRows, currentRow}) => {},
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = {
    onProgress: ({totalRows, currentRow}) => {},
    enumMinimumRowCount: 100, enumAbsoluteLimit: 10, enumPercentThreshold: 0.01,
    nullableRowsThreshold: 0.02,
    uniqueRowsThreshold: 1.0
  }
) {
  if (typeof name !== 'string') throw Error('Argument `name` must be a String')
  if (!Array.isArray(input)) throw Error('Input Data must be an Array of Objects')
  const isEnumEnabled = input.length >= enumMinimumRowCount

  log('Starting')
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then(schema => {
      log('Built summary from Field Type data.')
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
      .reduce((fieldInfo, fieldName) => {
        /** @type {FieldInfo} */
        fieldInfo[fieldName] = {
          // nullable: null,
          // unique: null,
          types: schema.fields[fieldName]
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

        if (schema.uniques && schema.uniques[fieldName]) {
          fieldInfo[fieldName].uniqueCount = schema.uniques[fieldName].length
        }
        return fieldInfo
      }, {})

      return {
        fields,
        totalRows: schema.totalRows,
        // uniques: uniques,
        // fields: schema.fields
      }
    })

    /**
   * @param {object[]} docs
   * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData[]; }; }} schema
   */
    function pivotRowsGroupedByType(docs) {
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
          schema,
          fieldName,
          value: row[fieldName]
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
 * @returns {{fields: Object.<string, FieldTypeSummary>, uniques: Object.<string, any[]>, totalRows: number}}
 */
function condenseFieldData (schema) {
  const {fieldsData} = schema
  const fieldNames = Object.keys(fieldsData)

  // console.log('condensefieldData', fieldNames)
  /** @type {Object.<string, FieldTypeSummary>} */
  const fieldSummary = {}
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`)
  fieldNames
    .forEach((fieldName) => {
      /** @type {Object.<string, FieldTypeData>}*/
      const pivotedData = pivotFieldDataByType(fieldsData[fieldName])
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData)
    })
  log('Post-condenseFieldSizes(fields[fieldName])')
  log('Replaced fieldData with fieldSummary')
  return {fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows}
}

/**
 * TypeName
 * @readonly
 * @enum {string}
 */
const TypeName = {
  'Unknown': 'Unknown',
  'ObjectId': 'ObjectId',
  'UUID': 'UUID',
  'Boolean': 'Boolean',
  'Date': 'Date',
  'Timestamp': 'Timestamp',
  'Currency': 'Currency',
  'Float': 'Float',
  'Number': 'Number',
  'Email': 'Email',
  'String': 'String',
  'Array': 'Array',
  'Object': 'Object',
  'Null': 'Null',
}

/**
 * @param {Object.<string, { value?, length?, scale?, precision? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, FieldTypeData>}
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
 * @returns {Object.<string, FieldTypeSummary>} - The final output, with histograms of significant points
 */
function condenseFieldSizes(pivotedDataByType) {
  /** @type {Object.<string, FieldTypeSummary>} */
  const aggregateSummary = {}
  log('Starting condenseFieldSizes()')
  Object.keys(pivotedDataByType)
    .map(typeName => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName],
        count: pivotedDataByType[typeName].count
      }
      if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value)
      if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length)
      if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale)
      if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision)
    })
  log('Done condenseFieldSizes()...')
  return aggregateSummary
}

function getFieldMetadata ({
  value,
  fieldName,
  schema, // eslint-disable-line
  recursive = false
}) {
  // Get initial pass at the data with the TYPE_* `.check()` methods.
  const typeGuesses = detectTypes(value)

  // Assign initial metadata for each matched type below
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
    if (typeGuess === 'Number' || typeGuess === 'Timestamp') {
      value = Number(value)
      analysis[typeGuess] = { ...analysis[typeGuess], value }
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
function getNumberRangeStats (numbers) {
  if (!numbers || numbers.length < 1) return undefined
  numbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1)
  const sum = numbers.reduce((a, b) => a + b, 0)
  return {
    min: numbers[0],
    mean: sum / numbers.length,
    max: numbers[numbers.length - 1],
    percentiles: [
      numbers[parseInt(String(numbers.length * 0.3), 10)],
      numbers[parseInt(String(numbers.length * 0.6), 10)],
      numbers[parseInt(String(numbers.length * 0.9), 10)]
    ]
  }
}
