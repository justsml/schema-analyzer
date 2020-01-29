import debug from 'debug'
// import FP from 'functional-promises';
// import { detectTypes } from './type-helpers.js'
// import StatsMap from 'stats-map';
// import mem from 'mem';
import { detectTypes, prioritizedTypes, typeRankings } from './type-helpers.js'
const log = debug('schema-builder:index')
// const cache = new StatsMap();
// const detectTypesCached = mem(_detectTypes, { cache, maxAge: 1000 * 600 }) // keep cache up to 10 minutes

export { schemaBuilder, condenseFieldData, condenseFieldSizes, getNumberRangeStats }


function schemaBuilder (name, data, onProgress = ({totalRows, currentRow, columns}) => {}) {
  // const { promise, resolve, reject } = FP.unpack()
  if (typeof name !== 'string') throw Error('Argument `name` must be a String')
  if (!Array.isArray(data)) throw Error('Input Data must be an Array of Objects')
  log('Starting')
  const detectedSchema = { uniques: {}, fieldsData: {}, totalRecords: null }
  return Promise.resolve(data)
    .then(docs => {
      log(`  About to examine every row & cell. Found ${docs.length} records...`)
      const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema)
      log('  Extracted data points from Field Type analysis')
      return pivotedSchema
    })
    .then(schema => condenseFieldData(schema))
    .then(genSchema => {
      log('Built summary from Field Type data.')
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const uniques = Object.keys(genSchema.fieldsData)
      .reduce((uniques, fieldName) => {
        if (genSchema.uniques[fieldName]) {
          uniques[fieldName] = genSchema.uniques[fieldName].length
        }
        return uniques
      }, {})

      return {
        totalRows: genSchema.totalRecords,
        uniques: uniques,
        fields: genSchema.fieldsData
      }
    })

    function evaluateSchemaLevel (schema, row, index, array) { // eslint-disable-line
      schema = schema
      schema.totalRecords = schema.totalRecords || array.length
      const fieldNames = Object.keys(row)
      log(`Processing Row # ${index + 1}/${schema.totalRecords}...`)
      onProgress({ totalRows: schema.totalRecords, currentRow: index + 1, columns: fieldNames })
      fieldNames.forEach((fieldName, index, array) => {
        if (index === 0) log(`Found ${array.length} Column(s)!`)
        const typeFingerprint = getFieldMetadata({
          schema,
          fieldName,
          value: row[fieldName]
        })
        const typeNames = Object.keys(typeFingerprint)
        schema.uniques[fieldName] = schema.uniques[fieldName] || []
        if (!schema.uniques[fieldName].includes(row[fieldName])) schema.uniques[fieldName].push(row[fieldName])
        schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || []
        schema.fieldsData[fieldName].push(typeFingerprint)
      })
      return schema
    }
}


function condenseFieldData (schema) {
  const fieldsData = schema.fieldsData
  const fieldNames = Object.keys(fieldsData)

  // console.log('condensefieldData', fieldNames)
  const fieldSummary = {}
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`)
  fieldNames
    .forEach((fieldName) => {
      fieldSummary[fieldName] = condenseFieldSizes(fieldsData[fieldName])
    })
  log('Post-condenseFieldSizes(fields[fieldName])')
  schema.fieldsData = fieldSummary
  log('Replaced fieldData with fieldSummary')
  return schema
}
function condenseFieldSizes (typeSizesList) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  const sumCounts = {}
  log(`Processing ${typeSizesList.length} type guesses`)
  typeSizesList.map(currentTypeGuesses => {
    const typeSizes = Object.entries(currentTypeGuesses)
      .map(([typeName, { value, length, scale, precision }]) => {
      // console.log(typeName, JSON.stringify({ length, scale, precision }))
        sumCounts[typeName] = sumCounts[typeName] || { count: 0 }
        if (!sumCounts[typeName].count) sumCounts[typeName].count = 0
        if (Number.isFinite(length) && !sumCounts[typeName].length) sumCounts[typeName].length = []
        if (Number.isFinite(scale) && !sumCounts[typeName].scale) sumCounts[typeName].scale = []
        if (Number.isFinite(precision) && !sumCounts[typeName].precision) sumCounts[typeName].precision = []
        if (Number.isFinite(value) && !sumCounts[typeName].value) sumCounts[typeName].value = []

        sumCounts[typeName].count++
        if (length) sumCounts[typeName].length.push(length)
        if (scale) sumCounts[typeName].scale.push(scale)
        if (precision) sumCounts[typeName].precision.push(precision)
        if (value) sumCounts[typeName].value.push(value)
        sumCounts[typeName].rank = typeRankings[typeName]
        return sumCounts[typeName]
      })
  })
  /*
  > Example of sumCounts at this point
  {
    Float: { count: 4, scale: [ 5, 5, 5, 5 ], precision: [ 2, 2, 2, 2 ] },
    String: { count: 3, length: [ 2, 3, 6 ] },
    Number: { count: 1, length: [ 6 ] }
  }
  */
  log('Condensing data points to stats summaries...')
  Object.keys(sumCounts)
    .map(typeName => {
      // if (!sizeRangeSummary[typeName]) sizeRangeSummary[typeName] = {}
      if (sumCounts[typeName].value) sumCounts[typeName].value = getNumberRangeStats(sumCounts[typeName].value)
      if (sumCounts[typeName].length) sumCounts[typeName].length = getNumberRangeStats(sumCounts[typeName].length)
      if (sumCounts[typeName].scale) sumCounts[typeName].scale = getNumberRangeStats(sumCounts[typeName].scale)
      if (sumCounts[typeName].precision) sumCounts[typeName].precision = getNumberRangeStats(sumCounts[typeName].precision)
      // if (sumCounts[typeName].count) sumCounts[typeName].count = sumCounts[typeName].count

    })
  log('Done condensing data points...')
  /*
  > Example of sizeRangeSummary at this point
  {
    Float: {
      scale: { min: 5, avg: 5, max: 5, pct30: 5, pct60: 5, pct90: 5 },
      precision: { min: 2, avg: 2, max: 2, pct30: 2, pct60: 2, pct90: 2 },
      count: 4
    },
    String: {
      length: { min: 2, avg: 3.6666666666666665, max: 6, pct30: 2, pct60: 3, pct90: 6 },
      count: 3
    },
    Number: {
      length: { min: 6, avg: 6, max: 6, pct30: 6, pct60: 6, pct90: 6 },
      count: 1
    }
  }
  */
  // console.log('typeSizes SUM:', sumCounts)
  // console.log(sizeRangeSummary)
  return sumCounts
}

function getFieldMetadata ({
  value,
  fieldName,
  schema, // eslint-disable-line
  recursive = false
}) {
  const typeGuesses = detectTypes(value)

  const typeAnalysis = typeGuesses.reduce((analysis, typeGuess, rank) => {
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
    if (typeGuess === 'String') {
      length = String(value).length
      analysis[typeGuess] = { ...analysis[typeGuess], length }
    }
    if (typeGuess === 'Array') {
      length = value.length
      analysis[typeGuess] = { ...analysis[typeGuess], length }
    }
    return analysis
  }, {})

  return typeAnalysis
}

function getNumberRangeStats (numbers) {
  if (!numbers || numbers.length < 1) return undefined
  numbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1)
  const sum = numbers.reduce((a, b) => a + b, 0)
  return {
    min: numbers[0],
    avg: sum / numbers.length,
    max: numbers[numbers.length - 1],
    percentiles: [
      numbers[parseInt(String(numbers.length * 0.3), 10)],
      numbers[parseInt(String(numbers.length * 0.6), 10)],
      numbers[parseInt(String(numbers.length * 0.9), 10)]
    ]
  }
}
