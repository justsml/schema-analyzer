import isDate from 'lodash.isdate'
export {
  detectUnsafeKeys,
  isUnsafeKey,

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
}


const currencies = [
  '$', '¢', '£', '¤', '¥', '֏', '؋', '߾', '߿', '৲', '৳', '৻',
  '૱', '௹', '฿', '៛', '₠', '₡', '₢', '₣', '₤', '₥', '₦', '₧',
  '₨', '₩', '₪', '₫', '€', '₭', '₮', '₯', '₰', '₱', '₲', '₳',
  '₴', '₵', '₶', '₷', '₸', '₹', '₺', '₻', '₼', '₽', '₾', '₿',
  '꠸', '﷼', '﹩', '＄', '￠', '￡', '￥', '￦',
  '𑿝', '𑿞', '𑿟', '𑿠', '𞋿', '𞲰'
]


const sqlWordsPattern = /(script)|(&lt;)|(&gt;)|(%3c)|(%3e)|(SELECT) |(UPDATE) |(INSERT) |(DELETE)|(GRANT) |(REVOKE)|(UNION)|(&amp;lt;)|(&amp;gt;)/ig
const jsKeywordsPattern = /(constructor)|(Symbol\.)|(valueOf)|(eval)|(new Function)|(\<script)|\[|\]/i
const isUnsafeKey = key => sqlWordsPattern.test(key) || jsKeywordsPattern.test(key)

function detectUnsafeKeys(keyName) {
  if (isUnsafeKey(keyName)) throw new Error('Whew, a potentially unsafe input was intercepted.')
  keyName = decodeURIComponent(keyName)
  if (isUnsafeKey(keyName)) throw new Error('Whew, a potentially unsafe encoded input was intercepted.')
  keyName = decodeURIComponent(keyName)
  if (isUnsafeKey(keyName)) throw new Error('Whew, a potentially unsafe encoded input was intercepted.')
}

/*
REFERENCE: https://owasp.org/www-community/OWASP_Validation_Regex_Repository
*/
// const urlPattern = /^((((https?|ftps?|gopher|telnet|nntp)://)|(mailto:|news:))(%[0-9A-Fa-f]{2}|[-()_.!~*';/?:@&=+$,A-Za-z0-9])+)([).!';/?:,][[:blank:|:blank:]])?$/
// const emailPattern = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,9}$/
// const romanNumeralPattern = /^(?i:(?=[MDCLXVI])((M{0,3})((C[DM])|(D?C{0,3}))?((X[LC])|(L?XX{0,2})|L)?((I[VX])|(V?(II{0,2}))|V)?))$/i

// const usZipCode = /^\d{5}(-\d{4})?$/
// const ukPostCodePattern = /^([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)$/
// const germanPostCode = /^[A-Z]{1}( |-)?[1-9]{1}[0-9]{3}$/
// const italyPostCodePattern = /^(V-|I-)?[0-9]{4}$/
// const canadianPostCodePattern = /^[a-zA-Z][0-9][a-zA-Z]\s?[0-9][a-zA-Z][0-9]$/
// const spainPostCodePattern = /^([1-9]{2}|[0-9][1-9]|[1-9][0-9])[0-9]{3}$/
// const frenchPostCodePattern = /^(F-)?((2[A|B])|[0-9]{2})[0-9]{3}$/
// const swedishPostCodePattern = /^(s-|S-){0,1}[0-9]{3}\s?[0-9]{2}$/
// const argentinaPostCodePattern = /^([A-HJ-TP-Z]{1}\d{4}[A-Z]{3}|[a-z]{1}\d{4}[a-hj-tp-z]{3})$/

// const southAfricanPhonePattern = /(^0[78][2347][0-9]{7})/
// const israeliPhonePattern = /^0(5[012345678]|6[47]){1}(\-)?[^0\D]{1}\d{5}$/
// const brazilianPhonePattern = /\(([0-9]{2}|0{1}((x|[0-9]){2}[0-9]{2}))\)\s*[0-9]{3,4}[- ]*[0-9]{4}/

// const usPhonePattern = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/
// const usStatesPattern = /^(AE|AL|AK|AP|AS|AZ|AR|CA|CO|CT|DE|DC|FM|FL|GA|GU|HI|ID|IL|IN|IA|KS|KY|LA|ME|MH|MD|MA|MI|MN|MS|MO|MP|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PW|PA|PR|RI|SC|SD|TN|TX|UT|VT|VI|VA|WA|WV|WI|WY)$/
// const usSocialSecurityPattern = /^\d{3}-\d{2}-\d{4}$/
// const floatingPointPattern = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/
// const ipAddressPattern = /^\b((25[0-5]|2[0-4]\d|[01]\d\d|\d?\d)\.){3}(25[0-5]|2[0-4]\d|[01]\d\d|\d?\d)\b$/

// const domainNameLoosePattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,70}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,9}$/
// /**
//  * Matches: 1:01 AM | 23:52:01 | 03.24.36 AM
//  * Non-Matches: 19:31 AM | 9:9 PM | 25:60:61
//  */
// const timeStringPattern = /^((([0]?[1-9]|1[0-2])(:|\.)[0-5][0-9]((:|\.)[0-5][0-9])?( )?(AM|am|aM|Am|PM|pm|pM|Pm))|(([0]?[0-9]|1[0-9]|2[0-3])(:|\.)[0-5][0-9]((:|\.)[0-5][0-9])?))$/
// /**
//  * Matches:  2099-12-31T23:59:59 | 2002/02/09 16:30:00 | 2000-01-01T00:00:00
//  * Non-Matches:  2000-13-31T00:00:00 | 2002/02/33 24:00:00 | 2000-01-01 60:00:00
//  */
// const sqlDatePattern = /20\d{2}(-|\/)((0[1-9])|(1[0-2]))(-|\/)((0[1-9])|([1-2][0-9])|(3[0-1]))(T|\s)(([0-1][0-9])|(2[0-3])):([0-5][0-9]):([0-5][0-9])/

const boolishPattern = /^([YN]|(TRUE)|(FALSE))$/i
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const objectIdPattern = /^[a-f\d]{24}$/i
// const dateStringPattern = /^(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:0?2(\/|-|\.)29\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0?[1-9])|(?:1[0-2]))(\/|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/
// const dateStringPattern = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/
const dateStringPattern = /^[+-]?(\d{4,10}-((00[1-9]|0[1-9]\d|[12]\d\d|3[0-5]\d|36[0-5])|(0[1-9]|1[0-2])-(0[1-9]|1\d|2[0-8])|(0[13-9]|1[0-2])-(29|30)|(0[13578]|1[02])-31|W(0[1-9]|[1-4]\d|5[0-2])-[1-7]))|((\d{2,8}([13579][26]|[2468][048]|0[48])|(\d{0,6}([13579][26]|[02468][048])00))-(366|02-29))|(\+?\d{0,6}(([02468][048]|[13579][26])([26]0|71|[38]2|[49]3|[05]4|15|[27]6|37|[48]8|[09]9)|([02468][159]|[13579][37])(50|[16]1|[27]2|33|[48]4|[09]5|[15]6|67|[27]8|[38]9)|([02468][26]|[13579][048])([48]0|[09]1|[15]2|63|[27]4|[38]5|[49]6|[05]7|[16]8|29)|([02468][37]|[13579][159])([27]0|[38]1|[49]2|[05]3|[16]4|25|[37]6|87|[049]8|[5]9))|-\d{0,6}(([02468][048]|[13579][26])(0[28]|1[39]|24|3[06]|4[17]|5[28]|6[49]|75|8[06]|9[27])|([02468][159]|[13579][37])(0[49]|15|2[06]|3[27]|4[38]|54|6[05]|7[16]|8[28]|9[39])|([02468][26]|[13579][048])(0[51]|16|2[28]|3[39]|44|5[06]|6[17]|7[28]|8[49]|95)|([02468][37]|[13579][159])(0[17]|1[28]|2[49]|35|4[06]|5[27]|6[38]|74|8[05]|9[16])))-W53-[1-7]/
// const dateStringPattern = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/
//^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.{0,1})(\d{0,})(Z|([\-+])(\d{2})(?::{0,1})(\d{2}))?)?)?)?$/
//^(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/?|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:(?:0?2)(\/?|-|\.)(?:29)\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0?[1-9])|(?:1[0-2]))(\/?|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/gm
const dateStrings = {
  'MMDDYY': /^(?:(?:(?:0?[13578]|1[02])(\/|-|\.)31)\1|(?:(?:0?[1,3-9]|1[0-2])(\/?|-|\.)(?:29|30)\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:(?:0?2)(\/?|-|\.)(?:29)\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:(?:0?[1-9])|(?:1[0-2]))(\/?|-|\.)(?:0?[1-9]|1\d|2[0-8])\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/,
  'YYYY-MM-DD': /^[+-]?(\d{4,10}-((00[1-9]|0[1-9]\d|[12]\d\d|3[0-5]\d|36[0-5])|(0[1-9]|1[0-2])-(0[1-9]|1\d|2[0-8])|(0[13-9]|1[0-2])-(29|30)|(0[13578]|1[02])-31|W(0[1-9]|[1-4]\d|5[0-2])-[1-7]))|((\d{2,8}([13579][26]|[2468][048]|0[48])|(\d{0,6}([13579][26]|[02468][048])00))-(366|02-29))|(\+?\d{0,6}(([02468][048]|[13579][26])([26]0|71|[38]2|[49]3|[05]4|15|[27]6|37|[48]8|[09]9)|([02468][159]|[13579][37])(50|[16]1|[27]2|33|[48]4|[09]5|[15]6|67|[27]8|[38]9)|([02468][26]|[13579][048])([48]0|[09]1|[15]2|63|[27]4|[38]5|[49]6|[05]7|[16]8|29)|([02468][37]|[13579][159])([27]0|[38]1|[49]2|[05]3|[16]4|25|[37]6|87|[049]8|[5]9))|-\d{0,6}(([02468][048]|[13579][26])(0[28]|1[39]|24|3[06]|4[17]|5[28]|6[49]|75|8[06]|9[27])|([02468][159]|[13579][37])(0[49]|15|2[06]|3[27]|4[38]|54|6[05]|7[16]|8[28]|9[39])|([02468][26]|[13579][048])(0[51]|16|2[28]|3[39]|44|5[06]|6[17]|7[28]|8[49]|95)|([02468][37]|[13579][159])(0[17]|1[28]|2[49]|35|4[06]|5[27]|6[38]|74|8[05]|9[16])))-W53-[1-7]$/,

}
const timestampPattern = /^[123]\d{12}$/gm
// const currencyPatternUS = /^\p{Sc}\s?[\d,.]+$/uig
// const currencyPatternEU = /^[\d,.]+\s?\p{Sc}$/uig
const numberishPattern = /^-?[\d.,]+$/
const floatPattern = /\d\.\d/
// const emailPattern = /^[^@]+@[^@]{2,}\.[^@]{2,}[^.]$/
// const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
//^[a-zA-Z0-9_+&*-]{,100}(?:\.[a-zA-Z0-9_+&*-]{,100}){,100}@(?:[a-zA-Z0-9-]{,100}\.){,100}[a-zA-Z]{2,11}$/
// const creditCardPattern = /^((4\d{3})|(5[1-5]\d{2})|(6011)|(7\d{3}))-?\d{4}-?\d{4}-?\d{4}|3[4,7]\d{13}$/

const nullishPattern = /null/i
// const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/igm

function isBoolish (value, fieldName) {
  if (value == null) return false
  value = String(value).trim()
  return value.length <= 6 && boolishPattern.test(String(value))
}

function isUuid (value, fieldName) {
  if (value == null) return false
  value = String(value).trim()
  return value.length < 40 && uuidPattern.test(value)
}
function isObjectId (value, fieldName) {
  if (value == null) return false
  value = String(value).trim()
  return value.length < 40 && objectIdPattern.test(value)
}

function isDateString (value, fieldName) {
  // not bullet-proof, meant to sniff intention in the data
  if (value == null) return false
  if (isDate(value)) return true
  value = String(value).trim()
  return value.length < 30 && dateStringPattern.test(value)
}

function isTimestamp (value) {
  if (value == null) return false
  // value = String(value).trim()
  return timestampPattern.test(value)
}

function isCurrency (value) {
  if (value == null) return false
  value = String(value).trim()
  const valueSymbol = currencies.find(curSymbol => value.indexOf(curSymbol) > -1)
  if (!valueSymbol) return false
  value = value.replace(valueSymbol, '')
  return isNumeric(value)
  // console.log(value, 'currencyPatternUS', currencyPatternUS.test(value), 'currencyPatternEU', currencyPatternEU.test(value));
  // return currencyPatternUS.test(value) || currencyPatternEU.test(value)
}

function isNumeric (value, fieldName) {
  // if (value == null) return false
  value = String(value).trim()
  return value.length < 30 && numberishPattern.test(value)
}

function isFloatish (value) {
  return !!(isNumeric(String(value)) && floatPattern.test(String(value)) && !Number.isInteger(value))
}

function isEmailShaped (value) {
  if (value == null) return false
  value = String(value).trim()
  if (value.includes(' ') || !value.includes('@')) return false
  return value.length >= 5 && value.length < 80 && emailPattern.test(value)
}

function isNullish (value) {
  return value === null || nullishPattern.test(String(value).trim())
}
