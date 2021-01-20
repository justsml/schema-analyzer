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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE_OBJECT = exports.TYPE_ARRAY = exports.TYPE_STRING = exports.TYPE_EMAIL = exports.TYPE_NULL = exports.TYPE_NUMBER = exports.TYPE_FLOAT = exports.TYPE_CURRENCY = exports.TYPE_TIMESTAMP = exports.TYPE_DATE = exports.TYPE_BOOLEAN = exports.TYPE_UUID = exports.TYPE_OBJECT_ID = exports.TYPE_UNKNOWN = exports.MetaChecks = exports.detectTypes = exports.prioritizedTypes = exports.typeRankings = void 0;
var type_detectors_1 = require("./type-detectors");
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
exports.detectTypes = detectTypes;
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
exports.MetaChecks = MetaChecks;
// Basic Type Filters - rudimentary data sniffing used to tally up "votes" for a given field
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
var TYPE_UNKNOWN = {
    type: "Unknown",
    check: function (value) { return value === undefined || value === "undefined"; },
};
exports.TYPE_UNKNOWN = TYPE_UNKNOWN;
var TYPE_OBJECT_ID = {
    type: "ObjectId",
    supercedes: ["String"],
    check: type_detectors_1.isObjectId,
};
exports.TYPE_OBJECT_ID = TYPE_OBJECT_ID;
var TYPE_UUID = {
    type: "UUID",
    supercedes: ["String"],
    check: type_detectors_1.isUuid,
};
exports.TYPE_UUID = TYPE_UUID;
var TYPE_BOOLEAN = {
    type: "Boolean",
    supercedes: ["String"],
    check: type_detectors_1.isBoolish,
};
exports.TYPE_BOOLEAN = TYPE_BOOLEAN;
var TYPE_DATE = {
    type: "Date",
    supercedes: ["String"],
    check: type_detectors_1.isDateString,
};
exports.TYPE_DATE = TYPE_DATE;
var TYPE_TIMESTAMP = {
    type: "Timestamp",
    supercedes: ["String", "Number"],
    check: type_detectors_1.isTimestamp,
};
exports.TYPE_TIMESTAMP = TYPE_TIMESTAMP;
var TYPE_CURRENCY = {
    type: "Currency",
    supercedes: ["String", "Number"],
    check: type_detectors_1.isCurrency,
};
exports.TYPE_CURRENCY = TYPE_CURRENCY;
var TYPE_FLOAT = {
    type: "Float",
    supercedes: ["String", "Number"],
    check: type_detectors_1.isFloatish,
};
exports.TYPE_FLOAT = TYPE_FLOAT;
var TYPE_NUMBER = {
    type: "Number",
    check: function (value, fieldName) {
        if (hasLeadingZero.test(String(value)))
            return false;
        return !!(value !== null &&
            !Array.isArray(value) &&
            (Number.isInteger(value) || type_detectors_1.isNumeric(value, fieldName)));
    },
};
exports.TYPE_NUMBER = TYPE_NUMBER;
var TYPE_EMAIL = {
    type: "Email",
    supercedes: ["String"],
    check: type_detectors_1.isEmailShaped,
};
exports.TYPE_EMAIL = TYPE_EMAIL;
var TYPE_STRING = {
    type: "String",
    check: function (value) { return typeof value === "string"; },
};
exports.TYPE_STRING = TYPE_STRING;
var TYPE_ARRAY = {
    type: "Array",
    check: function (value) {
        return Array.isArray(value);
    },
};
exports.TYPE_ARRAY = TYPE_ARRAY;
var TYPE_OBJECT = {
    type: "Object",
    check: function (value) {
        return !Array.isArray(value) && value != null && typeof value === "object";
    },
};
exports.TYPE_OBJECT = TYPE_OBJECT;
var TYPE_NULL = {
    type: "Null",
    check: type_detectors_1.isNullish,
};
exports.TYPE_NULL = TYPE_NULL;
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
exports.prioritizedTypes = prioritizedTypes;
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
exports.typeRankings = typeRankings;
// const TYPE_ENUM = {
//   type: "String",
//   check: (value, fieldInfo, schemaInfo) => {
//     // Threshold set to 5% - 5 (or fewer) out of 100 unique strings should enable 'enum' mode
//     if (schemaInfo.inputRowCount < 100) return false; // disabled if set too small
//   }
// };
//# sourceMappingURL=type-helpers.js.map