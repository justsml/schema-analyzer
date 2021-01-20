"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUuid = exports.isTimestamp = exports.isObjectId = exports.isNumeric = exports.isNullish = exports.isFloatish = exports.isEmailShaped = exports.isDateString = exports.isCurrency = exports.isBoolish = void 0;
var lodash_es_1 = require("lodash-es");
var currencies = [
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
exports.isBoolish = isBoolish;
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
exports.isUuid = isUuid;
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
exports.isObjectId = isObjectId;
/**
 * @param {string | any[] | null} value
 * @param {any} fieldName
 */
function isDateString(value, fieldName) {
    // not bullet-proof, meant to sniff intention in the data
    if (value == null)
        return false;
    if (lodash_es_1.isDate(value))
        return true;
    value = String(value).trim();
    return value.length < 30 && dateStringPattern.test(value);
}
exports.isDateString = isDateString;
/**
 * @param {string | null} value
 */
function isTimestamp(value) {
    if (value == null)
        return false;
    value = String(value).trim();
    return timestampPattern.test(value);
}
exports.isTimestamp = isTimestamp;
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
exports.isCurrency = isCurrency;
/**
 * @param {string | any[]} value
 * @param {undefined} [fieldName]
 */
function isNumeric(value, fieldName) {
    // if (value == null) return false
    value = String(value).trim();
    return value.length < 30 && numberishPattern.test(value);
}
exports.isNumeric = isNumeric;
/**
 * @param {unknown} value
 */
function isFloatish(value) {
    return !!(isNumeric(String(value)) &&
        floatPattern.test(String(value)) &&
        !Number.isInteger(value));
}
exports.isFloatish = isFloatish;
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
exports.isEmailShaped = isEmailShaped;
/**
 * @param {null} value
 */
function isNullish(value) {
    return value === null || nullishPattern.test(String(value).trim());
}
exports.isNullish = isNullish;
//# sourceMappingURL=type-detectors.js.map