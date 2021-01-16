(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?f(exports):typeof define==='function'&&define.amd?define(['exports'],f):(g=g||self,f(g.schemaAnalyzer={}));}(this,(function(exports){'use strict';/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();/** Built-in value references. */
var Symbol = root.Symbol;/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    }

    // Legacy `process.binding('util')` for Node.js < 10.
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());/** `Object#toString` result references. */
var dateTag = '[object Date]';

/**
 * The base implementation of `_.isDate` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 */
function baseIsDate(value) {
  return isObjectLike(value) && baseGetTag(value) == dateTag;
}/* Node.js helper references. */
var nodeIsDate = nodeUtil && nodeUtil.isDate;

/**
 * Checks if `value` is classified as a `Date` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 * @example
 *
 * _.isDate(new Date);
 * // => true
 *
 * _.isDate('Mon April 23 2012');
 * // => false
 */
var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;const currencies = [
  '$', '¢', '£', '¤', '¥', '֏', '؋', '߾', '߿', '৲', '৳', '৻',
  '૱', '௹', '฿', '៛', '₠', '₡', '₢', '₣', '₤', '₥', '₦', '₧',
  '₨', '₩', '₪', '₫', '€', '₭', '₮', '₯', '₰', '₱', '₲', '₳',
  '₴', '₵', '₶', '₷', '₸', '₹', '₺', '₻', '₼', '₽', '₾', '₿',
  '꠸', '﷼', '﹩', '＄', '￠', '￡', '￥', '￦',
  '𑿝', '𑿞', '𑿟', '𑿠', '𞋿', '𞲰'
];

const boolishPattern = /^([YN]|(TRUE)|(FALSE))$/i;
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const objectIdPattern = /^[a-f\d]{24}$/i;
const dateStringPattern = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
const timestampPattern = /^[12]\d{12}$/;
// const currencyPatternUS = /^\p{Sc}\s?[\d,.]+$/uig
// const currencyPatternEU = /^[\d,.]+\s?\p{Sc}$/uig
const numberishPattern = /^-?[\d.,]+$/;
const floatPattern = /\d\.\d/;
// const emailPattern = /^[^@]+@[^@]{2,}\.[^@]{2,}[^.]$/
const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const nullishPattern = /null/i;
// const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/igm

function isBoolish (value, fieldName) {
  if (value == null) return false
  value = String(value).trim();
  return value.length <= 6 && boolishPattern.test(String(value))
}

function isUuid (value, fieldName) {
  if (value == null) return false
  value = String(value).trim();
  return value.length < 40 && uuidPattern.test(value)
}
function isObjectId (value, fieldName) {
  if (value == null) return false
  value = String(value).trim();
  return value.length < 40 && objectIdPattern.test(value)
}

function isDateString (value, fieldName) {
  // not bullet-proof, meant to sniff intention in the data
  if (value == null) return false
  if (isDate(value)) return true
  value = String(value).trim();
  return value.length < 30 && dateStringPattern.test(value)
}

function isTimestamp (value) {
  if (value == null) return false
  value = String(value).trim();
  return timestampPattern.test(value)
}

function isCurrency (value) {
  if (value == null) return false
  value = String(value).trim();
  const valueSymbol = currencies.find((curSymbol) => value.indexOf(curSymbol) > -1);
  if (!valueSymbol) return false
  value = value.replace(valueSymbol, '');
  return isNumeric(value)
  // console.log(value, 'currencyPatternUS', currencyPatternUS.test(value), 'currencyPatternEU', currencyPatternEU.test(value));
  // return currencyPatternUS.test(value) || currencyPatternEU.test(value)
}

function isNumeric (value, fieldName) {
  // if (value == null) return false
  value = String(value).trim();
  return value.length < 30 && numberishPattern.test(value)
}

function isFloatish (value) {
  return !!(isNumeric(String(value)) && floatPattern.test(String(value)) && !Number.isInteger(value))
}

function isEmailShaped (value) {
  if (value == null) return false
  value = String(value).trim();
  if (value.includes(' ') || !value.includes('@')) return false
  return value.length >= 5 && value.length < 80 && emailPattern.test(value)
}

function isNullish (value) {
  return value === null || nullishPattern.test(String(value).trim())
}const hasLeadingZero = /^0+/;

/**
 * Returns an array of TypeName.
 * @param {any} value - input data
 * @returns {string[]}
 */
function detectTypes (value, strictMatching = true) {
  const excludedTypes = [];
  const matchedTypes = prioritizedTypes.reduce((types, typeHelper) => {
    if (typeHelper.check(value)) {
      if (typeHelper.supercedes) excludedTypes.push(...typeHelper.supercedes);
      types.push(typeHelper.type);
    }
    return types
  }, []);
  return !strictMatching ? matchedTypes : matchedTypes.filter((type) => excludedTypes.indexOf(type) === -1)
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
      const relativeEnumLimit = Math.min(parseInt(String(rowCount * enumPercentThreshold), 10), enumAbsoluteLimit);
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
      let nullishTypeCount = 0;
      // if (typeInfo && typeInfo.types && typeInfo.types.Null) console.warn('Unexpected type info structure! (.types. key!)');

      if (typeInfo && typeInfo.Null) {
        nullishTypeCount += typeInfo.Null.count;
      }
      // if (types.Unknown) {
      //   nullishTypeCount += types.Unknown.count
      // }
      const nullLimit = rowCount * nullableRowsThreshold;
      const isNotNullable = nullishTypeCount <= nullLimit;
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
      const isUnique = uniques.length === (rowCount * uniqueRowsThreshold);
      // TODO: Look into specifically checking 'Null' or 'Unknown' type stats
      return { unique: isUnique, ...typeInfo }
      // return {unique: uniqueness >= uniqueRowsThreshold, ...typeInfo}
      // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    }
  }
};

// Basic Type Filters - rudimentary data sniffing used to tally up "votes" for a given field
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
const TYPE_UNKNOWN = {
  type: 'Unknown',
  check: (value) => value === undefined || value === 'undefined'
};
const TYPE_OBJECT_ID = {
  type: 'ObjectId',
  supercedes: ['String'],
  check: isObjectId
};
const TYPE_UUID = {
  type: 'UUID',
  supercedes: ['String'],
  check: isUuid
};
const TYPE_BOOLEAN = {
  type: 'Boolean',
  supercedes: ['String'],
  check: isBoolish
};
const TYPE_DATE = {
  type: 'Date',
  supercedes: ['String'],
  check: isDateString
};
const TYPE_TIMESTAMP = {
  type: 'Timestamp',
  supercedes: ['String', 'Number'],
  check: isTimestamp
};
const TYPE_CURRENCY = {
  type: 'Currency',
  supercedes: ['String', 'Number'],
  check: isCurrency
};
const TYPE_FLOAT = {
  type: 'Float',
  supercedes: ['String', 'Number'],
  check: isFloatish
};
const TYPE_NUMBER = {
  type: 'Number',
  check: (value) => {
    if (hasLeadingZero.test(String(value))) return false
    return !!(value !== null && !Array.isArray(value) && (Number.isInteger(value) || isNumeric(value)))
  }
};
const TYPE_EMAIL = {
  type: 'Email',
  supercedes: ['String'],
  check: isEmailShaped
};
const TYPE_STRING = {
  type: 'String',
  check: (value) => typeof value === 'string' // && value.length >= 1
};
const TYPE_ARRAY = {
  type: 'Array',
  check: (value) => {
    return Array.isArray(value)
  }
};
const TYPE_OBJECT = {
  type: 'Object',
  check: (value) => {
    return !Array.isArray(value) && value != null && typeof value === 'object'
  }
};
const TYPE_NULL = {
  type: 'Null',
  check: isNullish
};

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
];

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
};
// const TYPE_ENUM = {
//   type: "String",
//   check: (value, fieldInfo, schemaInfo) => {
//     // Threshold set to 5% - 5 (or fewer) out of 100 unique strings should enable 'enum' mode
//     if (schemaInfo.inputRowCount < 100) return false; // disabled if set too small
//   }
// };
const debug = require('debug');
const log = debug('schema-builder:index');

function isValidDate (date) {
  date = date instanceof Date ? date : new Date(date);
  return isNaN(date.getFullYear()) ? false : date
}

const parseDate = (date) => {
  date = isValidDate(date);
  return date && date.toISOString && date.toISOString()
};

/**
 * Includes the results of main top-level schema.
 * @typedef TypeSummary
 * @type {{
 *  fields: Object.<string, FieldInfo>;
 *  totalRows: number;
 *  nestedTypes?: Object.<string, TypeSummary>;
 * }}
 */

/**
 * Describes one or more potential types discovered for a field. The `types` object will have a `$ref` key if any nested structures were found.
 * @typedef FieldInfo
 * @type {object}
 * @property {Object.<string, string | FieldTypeSummary>} types - field stats organized by type
 * @property {boolean} nullable - is the field nullable
 * @property {boolean} unique - is the field unique
 * @property {string[]|number[]} [enum] - enumeration detected, the values are listed on this property.
 */

/**
 * Contains stats for a given field's (potential) type.
 *
 * TODO: Add string property for the type name.
 *    We currently uses object key structure: {"String": FieldTypeSummary}
 * @typedef FieldTypeSummary
 * @type {Object}
 * @property {string} [typeAlias] - for nested type support.
 * @property {AggregateSummary} [value] - extracted field values, placed into an array. This simplifies (at expense of memory) type analysis and summarization when creating the `AggregateSummary`.
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} count - number of times the type was matched
 * @property {number} rank - absolute priority of the detected TypeName, defined in the object `typeRankings`
 */

/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
 * @private
 * @typedef InternalFieldTypeData
 * @type {Object}
 * @property {any[]} [value] - array of values, pre processing into an AggregateSummary
 * @property {number[]} [length] - array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {number[]} [precision] - only applies to Float types. Array of sizes of the value both before and after the decimal.
 * @property {number[]} [scale] - only applies to Float types. Array of sizes of the value after the decimal.
 * @property {number} [count] - number of times the type was matched
 * @property {number} [rank] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
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
 * schemaBuilder() is the main function and where all the analysis & processing happens.
 * @param {string} schemaName The name, or name prefix to use when assembling results. Helpful with nested types (aka sub-types.)
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{
 *   onProgress?: progressCallback,
 *   enumMinimumRowCount?: number,
 *   enumAbsoluteLimit?: number,
 *   enumPercentThreshold?: number,
 *   nullableRowsThreshold?: number,
 *   uniqueRowsThreshold?: number,
 *   strictMatching?: boolean,
 *   disableNestedTypes?: boolean
 * }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
function schemaBuilder (
  schemaName,
  input,
  options = {
    onProgress: ({ totalRows, currentRow }) => {},
    strictMatching: true,
    disableNestedTypes: false,
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
  const {
    onProgress = ({ totalRows, currentRow }) => {},
    strictMatching = true,
    disableNestedTypes = false,
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = options;
  const isEnumEnabled = input.length >= enumMinimumRowCount;
  const nestedData = {};

  log('Starting');
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then(async (schema) => {
      log('Built summary from Field Type data.');
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
          const typesInfo = schema.fields[fieldName];
          /* //* @type {FieldInfo} */
          fieldInfo[fieldName] = {
            ...typesInfo
          };
          fieldInfo[fieldName] = MetaChecks.TYPE_ENUM.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { enumAbsoluteLimit, enumPercentThreshold });
          fieldInfo[fieldName] = MetaChecks.TYPE_NULLABLE.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { nullableRowsThreshold });
          fieldInfo[fieldName] = MetaChecks.TYPE_UNIQUE.check(fieldInfo[fieldName],
            { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] },
            { uniqueRowsThreshold });
          // typesInfo.$ref
          const isIdentity = (typesInfo.Number || typesInfo.UUID) && fieldInfo[fieldName].unique && /id$/i.test(fieldName);
          if (isIdentity) {
            fieldInfo[fieldName].identity = true;
          }

          if (schema.uniques && schema.uniques[fieldName]) {
            fieldInfo[fieldName].uniqueCount = schema.uniques[fieldName].length;
          }
          return fieldInfo
        }, {});

      return {
        fields,
        totalRows: schema.totalRows,
        nestedTypes: disableNestedTypes ? undefined : await nestedSchemaBuilder(nestedData)
      }
    })

  function nestedSchemaBuilder (nestedData) {
    return Object.entries(nestedData)
      .reduce(async (nestedTypeSummaries, [fullTypeName, data]) => {
        const nameParts = fullTypeName.split('.');
        // @ts-ignore
        const nameSuffix = nameParts[nameParts.length - 1];
        nestedTypeSummaries[fullTypeName] = await schemaBuilder(nameSuffix, data, options);
        return nestedTypeSummaries
      }, {})
  }

  /**
     * @param {object[]} docs
     * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     */
  function pivotRowsGroupedByType (docs) {
    const detectedSchema = { uniques: isEnumEnabled ? {} : null, fieldsData: {}, totalRows: null };
    log(`  About to examine every row & cell. Found ${docs.length} records...`);
    const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
    log('  Extracted data points from Field Type analysis');
    return pivotedSchema
  }

  /**
     * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     * @param {{ [x: string]: any; }} row
     * @param {number} index
     * @param {any[]} array
     */
    function evaluateSchemaLevel (schema, row, index, array) { // eslint-disable-line
    schema.totalRows = schema.totalRows || array.length;
    const fieldNames = Object.keys(row);
    log(`Processing Row # ${index + 1}/${schema.totalRows}...`);
    fieldNames.forEach((fieldName, index, array) => {
      if (index === 0) log(`Found ${array.length} Column(s)!`);
      const value = row[fieldName];
      const typeFingerprint = getFieldMetadata({ value, strictMatching });
      const typeNames = Object.keys(typeFingerprint);
      const isPossibleEnumType = typeNames.includes('Number') || typeNames.includes('String');

      if (!disableNestedTypes) {
        // TODO: Review hackey pattern here (buffers too much, better association of custom types, see `$ref`)
        // Steps: 1. Check if Array of Objects, 2. Add to local `nestedData` to hold data for post-processing.
        if (Array.isArray(value) && value.length >= 1 && typeof value[0] === 'object') {
          nestedData[`${schemaName}.${fieldName}`] = nestedData[`${schemaName}.${fieldName}`] || [];
          nestedData[`${schemaName}.${fieldName}`].push(...value);
          typeFingerprint.$ref = `${schemaName}.${fieldName}`;
        }
      }

      if (isEnumEnabled && isPossibleEnumType) {
        schema.uniques[fieldName] = schema.uniques[fieldName] || [];
        if (!schema.uniques[fieldName].includes(value)) schema.uniques[fieldName].push(row[fieldName]);
        // } else {
        //   schema.uniques[fieldName] = null
      }
      schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || [];
      schema.fieldsData[fieldName].push(typeFingerprint);
    });
    onProgress({ totalRows: schema.totalRows, currentRow: index + 1 });
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
function condenseFieldData (schema) {
  const { fieldsData } = schema;
  const fieldNames = Object.keys(fieldsData);

  /** @type {Object.<string, Object.<string, FieldTypeSummary>>} */
  const fieldSummary = {};
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`);
  fieldNames
    .forEach((fieldName) => {
      /** @type {Object.<string, InternalFieldTypeData>} */
      const pivotedData = pivotFieldDataByType(fieldsData[fieldName]);
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData);
      if (pivotedData.$ref && pivotedData.$ref.count > 1) {
        // Prevent overriding the $ref type label
        // 1. Find the first $ref
        const refType = fieldsData[fieldName].find(typeRefs => typeRefs.$ref);
        fieldSummary[fieldName].$ref.typeAlias = refType.$ref;
      }

      // console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName])
    });
  log('Post-condenseFieldSizes(fields[fieldName])');
  log('Replaced fieldData with fieldSummary');
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

/* //*
 * @param {Object.<string, { value?, length?, scale?, precision?, invalid? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, InternalFieldTypeData>}
 */
function pivotFieldDataByType (typeSizeData) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  log(`Processing ${typeSizeData.length} type guesses`);
  return typeSizeData.reduce((pivotedData, currentTypeGuesses) => {
    Object.entries(currentTypeGuesses)
      .map(([typeName, { value, length, scale, precision }]) => {
      // console.log(typeName, JSON.stringify({ length, scale, precision }))
        pivotedData[typeName] = pivotedData[typeName] || { typeName, count: 0 };
        // if (!pivotedData[typeName].count) pivotedData[typeName].count = 0
        if (Number.isFinite(length) && !pivotedData[typeName].length) pivotedData[typeName].length = [];
        if (Number.isFinite(scale) && !pivotedData[typeName].scale) pivotedData[typeName].scale = [];
        if (Number.isFinite(precision) && !pivotedData[typeName].precision) pivotedData[typeName].precision = [];
        if (Number.isFinite(value) && !pivotedData[typeName].value) pivotedData[typeName].value = [];

        pivotedData[typeName].count++;
        // if (invalid != null) pivotedData[typeName].invalid++
        if (length) pivotedData[typeName].length.push(length);
        if (scale) pivotedData[typeName].scale.push(scale);
        if (precision) pivotedData[typeName].precision.push(precision);
        if (value) pivotedData[typeName].value.push(value);
        // pivotedData[typeName].rank = typeRankings[typeName]
        return pivotedData[typeName]
      });
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
  const aggregateSummary = {};
  log('Starting condenseFieldSizes()');
  Object.keys(pivotedDataByType)
    .map((typeName) => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName] || -42,
        count: pivotedDataByType[typeName].count
      };
      if (typeName === '$ref') {
        // console.log('pivotedDataByType.$ref', JSON.stringify(pivotedDataByType.$ref, null, 2));
        aggregateSummary[typeName].typeAlias = pivotedDataByType.$ref;
      } else {
        if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value);
        if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length, true);
        if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale, true);
        if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision, true);
      }

      // if (pivotedDataByType[typeName].invalid) { aggregateSummary[typeName].invalid = pivotedDataByType[typeName].invalid }

      if (['Timestamp', 'Date'].indexOf(typeName) > -1) {
        aggregateSummary[typeName].value = formatRangeStats(aggregateSummary[typeName].value, parseDate);
      }
    });
  log('Done condenseFieldSizes()...');
  return aggregateSummary
}

function getFieldMetadata ({
  value,
  strictMatching
}) {
  // Get initial pass at the data with the TYPE_* `.check()` methods.
  const typeGuesses = detectTypes(value, strictMatching);

  // Assign initial metadata for each matched type below
  return typeGuesses.reduce((analysis, typeGuess, rank) => {
    let length;
    let precision;
    let scale;

    analysis[typeGuess] = { rank: rank + 1 };

    if (typeGuess === 'Array') {
      length = value.length;
      analysis[typeGuess] = { ...analysis[typeGuess], length };
    }
    if (typeGuess === 'Float') {
      value = parseFloat(value);
      analysis[typeGuess] = { ...analysis[typeGuess], value };
      const significandAndMantissa = String(value).split('.');
      if (significandAndMantissa.length === 2) {
        precision = significandAndMantissa.join('').length; // total # of numeric positions before & after decimal
        scale = significandAndMantissa[1].length;
        analysis[typeGuess] = { ...analysis[typeGuess], precision, scale };
      }
    }
    if (typeGuess === 'Number') {
      value = Number(value);
      analysis[typeGuess] = { ...analysis[typeGuess], value };
    }
    if (typeGuess === 'Date' || typeGuess === 'Timestamp') {
      const checkedDate = isValidDate(value);
      if (checkedDate) {
        analysis[typeGuess] = { ...analysis[typeGuess], value: checkedDate.getTime() };
      // } else {
      //   analysis[typeGuess] = { ...analysis[typeGuess], invalid: true, value: value }
      }
    }
    if (typeGuess === 'String' || typeGuess === 'Email') {
      length = String(value).length;
      analysis[typeGuess] = { ...analysis[typeGuess], length };
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
  const sortedNumbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1);
  const sum = numbers.reduce((a, b) => a + b, 0);
  if (useSortedDataForPercentiles) numbers = sortedNumbers;
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
}exports._condenseFieldData=condenseFieldData;exports._formatRangeStats=formatRangeStats;exports._getNumberRangeStats=getNumberRangeStats;exports._pivotFieldDataByType=pivotFieldDataByType;exports.getNumberRangeStats=getNumberRangeStats;exports.isValidDate=isValidDate;exports.pivotFieldDataByType=pivotFieldDataByType;exports.schemaBuilder=schemaBuilder;Object.defineProperty(exports,'__esModule',{value:true});})));//# sourceMappingURL=schema-analyzer.umd.js.map
