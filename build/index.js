"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._isValidDate = exports.schemaAnalyzer = exports._formatRangeStats = exports._getNumberRangeStats = exports._pivotFieldDataByType = exports._condenseFieldData = void 0;
var type_helpers_1 = require("./utils/type-helpers");
var debug = require('debug');
var log = debug('schema-builder:index');
// export { schemaAnalyzer, pivotFieldDataByType, getNumberRangeStats, isValidDate }
function isValidDate(date) {
    date = date instanceof Date ? date : new Date(date);
    return isNaN(date.getFullYear()) ? false : date;
}
exports._isValidDate = isValidDate;
var parseDate = function (date) {
    date = isValidDate(date);
    return date && date.toISOString && date.toISOString();
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
        bogusSizeThreshold: 0.1
    }; }
    if (!Array.isArray(input) || typeof input !== 'object')
        throw Error('Input Data must be an Array of Objects');
    if (typeof input[0] !== 'object')
        throw Error('Input Data must be an Array of Objects');
    if (input.length < 5)
        throw Error('Analysis requires at least 5 records. (Use 200+ for great results.)');
    var _a = options.onProgress, onProgress = _a === void 0 ? function (_a) {
        var totalRows = _a.totalRows, currentRow = _a.currentRow;
    } : _a, _b = options.strictMatching, strictMatching = _b === void 0 ? true : _b, _c = options.disableNestedTypes, disableNestedTypes = _c === void 0 ? false : _c, _d = options.enumMinimumRowCount, enumMinimumRowCount = _d === void 0 ? 100 : _d, _e = options.enumAbsoluteLimit, enumAbsoluteLimit = _e === void 0 ? 10 : _e, _f = options.enumPercentThreshold, enumPercentThreshold = _f === void 0 ? 0.01 : _f, _g = options.nullableRowsThreshold, nullableRowsThreshold = _g === void 0 ? 0.02 : _g, _h = options.uniqueRowsThreshold, uniqueRowsThreshold = _h === void 0 ? 1.0 : _h;
    var isEnumEnabled = input.length >= enumMinimumRowCount;
    var nestedData = {};
    log('Starting');
    return Promise.resolve(input)
        .then(pivotRowsGroupedByType)
        .then(condenseFieldData)
        .then(function (schema) { return __awaiter(_this, void 0, void 0, function () {
        var fields, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    log('Built summary from Field Type data.');
                    fields = Object.keys(schema.fields)
                        .reduce(function (fieldInfo, fieldName) {
                        var typesInfo = schema.fields[fieldName];
                        /* //* @type {FieldInfo} */
                        fieldInfo[fieldName] = {
                            types: typesInfo
                        };
                        fieldInfo[fieldName] = type_helpers_1.MetaChecks.TYPE_ENUM.check(fieldInfo[fieldName], { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] }, { enumAbsoluteLimit: enumAbsoluteLimit, enumPercentThreshold: enumPercentThreshold });
                        fieldInfo[fieldName] = type_helpers_1.MetaChecks.TYPE_NULLABLE.check(fieldInfo[fieldName], { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] }, { nullableRowsThreshold: nullableRowsThreshold });
                        fieldInfo[fieldName] = type_helpers_1.MetaChecks.TYPE_UNIQUE.check(fieldInfo[fieldName], { rowCount: input.length, uniques: schema.uniques && schema.uniques[fieldName] }, { uniqueRowsThreshold: uniqueRowsThreshold });
                        // typesInfo.$ref
                        var isIdentity = (typesInfo.Number || typesInfo.UUID) && fieldInfo[fieldName].unique && /id$/i.test(fieldName);
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
        return Object.entries(nestedData)
            .reduce(function (nestedTypeSummaries, _a) {
            var fullTypeName = _a[0], data = _a[1];
            return __awaiter(_this, void 0, void 0, function () {
                var nameParts, nameSuffix, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            nameParts = fullTypeName.split('.');
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
        var detectedSchema = { uniques: isEnumEnabled ? {} : null, fieldsData: {}, totalRows: null };
        log("  About to examine every row & cell. Found " + docs.length + " records...");
        var pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
        log('  Extracted data points from Field Type analysis');
        return pivotedSchema;
    }
    /**
       * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: InternalFieldTypeData[]; }; }} schema
       * @param {{ [x: string]: any; }} row
       * @param {number} index
       * @param {any[]} array
       */
    function evaluateSchemaLevel(schema, row, index, array) {
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
            var isPossibleEnumType = typeNames.includes('Number') || typeNames.includes('String');
            if (!disableNestedTypes) {
                // TODO: Review hackey pattern here (buffers too much, better association of custom types, see `$ref`)
                // Steps: 1. Check if Array of Objects, 2. Add to local `nestedData` to hold data for post-processing.
                if (Array.isArray(value) && value.length >= 1 && typeof value[0] === 'object') {
                    nestedData[schemaName + "." + fieldName] = nestedData[schemaName + "." + fieldName] || [];
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
exports.schemaAnalyzer = schemaAnalyzer;
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
    fieldNames
        .forEach(function (fieldName) {
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
    log('Post-condenseFieldSizes(fields[fieldName])');
    log('Replaced fieldData with fieldSummary');
    return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows };
}
exports._condenseFieldData = condenseFieldData;
/* //*
 * @param {Object.<string, { value?, length?, scale?, precision?, invalid? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, InternalFieldTypeData>}
 */
function pivotFieldDataByType(typeSizeData) {
    // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
    log("Processing " + typeSizeData.length + " type guesses");
    return typeSizeData.reduce(function (pivotedData, currentTypeGuesses) {
        Object.entries(currentTypeGuesses)
            .map(function (_a) {
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
exports._pivotFieldDataByType = pivotFieldDataByType;
/**
 * Internal function which analyzes and summarizes each columns data by type. Sort of a histogram of significant points.
 * @private
 *
 * @//param {Object.<string, InternalFieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
 * @//returns {Object.<string, FieldTypeSummary>} - The final output, with histograms of significant points
 */
function condenseFieldSizes(pivotedDataByType) {
    var aggregateSummary = {};
    log('Starting condenseFieldSizes()');
    Object.keys(pivotedDataByType)
        .map(function (typeName) {
        aggregateSummary[typeName] = {
            // typeName,
            rank: type_helpers_1.typeRankings[typeName] || -42,
            count: pivotedDataByType[typeName].count
        };
        if (typeName === '$ref') {
            // console.log('pivotedDataByType.$ref', JSON.stringify(pivotedDataByType.$ref, null, 2));
            aggregateSummary[typeName].typeAlias = pivotedDataByType.$ref;
        }
        else {
            if (pivotedDataByType[typeName].value)
                aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value);
            if (pivotedDataByType[typeName].length)
                aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length, true);
            if (pivotedDataByType[typeName].scale)
                aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale, true);
            if (pivotedDataByType[typeName].precision)
                aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision, true);
        }
        // if (pivotedDataByType[typeName].invalid) { aggregateSummary[typeName].invalid = pivotedDataByType[typeName].invalid }
        if (['Timestamp', 'Date'].indexOf(typeName) > -1) {
            aggregateSummary[typeName].value = formatRangeStats(aggregateSummary[typeName].value, parseDate);
        }
    });
    log('Done condenseFieldSizes()...');
    return aggregateSummary;
}
function getFieldMetadata(_a) {
    var value = _a.value, strictMatching = _a.strictMatching;
    // Get initial pass at the data with the TYPE_* `.check()` methods.
    var typeGuesses = type_helpers_1.detectTypes(value, strictMatching);
    // Assign initial metadata for each matched type below
    return typeGuesses.reduce(function (analysis, typeGuess, rank) {
        var length;
        var precision;
        var scale;
        analysis[typeGuess] = { rank: rank + 1 };
        if (typeGuess === 'Array') {
            length = value.length;
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { length: length });
        }
        if (typeGuess === 'Float') {
            value = parseFloat(value);
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: value });
            var significandAndMantissa = String(value).split('.');
            if (significandAndMantissa.length === 2) {
                precision = significandAndMantissa.join('').length; // total # of numeric positions before & after decimal
                scale = significandAndMantissa[1].length;
                analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { precision: precision, scale: scale });
            }
        }
        if (typeGuess === 'Number') {
            value = Number(value);
            analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: value });
        }
        if (typeGuess === 'Date' || typeGuess === 'Timestamp') {
            var checkedDate = isValidDate(value);
            if (checkedDate) {
                analysis[typeGuess] = __assign(__assign({}, analysis[typeGuess]), { value: checkedDate.getTime() });
                // } else {
                //   analysis[typeGuess] = { ...analysis[typeGuess], invalid: true, value: value }
            }
        }
        if (typeGuess === 'String' || typeGuess === 'Email') {
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
 * @returns {AggregateSummary}
 */
function getNumberRangeStats(numbers, useSortedDataForPercentiles) {
    if (useSortedDataForPercentiles === void 0) { useSortedDataForPercentiles = false; }
    if (!numbers || numbers.length < 1)
        return undefined;
    var sortedNumbers = numbers.slice().sort(function (a, b) { return a < b ? -1 : a === b ? 0 : 1; });
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
        p50: numbers[parseInt(String(numbers.length * 0.50), 10)],
        p66: numbers[parseInt(String(numbers.length * 0.66), 10)],
        p75: numbers[parseInt(String(numbers.length * 0.75), 10)],
        p99: numbers[parseInt(String(numbers.length * 0.99), 10)]
    };
}
exports._getNumberRangeStats = getNumberRangeStats;
/**
 *
 */
function formatRangeStats(stats, formatter) {
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
    };
}
exports._formatRangeStats = formatRangeStats;
//# sourceMappingURL=index.js.map