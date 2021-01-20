/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();/** Built-in value references. */
var Symbol$1 = root.Symbol;/** Used for built-in method references. */
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
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

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
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

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
var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;var currencies = [
    "$",
    "¢",
    "£",
    "¤",
    "¥",
    "֏",
    "؋",
    "߾",
    "߿",
    "৲",
    "৳",
    "৻",
    "૱",
    "௹",
    "฿",
    "៛",
    "₠",
    "₡",
    "₢",
    "₣",
    "₤",
    "₥",
    "₦",
    "₧",
    "₨",
    "₩",
    "₪",
    "₫",
    "€",
    "₭",
    "₮",
    "₯",
    "₰",
    "₱",
    "₲",
    "₳",
    "₴",
    "₵",
    "₶",
    "₷",
    "₸",
    "₹",
    "₺",
    "₻",
    "₼",
    "₽",
    "₾",
    "₿",
    "꠸",
    "﷼",
    "﹩",
    "＄",
    "￠",
    "￡",
    "￥",
    "￦",
    "𑿝",
    "𑿞",
    "𑿟",
    "𑿠",
    "𞋿",
    "𞲰",
];
var boolishPattern = /^([YN]|(TRUE)|(FALSE))$/i;
var uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
var objectIdPattern = /^[a-f\d]{24}$/i;
var dateStringPattern = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
var timestampPattern = /^[12]\d{12}$/;
// const currencyPatternUS = /^\p{Sc}\s?[\d,.]+$/uig
// const currencyPatternEU = /^[\d,.]+\s?\p{Sc}$/uig
var numberishPattern = /^-?[\d.,]+$/;
var floatPattern = /\d\.\d/;
// const emailPattern = /^[^@]+@[^@]{2,}\.[^@]{2,}[^.]$/
var emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
var nullishPattern = /null/i;
// const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/igm
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
function isBoolish(value, fieldName) {
    if (value == null)
        return false;
    value = String(value).trim();
    return value.length <= 6 && boolishPattern.test(String(value));
}
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
function isUuid(value, fieldName) {
    if (value == null)
        return false;
    value = String(value).trim();
    return value.length < 40 && uuidPattern.test(value);
}
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
function isObjectId(value, fieldName) {
    if (value == null)
        return false;
    value = String(value).trim();
    return value.length < 40 && objectIdPattern.test(value);
}
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
function isDateString(value, fieldName) {
    // not bullet-proof, meant to sniff intention in the data
    if (value == null)
        return false;
    if (isDate(value))
        return true;
    value = String(value).trim();
    return value.length < 30 && dateStringPattern.test(value);
}
/**
 * @param {string | null} value
 */
function isTimestamp(value) {
    if (value == null)
        return false;
    value = String(value).trim();
    return timestampPattern.test(value);
}
/**
 * @param {string | null} value
 */
function isCurrency(value) {
    if (value == null)
        return false;
    value = String(value).trim();
    var valueSymbol = currencies.find(function (curSymbol) { return value && value.indexOf(curSymbol) > -1; });
    if (!valueSymbol)
        return false;
    value = value.replace(valueSymbol, "");
    return isNumeric(value);
    // console.log(value, 'currencyPatternUS', currencyPatternUS.test(value), 'currencyPatternEU', currencyPatternEU.test(value));
    // return currencyPatternUS.test(value) || currencyPatternEU.test(value)
}
/**
 * @param {string | any[]} value
 * @param {undefined} [fieldName]
 */
function isNumeric(value, fieldName) {
    // if (value == null) return false
    value = String(value).trim();
    return value.length < 30 && numberishPattern.test(value);
}
/**
 * @param {unknown} value
 */
function isFloatish(value) {
    return !!(isNumeric(String(value)) &&
        floatPattern.test(String(value)) &&
        !Number.isInteger(value));
}
/**
 * @param {string | string[] | null} value
 */
function isEmailShaped(value) {
    if (value == null)
        return false;
    value = String(value).trim();
    if (value.includes(" ") || !value.includes("@"))
        return false;
    return value.length >= 5 && value.length < 80 && emailPattern.test(value);
}
/**
 * @param {null} value
 */
function isNullish(value) {
    return value === null || nullishPattern.test(String(value).trim());
}var _a;
var hasLeadingZero = /^0+/;
/**
 * Returns an array of TypeName.
 */
function detectTypes(value, strictMatching) {
    if (strictMatching === void 0) { strictMatching = true; }
    var excludedTypes = [];
    var matchedTypes = prioritizedTypes.reduce(function (types, typeHelper) {
        if (typeHelper.check(value)) {
            if (typeHelper.supercedes)
                excludedTypes.push.apply(excludedTypes, typeHelper.supercedes);
            types.push(typeHelper.type);
        }
        return types;
    }, []);
    return !strictMatching
        ? matchedTypes
        : matchedTypes.filter(function (type) { return excludedTypes.indexOf(type) === -1; });
}
/**
 * MetaChecks are used to analyze the intermediate results, after the Basic (discreet) type checks are complete.
 * They have access to all the data points before it is finally processed.
 */
var TYPE_ENUM = {
    type: "enum",
    matchBasicTypes: ["String", "Number"],
    check: function (typeInfo, _a, _b) {
        var rowCount = _a.rowCount, uniques = _a.uniques;
        var _c = _b.enumAbsoluteLimit, enumAbsoluteLimit = _c === void 0 ? 20 : _c, _d = _b.enumPercentThreshold, enumPercentThreshold = _d === void 0 ? 0.9 : _d;
        if (!uniques || uniques.length === 0)
            return typeInfo;
        // TODO: calculate uniqueness using ALL uniques combined from ALL types, this only sees consistently typed data
        // const uniqueness = rowCount / uniques.length
        var relativeEnumLimit = Math.min(parseInt(String(rowCount * enumPercentThreshold), 10), enumAbsoluteLimit);
        if (uniques.length > relativeEnumLimit)
            return typeInfo;
        // const enumLimit = uniqueness < enumAbsoluteLimit && relativeEnumLimit < enumAbsoluteLimit
        //   ? enumAbsoluteLimit
        //   : relativeEnumLimit
        return __assign({ enum: uniques }, typeInfo);
        // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    },
};
var TYPE_NULLABLE = {
    type: "nullable",
    // matchBasicTypes: ['String', 'Number'],
    check: function (typeInfo, _a, _b) {
        var rowCount = _a.rowCount, uniques = _a.uniques;
        var _c = _b.nullableRowsThreshold, nullableRowsThreshold = _c === void 0 ? 0.9 : _c;
        if (!uniques || uniques.length === 0)
            return typeInfo;
        var nullishTypeCount = 0;
        // if (typeInfo && typeInfo.types && typeInfo.types.Null) console.warn('Unexpected type info structure! (.types. key!)');
        if (typeInfo === null || typeInfo === void 0 ? void 0 : typeInfo.types.Null) {
            nullishTypeCount += typeInfo.types.Null.count;
        }
        // if (types.Unknown) {
        //   nullishTypeCount += types.Unknown.count
        // }
        var nullLimit = nullableRowsThreshold
            ? rowCount * nullableRowsThreshold
            : 0;
        var isNullable = nullishTypeCount >= nullLimit;
        // TODO: Look into specifically checking 'Null' or 'Unknown' type stats
        return __assign({ nullable: isNullable }, typeInfo);
        // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    },
};
var TYPE_UNIQUE = {
    type: "unique",
    // matchBasicTypes: ['String', 'Number'],
    check: function (typeInfo, _a, _b) {
        var rowCount = _a.rowCount, uniques = _a.uniques;
        var _c = _b.uniqueRowsThreshold, uniqueRowsThreshold = _c === void 0 ? 0.9 : _c;
        if (!uniques || uniques.length === 0)
            return typeInfo;
        // const uniqueness = rowCount / uniques.length
        var isUnique = uniques.length >= rowCount * uniqueRowsThreshold;
        // TODO: Look into specifically checking 'Null' or 'Unknown' type stats
        return __assign({ unique: isUnique }, typeInfo);
        // return {unique: uniqueness >= uniqueRowsThreshold, ...typeInfo}
        // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    },
};
var MetaChecks = {
    TYPE_UNIQUE: TYPE_UNIQUE,
    TYPE_ENUM: TYPE_ENUM,
    TYPE_NULLABLE: TYPE_NULLABLE,
};
// Basic Type Filters - rudimentary data sniffing used to tally up "votes" for a given field
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
var TYPE_UNKNOWN = {
    type: "Unknown",
    check: function (value) { return value === undefined || value === "undefined"; },
};
var TYPE_OBJECT_ID = {
    type: "ObjectId",
    supercedes: ["String"],
    check: isObjectId,
};
var TYPE_UUID = {
    type: "UUID",
    supercedes: ["String"],
    check: isUuid,
};
var TYPE_BOOLEAN = {
    type: "Boolean",
    supercedes: ["String"],
    check: isBoolish,
};
var TYPE_DATE = {
    type: "Date",
    supercedes: ["String"],
    check: isDateString,
};
var TYPE_TIMESTAMP = {
    type: "Timestamp",
    supercedes: ["String", "Number"],
    check: isTimestamp,
};
var TYPE_CURRENCY = {
    type: "Currency",
    supercedes: ["String", "Number"],
    check: isCurrency,
};
var TYPE_FLOAT = {
    type: "Float",
    supercedes: ["String", "Number"],
    check: isFloatish,
};
var TYPE_NUMBER = {
    type: "Number",
    check: function (value, fieldName) {
        if (hasLeadingZero.test(String(value)))
            return false;
        return !!(value !== null &&
            !Array.isArray(value) &&
            (Number.isInteger(value) || isNumeric(value)));
    },
};
var TYPE_EMAIL = {
    type: "Email",
    supercedes: ["String"],
    check: isEmailShaped,
};
var TYPE_STRING = {
    type: "String",
    check: function (value) { return typeof value === "string"; },
};
var TYPE_ARRAY = {
    type: "Array",
    check: function (value) {
        return Array.isArray(value);
    },
};
var TYPE_OBJECT = {
    type: "Object",
    check: function (value) {
        return !Array.isArray(value) && value != null && typeof value === "object";
    },
};
var TYPE_NULL = {
    type: "Null",
    check: isNullish,
};
var prioritizedTypes = [
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
    TYPE_OBJECT,
];
/**
 * Type Rank Map: Use to sort Lowest to Highest
 */
var typeRankings = (_a = {},
    _a[TYPE_UNKNOWN.type] = -1,
    _a[TYPE_OBJECT_ID.type] = 1,
    _a[TYPE_UUID.type] = 2,
    _a[TYPE_BOOLEAN.type] = 3,
    _a[TYPE_DATE.type] = 4,
    _a[TYPE_TIMESTAMP.type] = 5,
    _a[TYPE_CURRENCY.type] = 6,
    _a[TYPE_FLOAT.type] = 7,
    _a[TYPE_NUMBER.type] = 8,
    _a[TYPE_NULL.type] = 10,
    _a[TYPE_EMAIL.type] = 11,
    _a[TYPE_STRING.type] = 12,
    _a[TYPE_ARRAY.type] = 13,
    _a[TYPE_OBJECT.type] = 14,
    _a);
// const TYPE_ENUM = {
//   type: "String",
//   check: (value, fieldInfo, schemaInfo) => {
//     // Threshold set to 5% - 5 (or fewer) out of 100 unique strings should enable 'enum' mode
//     if (schemaInfo.inputRowCount < 100) return false; // disabled if set too small
//   }
// };
var debug = require("debug");
var log = debug("schema-builder:index");
// export { schemaAnalyzer, pivotFieldDataByType, getNumberRangeStats, isValidDate }
function isValidDate(date) {
    date = date instanceof Date ? date : new Date(date);
    return isNaN(date.getFullYear()) ? false : date;
}
var parseDate = function (date) {
    date = isValidDate(date);
    return date instanceof Date ? date.toISOString() : null;
};
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
function schemaAnalyzer(schemaName, input, options) {
    var _this = this;
    if (options === void 0) { options = {
        onProgress: function (_a) {
            var totalRows = _a.totalRows, currentRow = _a.currentRow;
        },
        strictMatching: true,
        disableNestedTypes: false,
        enumMinimumRowCount: 100,
        enumAbsoluteLimit: 10,
        enumPercentThreshold: 0.01,
        nullableRowsThreshold: 0.02,
        uniqueRowsThreshold: 1.0,
        bogusSizeThreshold: 0.1,
    }; }
    if (!Array.isArray(input) || typeof input !== "object")
        throw Error("Input Data must be an Array of Objects");
    if (typeof input[0] !== "object")
        throw Error("Input Data must be an Array of Objects");
    if (input.length < 5)
        throw Error("Analysis requires at least 5 records. (Use 200+ for great results.)");
    var _a = options.onProgress, onProgress = _a === void 0 ? function (_a) {
        var totalRows = _a.totalRows, currentRow = _a.currentRow;
    } : _a, _b = options.strictMatching, strictMatching = _b === void 0 ? true : _b, _c = options.disableNestedTypes, disableNestedTypes = _c === void 0 ? false : _c, _d = options.enumMinimumRowCount, enumMinimumRowCount = _d === void 0 ? 100 : _d, _e = options.enumAbsoluteLimit, enumAbsoluteLimit = _e === void 0 ? 10 : _e, _f = options.enumPercentThreshold, enumPercentThreshold = _f === void 0 ? 0.01 : _f, _g = options.nullableRowsThreshold, nullableRowsThreshold = _g === void 0 ? 0.02 : _g, _h = options.uniqueRowsThreshold, uniqueRowsThreshold = _h === void 0 ? 1.0 : _h;
    var isEnumEnabled = input.length >= enumMinimumRowCount;
    var nestedData = {};
    log("Starting");
    return Promise.resolve(input)
        .then(pivotRowsGroupedByType)
        .then(condenseFieldData)
        .then(function (schema) { return __awaiter(_this, void 0, void 0, function () {
        var fields, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    log("Built summary from Field Type data.");
                    fields = Object.keys(schema.fields).reduce(function (fieldInfo, fieldName) {
                        var typesInfo = schema.fields[fieldName];
                        /* //* @type {FieldInfo} */
                        fieldInfo[fieldName] = {
                            types: typesInfo,
                        };
                        fieldInfo[fieldName] = MetaChecks.TYPE_ENUM.check(fieldInfo[fieldName], {
                            rowCount: input.length,
                            uniques: schema.uniques && schema.uniques[fieldName],
                        }, { enumAbsoluteLimit: enumAbsoluteLimit, enumPercentThreshold: enumPercentThreshold });
                        fieldInfo[fieldName] = MetaChecks.TYPE_NULLABLE.check(fieldInfo[fieldName], {
                            rowCount: input.length,
                            uniques: schema.uniques && schema.uniques[fieldName],
                        }, { nullableRowsThreshold: nullableRowsThreshold });
                        fieldInfo[fieldName] = MetaChecks.TYPE_UNIQUE.check(fieldInfo[fieldName], {
                            rowCount: input.length,
                            uniques: schema.uniques && schema.uniques[fieldName],
                        }, { uniqueRowsThreshold: uniqueRowsThreshold });
                        // typesInfo.$ref
                        var isIdentity = (typesInfo.Number || typesInfo.UUID) &&
                            fieldInfo[fieldName].unique &&
                            /id$/i.test(fieldName);
                        if (isIdentity) {
                            fieldInfo[fieldName].identity = true;
                        }
                        if (schema.uniques && schema.uniques[fieldName]) {
                            fieldInfo[fieldName].uniqueCount = schema.uniques[fieldName].length;
                        }
                        return fieldInfo;
                    }, {});
                    _b = {
                        fields: fields,
                        totalRows: schema.totalRows
                    };
                    if (!disableNestedTypes) return [3 /*break*/, 1];
                    _a = undefined;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, nestedschemaAnalyzer(nestedData)];
                case 2:
                    _a = _c.sent();
                    _c.label = 3;
                case 3: return [2 /*return*/, (_b.nestedTypes = _a,
                        _b)];
            }
        });
    }); });
    function nestedschemaAnalyzer(nestedData) {
        var _this = this;
        return Object.entries(nestedData).reduce(function (nestedTypeSummaries, _a) {
            var fullTypeName = _a[0], data = _a[1];
            return __awaiter(_this, void 0, void 0, function () {
                var nameParts, nameSuffix, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            nameParts = fullTypeName.split(".");
                            nameSuffix = nameParts[nameParts.length - 1];
                            _b = nestedTypeSummaries;
                            _c = fullTypeName;
                            return [4 /*yield*/, schemaAnalyzer(nameSuffix, data, options)];
                        case 1:
                            _b[_c] = _d.sent();
                            return [2 /*return*/, nestedTypeSummaries];
                    }
                });
            });
        }, {});
    }
    /**
     * @param {object[]} docs
     * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     */
    function pivotRowsGroupedByType(docs) {
        var detectedSchema = {
            uniques: isEnumEnabled ? {} : null,
            fieldsData: {},
            totalRows: null,
        };
        log("  About to examine every row & cell. Found " + docs.length + " records...");
        var pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
        log("  Extracted data points from Field Type analysis");
        return pivotedSchema;
    }
    /**
     * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
     * @param {{ [x: string]: any; }} row
     * @param {number} index
     * @param {any[]} array
     */
    function evaluateSchemaLevel(schema, row, index, array) {
        // eslint-disable-line
        schema.totalRows = schema.totalRows || array.length;
        var fieldNames = Object.keys(row);
        log("Processing Row # " + (index + 1) + "/" + schema.totalRows + "...");
        fieldNames.forEach(function (fieldName, index, array) {
            var _a;
            if (index === 0)
                log("Found " + array.length + " Column(s)!");
            var value = row[fieldName];
            var typeFingerprint = getFieldMetadata({ value: value, strictMatching: strictMatching });
            var typeNames = Object.keys(typeFingerprint);
            var isPossibleEnumType = typeNames.includes("Number") || typeNames.includes("String");
            if (!disableNestedTypes) {
                // TODO: Review hackey pattern here (buffers too much, better association of custom types, see `$ref`)
                // Steps: 1. Check if Array of Objects, 2. Add to local `nestedData` to hold data for post-processing.
                if (Array.isArray(value) &&
                    value.length >= 1 &&
                    typeof value[0] === "object") {
                    nestedData[schemaName + "." + fieldName] =
                        nestedData[schemaName + "." + fieldName] || [];
                    (_a = nestedData[schemaName + "." + fieldName]).push.apply(_a, value);
                    typeFingerprint.$ref = schemaName + "." + fieldName;
                }
            }
            if (isEnumEnabled && isPossibleEnumType) {
                schema.uniques[fieldName] = schema.uniques[fieldName] || [];
                if (!schema.uniques[fieldName].includes(value))
                    schema.uniques[fieldName].push(row[fieldName]);
                // } else {
                //   schema.uniques[fieldName] = null
            }
            schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || [];
            schema.fieldsData[fieldName].push(typeFingerprint);
        });
        onProgress({ totalRows: schema.totalRows, currentRow: index + 1 });
        return schema;
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
 */
function condenseFieldData(schema) {
    var fieldsData = schema.fieldsData;
    var fieldNames = Object.keys(fieldsData);
    var fieldSummary = {};
    log("Pre-condenseFieldSizes(fields[fieldName]) for " + fieldNames.length + " columns");
    fieldNames.forEach(function (fieldName) {
        var pivotedData = pivotFieldDataByType(fieldsData[fieldName]);
        fieldSummary[fieldName] = condenseFieldSizes(pivotedData);
        if (pivotedData.$ref && pivotedData.$ref.count > 1) {
            // Prevent overriding the $ref type label
            // 1. Find the first $ref
            var refType = fieldsData[fieldName].find(function (typeRefs) { return typeRefs.$ref; });
            fieldSummary[fieldName].$ref.typeAlias = refType.$ref;
        }
        // console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName])
    });
    log("Post-condenseFieldSizes(fields[fieldName])");
    log("Replaced fieldData with fieldSummary");
    return {
        fields: fieldSummary,
        uniques: schema.uniques,
        totalRows: schema.totalRows,
    };
}
/* //*
 * @param {Object.<string, { value?, length?, scale?, precision?, invalid? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, InternalFieldTypeData>}
 */
function pivotFieldDataByType(typeSizeData) {
    // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
    log("Processing " + typeSizeData.length + " type guesses");
    return typeSizeData.reduce(function (pivotedData, currentTypeGuesses) {
        Object.entries(currentTypeGuesses).map(function (_a) {
            var typeName = _a[0], _b = _a[1], value = _b.value, length = _b.length, scale = _b.scale, precision = _b.precision;
            // console.log(typeName, JSON.stringify({ length, scale, precision }))
            pivotedData[typeName] = pivotedData[typeName] || { typeName: typeName, count: 0 };
            // if (!pivotedData[typeName].count) pivotedData[typeName].count = 0
            if (Number.isFinite(length) && !pivotedData[typeName].length)
                pivotedData[typeName].length = [];
            if (Number.isFinite(scale) && !pivotedData[typeName].scale)
                pivotedData[typeName].scale = [];
            if (Number.isFinite(precision) && !pivotedData[typeName].precision)
                pivotedData[typeName].precision = [];
            if (Number.isFinite(value) && !pivotedData[typeName].value)
                pivotedData[typeName].value = [];
            pivotedData[typeName].count++;
            // if (invalid != null) pivotedData[typeName].invalid++
            if (length)
                pivotedData[typeName].length.push(length);
            if (scale)
                pivotedData[typeName].scale.push(scale);
            if (precision)
                pivotedData[typeName].precision.push(precision);
            if (value)
                pivotedData[typeName].value.push(value);
            // pivotedData[typeName].rank = typeRankings[typeName]
            return pivotedData[typeName];
        });
        return pivotedData;
    }, {});
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
 *
 * @//param {Object.<string, InternalFieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
 * @//returns {Object.<string, FieldTypeSummary>} - The final output, with histograms of significant points
 */
function condenseFieldSizes(pivotedDataByType) {
    var aggregateSummary = {};
    log("Starting condenseFieldSizes()");
    Object.keys(pivotedDataByType).map(function (typeName) {
        var _a, _b, _c, _d;
        aggregateSummary[typeName] = {
            // typeName,
            rank: typeRankings[typeName] || -42,
            count: pivotedDataByType[typeName].count || -1,
        };
        if (aggregateSummary[typeName]) {
            if (typeName === "$ref" && aggregateSummary[typeName]) {
                console.log("pivotedDataByType.$ref", JSON.stringify(pivotedDataByType.$ref, null, 2));
                aggregateSummary[typeName].typeAlias = pivotedDataByType.$ref.typeAlias;
            }
            else {
                if (pivotedDataByType[typeName].value)
                    aggregateSummary[typeName].value = getNumberRangeStats(((_a = pivotedDataByType[typeName]) === null || _a === void 0 ? void 0 : _a.value) || []);
                if (pivotedDataByType[typeName].length)
                    aggregateSummary[typeName].length = getNumberRangeStats(((_b = pivotedDataByType[typeName]) === null || _b === void 0 ? void 0 : _b.length) || [], true);
                if (pivotedDataByType[typeName].scale)
                    aggregateSummary[typeName].scale = getNumberRangeStats(((_c = pivotedDataByType[typeName]) === null || _c === void 0 ? void 0 : _c.scale) || [], true);
                if (pivotedDataByType[typeName].precision)
                    aggregateSummary[typeName].precision = getNumberRangeStats(((_d = pivotedDataByType[typeName]) === null || _d === void 0 ? void 0 : _d.precision) || [], true);
            }
            // if (pivotedDataByType[typeName].invalid) { aggregateSummary[typeName]!.invalid = pivotedDataByType[typeName].invalid }
            if (aggregateSummary[typeName] &&
                ["Timestamp", "Date"].indexOf(typeName) > -1) {
                // @ts-ignore
                aggregateSummary[typeName].value = formatRangeStats(aggregateSummary[typeName].value || {}, parseDate);
            }
        }
    });
    log("Done condenseFieldSizes()...");
    return aggregateSummary;
}
function getFieldMetadata(_a) {
    var _b = _a.value, value = _b === void 0 ? null : _b, _c = _a.strictMatching, strictMatching = _c === void 0 ? false : _c;
    // Get initial pass at the data with the TYPE_* `.check()` methods.
    var typeGuesses = detectTypes(value, strictMatching);
    // Assign initial metadata for each matched type below
    return typeGuesses.reduce(function (analysis, typeGuess, rank) {
        var _a, _b;
        var length;
        var precision;
        var scale;
        analysis[typeGuess] = { rank: rank + 1, count: 1 };
        if (typeGuess === "Array") {
            length = value.length;
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { length: length });
        }
        if (typeGuess === "Float") {
            value = parseFloat(String(value));
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: value });
            var significandAndMantissa = String(value).split(".");
            if (significandAndMantissa.length === 2) {
                precision = significandAndMantissa.join("").length; // total # of numeric positions before & after decimal
                scale = (_b = (_a = significandAndMantissa[1]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { precision: precision, scale: scale });
            }
        }
        if (typeGuess === "Number") {
            value = Number(value);
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: value });
        }
        if (typeGuess === "Date" || typeGuess === "Timestamp") {
            var checkedDate = isValidDate(value);
            if (checkedDate) {
                analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: checkedDate.getTime() });
                // } else {
                //   analysis[typeGuess] = { ...analysis[typeGuess], invalid: true, value: value }
            }
        }
        if (typeGuess === "String" || typeGuess === "Email") {
            length = String(value).length;
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { length: length });
        }
        return analysis;
    }, {});
}
/**
 * Accepts an array of numbers and returns summary data about
 *  the range & spread of points in the set.
 *
 * @param {number[]} numbers - sequence of unsorted data points
 */
function getNumberRangeStats(numbers, useSortedDataForPercentiles) {
    if (useSortedDataForPercentiles === void 0) { useSortedDataForPercentiles = false; }
    if (!numbers || numbers.length < 1)
        return undefined;
    var sortedNumbers = numbers
        .slice()
        .sort(function (a, b) { return (a < b ? -1 : a === b ? 0 : 1); });
    var sum = numbers.reduce(function (a, b) { return a + b; }, 0);
    if (useSortedDataForPercentiles)
        numbers = sortedNumbers;
    return {
        // size: numbers.length,
        min: sortedNumbers[0],
        mean: sum / numbers.length,
        max: sortedNumbers[numbers.length - 1],
        p25: numbers[parseInt(String(numbers.length * 0.25), 10)],
        p33: numbers[parseInt(String(numbers.length * 0.33), 10)],
        p50: numbers[parseInt(String(numbers.length * 0.5), 10)],
        p66: numbers[parseInt(String(numbers.length * 0.66), 10)],
        p75: numbers[parseInt(String(numbers.length * 0.75), 10)],
        p99: numbers[parseInt(String(numbers.length * 0.99), 10)],
    };
}
/**
 *
 */
function formatRangeStats(stats, formatter) {
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
        p99: formatter(stats.p99),
    };
}export{condenseFieldData as _condenseFieldData,formatRangeStats as _formatRangeStats,getNumberRangeStats as _getNumberRangeStats,isValidDate as _isValidDate,pivotFieldDataByType as _pivotFieldDataByType,schemaAnalyzer};//# sourceMappingURL=schema-analyzer.module.js.map
