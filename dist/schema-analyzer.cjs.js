'use strict';Object.defineProperty(exports,'__esModule',{value:true});var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = ms;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* Active `debug` instances.
	*/
	createDebug.instances = [];

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return match;
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.enabled = createDebug.enabled(namespace);
		debug.useColors = createDebug.useColors();
		debug.color = selectColor(namespace);
		debug.destroy = destroy;
		debug.extend = extend;
		// Debug.formatArgs = formatArgs;
		// debug.rawLog = rawLog;

		// env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		createDebug.instances.push(debug);

		return debug;
	}

	function destroy() {
		const index = createDebug.instances.indexOf(this);
		if (index !== -1) {
			createDebug.instances.splice(index, 1);
			return true;
		}
		return false;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}

		for (i = 0; i < createDebug.instances.length; i++) {
			const instance = createDebug.instances[i];
			instance.enabled = createDebug.enabled(instance.namespace);
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

var common = setup;var browser = createCommonjsModule(function (module, exports) {
/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */
function log(...args) {
	// This hackery is required for IE8/9, where
	// the `console.log` function doesn't have 'apply'
	return typeof console === 'object' &&
		console.log &&
		console.log(...args);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = common(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};
});
var browser_1 = browser.log;
var browser_2 = browser.formatArgs;
var browser_3 = browser.save;
var browser_4 = browser.load;
var browser_5 = browser.useColors;
var browser_6 = browser.storage;
var browser_7 = browser.colors;var lodash_isdate = createCommonjsModule(function (module, exports) {
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** `Object#toString` result references. */
var dateTag = '[object Date]';

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `exports`. */
var freeExports =  exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsDate = nodeUtil && nodeUtil.isDate;

/**
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
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * The base implementation of `_.isDate` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
 */
function baseIsDate(value) {
  return isObjectLike(value) && objectToString.call(value) == dateTag;
}

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
var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;

/**
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
  return !!value && typeof value == 'object';
}

module.exports = isDate;
});const currencies = [
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
  if (lodash_isdate(value)) return true
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
      const { types } = typeInfo;
      let nullishTypeCount = 0;
      if (types.Null) {
        nullishTypeCount += types.Null.count;
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
const log = browser('schema-builder:index');

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
          /*//* @type {FieldInfo} */
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
  
    function nestedSchemaBuilder(nestedData) {
      return Object.entries(nestedData)
      .reduce(async (nestedTypeSummaries, [fullTypeName, data]) => {
        const nameParts = fullTypeName.split('.');
        // @ts-ignore
        const nameSuffix = nameParts[nameParts.length - 1];
        nestedTypeSummaries[fullTypeName] = await schemaBuilder(nameSuffix, data, options);
        return nestedTypeSummaries;
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
            typeFingerprint['$ref'] = `${schemaName}.${fieldName}`;
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
      
      console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName]);
    });
  log('Post-condenseFieldSizes(fields[fieldName])');
  log('Replaced fieldData with fieldSummary');
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

/*//*
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
        aggregateSummary[typeName].typeAlias = pivotedDataByType.$ref ? 'true' : null;
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
  strictMatching,
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
}exports._condenseFieldData=condenseFieldData;exports._formatRangeStats=formatRangeStats;exports._getNumberRangeStats=getNumberRangeStats;exports._pivotFieldDataByType=pivotFieldDataByType;exports.getNumberRangeStats=getNumberRangeStats;exports.isValidDate=isValidDate;exports.pivotFieldDataByType=pivotFieldDataByType;exports.schemaBuilder=schemaBuilder;//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdHlwZS1oZWxwZXJzLmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBBY3RpdmUgYGRlYnVnYCBpbnN0YW5jZXMuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmluc3RhbmNlcyA9IFtdO1xuXG5cdC8qKlxuXHQqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuXHQqL1xuXG5cdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0LyoqXG5cdCogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuXHQqXG5cdCogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuXHQqL1xuXHRjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzID0ge307XG5cblx0LyoqXG5cdCogU2VsZWN0cyBhIGNvbG9yIGZvciBhIGRlYnVnIG5hbWVzcGFjZVxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBzdHJpbmcgZm9yIHRoZSBmb3IgdGhlIGRlYnVnIGluc3RhbmNlIHRvIGJlIGNvbG9yZWRcblx0KiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBBbiBBTlNJIGNvbG9yIGNvZGUgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG5cdFx0bGV0IGhhc2ggPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0aGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcblx0XHR9XG5cblx0XHRyZXR1cm4gY3JlYXRlRGVidWcuY29sb3JzW01hdGguYWJzKGhhc2gpICUgY3JlYXRlRGVidWcuY29sb3JzLmxlbmd0aF07XG5cdH1cblx0Y3JlYXRlRGVidWcuc2VsZWN0Q29sb3IgPSBzZWxlY3RDb2xvcjtcblxuXHQvKipcblx0KiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAcmV0dXJuIHtGdW5jdGlvbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblx0XHRsZXQgcHJldlRpbWU7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHRcdGNvbnN0IGZvcm1hdHRlciA9IGNyZWF0ZURlYnVnLmZvcm1hdHRlcnNbZm9ybWF0XTtcblx0XHRcdFx0aWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCB2YWwgPSBhcmdzW2luZGV4XTtcblx0XHRcdFx0XHRtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cblx0XHRcdFx0XHQvLyBOb3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG5cdFx0XHRcdFx0YXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG5cdFx0XHRjcmVhdGVEZWJ1Zy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cblx0XHRcdGNvbnN0IGxvZ0ZuID0gc2VsZi5sb2cgfHwgY3JlYXRlRGVidWcubG9nO1xuXHRcdFx0bG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0ZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXHRcdGRlYnVnLmVuYWJsZWQgPSBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHQvLyBEZWJ1Zy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcblx0XHQvLyBkZWJ1Zy5yYXdMb2cgPSByYXdMb2c7XG5cblx0XHQvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0XHRjb25zdCBpbmRleCA9IGNyZWF0ZURlYnVnLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuXHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdGNyZWF0ZURlYnVnLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChuYW1lc3BhY2UsIGRlbGltaXRlcikge1xuXHRcdGNvbnN0IG5ld0RlYnVnID0gY3JlYXRlRGVidWcodGhpcy5uYW1lc3BhY2UgKyAodHlwZW9mIGRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnOicgOiBkZWxpbWl0ZXIpICsgbmFtZXNwYWNlKTtcblx0XHRuZXdEZWJ1Zy5sb2cgPSB0aGlzLmxvZztcblx0XHRyZXR1cm4gbmV3RGVidWc7XG5cdH1cblxuXHQvKipcblx0KiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG5cdCogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcblx0XHRjcmVhdGVEZWJ1Zy5zYXZlKG5hbWVzcGFjZXMpO1xuXG5cdFx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0XHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdFx0bGV0IGk7XG5cdFx0Y29uc3Qgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuXHRcdGNvbnN0IGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKCFzcGxpdFtpXSkge1xuXHRcdFx0XHQvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0bmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG5cblx0XHRcdGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBjcmVhdGVEZWJ1Zy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGluc3RhbmNlID0gY3JlYXRlRGVidWcuaW5zdGFuY2VzW2ldO1xuXHRcdFx0aW5zdGFuY2UuZW5hYmxlZCA9IGNyZWF0ZURlYnVnLmVuYWJsZWQoaW5zdGFuY2UubmFtZXNwYWNlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdGNyZWF0ZURlYnVnLmVuYWJsZShjcmVhdGVEZWJ1Zy5sb2FkKCkpO1xuXG5cdHJldHVybiBjcmVhdGVEZWJ1Zztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cDtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG5cdC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG5cdC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG5cdHJldHVybiB0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcgJiZcblx0XHRjb25zb2xlLmxvZyAmJlxuXHRcdGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHByb2Nlc3NgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlUHJvY2VzcyA9IG1vZHVsZUV4cG9ydHMgJiYgZnJlZUdsb2JhbC5wcm9jZXNzO1xuXG4vKiogVXNlZCB0byBhY2Nlc3MgZmFzdGVyIE5vZGUuanMgaGVscGVycy4gKi9cbnZhciBub2RlVXRpbCA9IChmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZnJlZVByb2Nlc3MgJiYgZnJlZVByb2Nlc3MuYmluZGluZygndXRpbCcpO1xuICB9IGNhdGNoIChlKSB7fVxufSgpKTtcblxuLyogTm9kZS5qcyBoZWxwZXIgcmVmZXJlbmNlcy4gKi9cbnZhciBub2RlSXNEYXRlID0gbm9kZVV0aWwgJiYgbm9kZVV0aWwuaXNEYXRlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2FwcGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRGF0ZWAgd2l0aG91dCBOb2RlLmpzIG9wdGltaXphdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNEYXRlKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGRhdGVUYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBEYXRlYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRGF0ZShuZXcgRGF0ZSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0RhdGUoJ01vbiBBcHJpbCAyMyAyMDEyJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNEYXRlID0gbm9kZUlzRGF0ZSA/IGJhc2VVbmFyeShub2RlSXNEYXRlKSA6IGJhc2VJc0RhdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRGF0ZTtcbiIsImltcG9ydCBpc0RhdGUgZnJvbSAnbG9kYXNoLmlzZGF0ZSdcbmV4cG9ydCB7XG4gIGlzQm9vbGlzaCxcbiAgaXNDdXJyZW5jeSxcbiAgaXNEYXRlU3RyaW5nLFxuICBpc0VtYWlsU2hhcGVkLFxuICBpc0Zsb2F0aXNoLFxuICBpc051bGxpc2gsXG4gIGlzTnVtZXJpYyxcbiAgaXNPYmplY3RJZCxcbiAgaXNUaW1lc3RhbXAsXG4gIGlzVXVpZFxufVxuXG5jb25zdCBjdXJyZW5jaWVzID0gW1xuICAnJCcsICfCoicsICfCoycsICfCpCcsICfCpScsICfWjycsICfYiycsICffvicsICffvycsICfgp7InLCAn4KezJywgJ+CnuycsXG4gICfgq7EnLCAn4K+5JywgJ+C4vycsICfhn5snLCAn4oKgJywgJ+KCoScsICfigqInLCAn4oKjJywgJ+KCpCcsICfigqUnLCAn4oKmJywgJ+KCpycsXG4gICfigqgnLCAn4oKpJywgJ+KCqicsICfigqsnLCAn4oKsJywgJ+KCrScsICfigq4nLCAn4oKvJywgJ+KCsCcsICfigrEnLCAn4oKyJywgJ+KCsycsXG4gICfigrQnLCAn4oK1JywgJ+KCticsICfigrcnLCAn4oK4JywgJ+KCuScsICfigronLCAn4oK7JywgJ+KCvCcsICfigr0nLCAn4oK+JywgJ+KCvycsXG4gICfqoLgnLCAn77e8JywgJ++5qScsICfvvIQnLCAn77+gJywgJ++/oScsICfvv6UnLCAn77+mJyxcbiAgJ/CRv50nLCAn8JG/nicsICfwkb+fJywgJ/CRv6AnLCAn8J6LvycsICfwnrKwJ1xuXVxuXG5jb25zdCBib29saXNoUGF0dGVybiA9IC9eKFtZTl18KFRSVUUpfChGQUxTRSkpJC9pXG5jb25zdCB1dWlkUGF0dGVybiA9IC9eWzAtOWEtZkEtRl17OH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17MTJ9JC9cbmNvbnN0IG9iamVjdElkUGF0dGVybiA9IC9eW2EtZlxcZF17MjR9JC9pXG5jb25zdCBkYXRlU3RyaW5nUGF0dGVybiA9IC9eKFsrLV0/XFxkezR9KD8hXFxkezJ9XFxiKSkoKC0/KSgoMFsxLTldfDFbMC0yXSkoXFwzKFsxMl1cXGR8MFsxLTldfDNbMDFdKSk/fFcoWzAtNF1cXGR8NVswLTJdKSgtP1sxLTddKT98KDAwWzEtOV18MFsxLTldXFxkfFsxMl1cXGR7Mn18MyhbMC01XVxcZHw2WzEtNl0pKSkoW1RcXHNdKCgoWzAxXVxcZHwyWzAtM10pKCg6PylbMC01XVxcZCk/fDI0Oj8wMCkoWy4sXVxcZCsoPyE6KSk/KT8oXFwxN1swLTVdXFxkKFsuLF1cXGQrKT8pPyhbelpdfChbKy1dKShbMDFdXFxkfDJbMC0zXSk6PyhbMC01XVxcZCk/KT8pPyk/JC9cbmNvbnN0IHRpbWVzdGFtcFBhdHRlcm4gPSAvXlsxMl1cXGR7MTJ9JC9cbi8vIGNvbnN0IGN1cnJlbmN5UGF0dGVyblVTID0gL15cXHB7U2N9XFxzP1tcXGQsLl0rJC91aWdcbi8vIGNvbnN0IGN1cnJlbmN5UGF0dGVybkVVID0gL15bXFxkLC5dK1xccz9cXHB7U2N9JC91aWdcbmNvbnN0IG51bWJlcmlzaFBhdHRlcm4gPSAvXi0/W1xcZC4sXSskL1xuY29uc3QgZmxvYXRQYXR0ZXJuID0gL1xcZFxcLlxcZC9cbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eW15AXStAW15AXXsyLH1cXC5bXkBdezIsfVteLl0kL1xuY29uc3QgZW1haWxQYXR0ZXJuID0gL15cXHcrKFsuLV0/XFx3KykqQFxcdysoWy4tXT9cXHcrKSooXFwuXFx3ezIsM30pKyQvXG5jb25zdCBudWxsaXNoUGF0dGVybiA9IC9udWxsL2lcbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC9pZ21cblxuZnVuY3Rpb24gaXNCb29saXNoICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDw9IDYgJiYgYm9vbGlzaFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc1V1aWQgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCA0MCAmJiB1dWlkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuZnVuY3Rpb24gaXNPYmplY3RJZCAodmFsdWUsIGZpZWxkTmFtZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDQwICYmIG9iamVjdElkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0RhdGVTdHJpbmcgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gbm90IGJ1bGxldC1wcm9vZiwgbWVhbnQgdG8gc25pZmYgaW50ZW50aW9uIGluIHRoZSBkYXRhXG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHJldHVybiB0cnVlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIGRhdGVTdHJpbmdQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzVGltZXN0YW1wICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHRpbWVzdGFtcFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNDdXJyZW5jeSAodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGNvbnN0IHZhbHVlU3ltYm9sID0gY3VycmVuY2llcy5maW5kKChjdXJTeW1ib2wpID0+IHZhbHVlLmluZGV4T2YoY3VyU3ltYm9sKSA+IC0xKVxuICBpZiAoIXZhbHVlU3ltYm9sKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHZhbHVlU3ltYm9sLCAnJylcbiAgcmV0dXJuIGlzTnVtZXJpYyh2YWx1ZSlcbiAgLy8gY29uc29sZS5sb2codmFsdWUsICdjdXJyZW5jeVBhdHRlcm5VUycsIGN1cnJlbmN5UGF0dGVyblVTLnRlc3QodmFsdWUpLCAnY3VycmVuY3lQYXR0ZXJuRVUnLCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKSk7XG4gIC8vIHJldHVybiBjdXJyZW5jeVBhdHRlcm5VUy50ZXN0KHZhbHVlKSB8fCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc051bWVyaWMgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCAzMCAmJiBudW1iZXJpc2hQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzRmxvYXRpc2ggKHZhbHVlKSB7XG4gIHJldHVybiAhIShpc051bWVyaWMoU3RyaW5nKHZhbHVlKSkgJiYgZmxvYXRQYXR0ZXJuLnRlc3QoU3RyaW5nKHZhbHVlKSkgJiYgIU51bWJlci5pc0ludGVnZXIodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc0VtYWlsU2hhcGVkICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgaWYgKHZhbHVlLmluY2x1ZGVzKCcgJykgfHwgIXZhbHVlLmluY2x1ZGVzKCdAJykpIHJldHVybiBmYWxzZVxuICByZXR1cm4gdmFsdWUubGVuZ3RoID49IDUgJiYgdmFsdWUubGVuZ3RoIDwgODAgJiYgZW1haWxQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzTnVsbGlzaCAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IG51bGxpc2hQYXR0ZXJuLnRlc3QoU3RyaW5nKHZhbHVlKS50cmltKCkpXG59XG4iLCJpbXBvcnQge1xuICBpc0Jvb2xpc2gsXG4gIGlzQ3VycmVuY3ksXG4gIGlzRGF0ZVN0cmluZyxcbiAgaXNFbWFpbFNoYXBlZCxcbiAgaXNGbG9hdGlzaCxcbiAgaXNOdWxsaXNoLFxuICBpc051bWVyaWMsXG4gIGlzT2JqZWN0SWQsXG4gIGlzVGltZXN0YW1wLFxuICBpc1V1aWRcbn0gZnJvbSAnLi91dGlscy90eXBlLWRldGVjdG9ycy5qcydcblxuY29uc3QgaGFzTGVhZGluZ1plcm8gPSAvXjArL1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgVHlwZU5hbWUuXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgLSBpbnB1dCBkYXRhXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmZ1bmN0aW9uIGRldGVjdFR5cGVzICh2YWx1ZSwgc3RyaWN0TWF0Y2hpbmcgPSB0cnVlKSB7XG4gIGNvbnN0IGV4Y2x1ZGVkVHlwZXMgPSBbXVxuICBjb25zdCBtYXRjaGVkVHlwZXMgPSBwcmlvcml0aXplZFR5cGVzLnJlZHVjZSgodHlwZXMsIHR5cGVIZWxwZXIpID0+IHtcbiAgICBpZiAodHlwZUhlbHBlci5jaGVjayh2YWx1ZSkpIHtcbiAgICAgIGlmICh0eXBlSGVscGVyLnN1cGVyY2VkZXMpIGV4Y2x1ZGVkVHlwZXMucHVzaCguLi50eXBlSGVscGVyLnN1cGVyY2VkZXMpXG4gICAgICB0eXBlcy5wdXNoKHR5cGVIZWxwZXIudHlwZSlcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVzXG4gIH0sIFtdKVxuICByZXR1cm4gIXN0cmljdE1hdGNoaW5nID8gbWF0Y2hlZFR5cGVzIDogbWF0Y2hlZFR5cGVzLmZpbHRlcigodHlwZSkgPT4gZXhjbHVkZWRUeXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSlcbn1cblxuLyoqXG4gKiBNZXRhQ2hlY2tzIGFyZSB1c2VkIHRvIGFuYWx5emUgdGhlIGludGVybWVkaWF0ZSByZXN1bHRzLCBhZnRlciB0aGUgQmFzaWMgKGRpc2NyZWV0KSB0eXBlIGNoZWNrcyBhcmUgY29tcGxldGUuXG4gKiBUaGV5IGhhdmUgYWNjZXNzIHRvIGFsbCB0aGUgZGF0YSBwb2ludHMgYmVmb3JlIGl0IGlzIGZpbmFsbHkgcHJvY2Vzc2VkLlxuICovXG5jb25zdCBNZXRhQ2hlY2tzID0ge1xuICBUWVBFX0VOVU06IHtcbiAgICB0eXBlOiAnZW51bScsXG4gICAgbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgZW51bUFic29sdXRlTGltaXQsIGVudW1QZXJjZW50VGhyZXNob2xkIH0pID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgdW5pcXVlbmVzcyB1c2luZyBBTEwgdW5pcXVlcyBjb21iaW5lZCBmcm9tIEFMTCB0eXBlcywgdGhpcyBvbmx5IHNlZXMgY29uc2lzdGVudGx5IHR5cGVkIGRhdGFcbiAgICAgIC8vIGNvbnN0IHVuaXF1ZW5lc3MgPSByb3dDb3VudCAvIHVuaXF1ZXMubGVuZ3RoXG4gICAgICBjb25zdCByZWxhdGl2ZUVudW1MaW1pdCA9IE1hdGgubWluKHBhcnNlSW50KFN0cmluZyhyb3dDb3VudCAqIGVudW1QZXJjZW50VGhyZXNob2xkKSwgMTApLCBlbnVtQWJzb2x1dGVMaW1pdClcbiAgICAgIGlmICh1bmlxdWVzLmxlbmd0aCA+IHJlbGF0aXZlRW51bUxpbWl0KSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIGNvbnN0IGVudW1MaW1pdCA9IHVuaXF1ZW5lc3MgPCBlbnVtQWJzb2x1dGVMaW1pdCAmJiByZWxhdGl2ZUVudW1MaW1pdCA8IGVudW1BYnNvbHV0ZUxpbWl0XG4gICAgICAvLyAgID8gZW51bUFic29sdXRlTGltaXRcbiAgICAgIC8vICAgOiByZWxhdGl2ZUVudW1MaW1pdFxuXG4gICAgICByZXR1cm4geyBlbnVtOiB1bmlxdWVzLCAuLi50eXBlSW5mbyB9XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfSxcbiAgVFlQRV9OVUxMQUJMRToge1xuICAgIHR5cGU6ICdudWxsYWJsZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgbnVsbGFibGVSb3dzVGhyZXNob2xkIH0pID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICBjb25zdCB7IHR5cGVzIH0gPSB0eXBlSW5mb1xuICAgICAgbGV0IG51bGxpc2hUeXBlQ291bnQgPSAwXG4gICAgICBpZiAodHlwZXMuTnVsbCkge1xuICAgICAgICBudWxsaXNoVHlwZUNvdW50ICs9IHR5cGVzLk51bGwuY291bnRcbiAgICAgIH1cbiAgICAgIC8vIGlmICh0eXBlcy5Vbmtub3duKSB7XG4gICAgICAvLyAgIG51bGxpc2hUeXBlQ291bnQgKz0gdHlwZXMuVW5rbm93bi5jb3VudFxuICAgICAgLy8gfVxuICAgICAgY29uc3QgbnVsbExpbWl0ID0gcm93Q291bnQgKiBudWxsYWJsZVJvd3NUaHJlc2hvbGRcbiAgICAgIGNvbnN0IGlzTm90TnVsbGFibGUgPSBudWxsaXNoVHlwZUNvdW50IDw9IG51bGxMaW1pdFxuICAgICAgLy8gVE9ETzogTG9vayBpbnRvIHNwZWNpZmljYWxseSBjaGVja2luZyAnTnVsbCcgb3IgJ1Vua25vd24nIHR5cGUgc3RhdHNcbiAgICAgIHJldHVybiB7IG51bGxhYmxlOiAhaXNOb3ROdWxsYWJsZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH0sXG4gIFRZUEVfVU5JUVVFOiB7XG4gICAgdHlwZTogJ3VuaXF1ZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgdW5pcXVlUm93c1RocmVzaG9sZCB9KSA9PiB7XG4gICAgICBpZiAoIXVuaXF1ZXMgfHwgdW5pcXVlcy5sZW5ndGggPT09IDApIHJldHVybiB0eXBlSW5mb1xuICAgICAgLy8gY29uc3QgdW5pcXVlbmVzcyA9IHJvd0NvdW50IC8gdW5pcXVlcy5sZW5ndGhcbiAgICAgIGNvbnN0IGlzVW5pcXVlID0gdW5pcXVlcy5sZW5ndGggPT09IChyb3dDb3VudCAqIHVuaXF1ZVJvd3NUaHJlc2hvbGQpXG4gICAgICAvLyBUT0RPOiBMb29rIGludG8gc3BlY2lmaWNhbGx5IGNoZWNraW5nICdOdWxsJyBvciAnVW5rbm93bicgdHlwZSBzdGF0c1xuICAgICAgcmV0dXJuIHsgdW5pcXVlOiBpc1VuaXF1ZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gcmV0dXJuIHt1bmlxdWU6IHVuaXF1ZW5lc3MgPj0gdW5pcXVlUm93c1RocmVzaG9sZCwgLi4udHlwZUluZm99XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfVxufVxuXG4vLyBCYXNpYyBUeXBlIEZpbHRlcnMgLSBydWRpbWVudGFyeSBkYXRhIHNuaWZmaW5nIHVzZWQgdG8gdGFsbHkgdXAgXCJ2b3Rlc1wiIGZvciBhIGdpdmVuIGZpZWxkXG4vKipcbiAqIERldGVjdCBhbWJpZ3VvdXMgZmllbGQgdHlwZS5cbiAqIFdpbGwgbm90IGFmZmVjdCB3ZWlnaHRlZCBmaWVsZCBhbmFseXNpcy5cbiAqL1xuY29uc3QgVFlQRV9VTktOT1dOID0ge1xuICB0eXBlOiAnVW5rbm93bicsXG4gIGNoZWNrOiAodmFsdWUpID0+IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICd1bmRlZmluZWQnXG59XG5jb25zdCBUWVBFX09CSkVDVF9JRCA9IHtcbiAgdHlwZTogJ09iamVjdElkJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzT2JqZWN0SWRcbn1cbmNvbnN0IFRZUEVfVVVJRCA9IHtcbiAgdHlwZTogJ1VVSUQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZyddLFxuICBjaGVjazogaXNVdWlkXG59XG5jb25zdCBUWVBFX0JPT0xFQU4gPSB7XG4gIHR5cGU6ICdCb29sZWFuJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzQm9vbGlzaFxufVxuY29uc3QgVFlQRV9EQVRFID0ge1xuICB0eXBlOiAnRGF0ZScsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ10sXG4gIGNoZWNrOiBpc0RhdGVTdHJpbmdcbn1cbmNvbnN0IFRZUEVfVElNRVNUQU1QID0ge1xuICB0eXBlOiAnVGltZXN0YW1wJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc1RpbWVzdGFtcFxufVxuY29uc3QgVFlQRV9DVVJSRU5DWSA9IHtcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc0N1cnJlbmN5XG59XG5jb25zdCBUWVBFX0ZMT0FUID0ge1xuICB0eXBlOiAnRmxvYXQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgY2hlY2s6IGlzRmxvYXRpc2hcbn1cbmNvbnN0IFRZUEVfTlVNQkVSID0ge1xuICB0eXBlOiAnTnVtYmVyJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIGlmIChoYXNMZWFkaW5nWmVyby50ZXN0KFN0cmluZyh2YWx1ZSkpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gISEodmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIChOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBpc051bWVyaWModmFsdWUpKSlcbiAgfVxufVxuY29uc3QgVFlQRV9FTUFJTCA9IHtcbiAgdHlwZTogJ0VtYWlsJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzRW1haWxTaGFwZWRcbn1cbmNvbnN0IFRZUEVfU1RSSU5HID0ge1xuICB0eXBlOiAnU3RyaW5nJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAvLyAmJiB2YWx1ZS5sZW5ndGggPj0gMVxufVxuY29uc3QgVFlQRV9BUlJBWSA9IHtcbiAgdHlwZTogJ0FycmF5JyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICB9XG59XG5jb25zdCBUWVBFX09CSkVDVCA9IHtcbiAgdHlwZTogJ09iamVjdCcsXG4gIGNoZWNrOiAodmFsdWUpID0+IHtcbiAgICByZXR1cm4gIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuICB9XG59XG5jb25zdCBUWVBFX05VTEwgPSB7XG4gIHR5cGU6ICdOdWxsJyxcbiAgY2hlY2s6IGlzTnVsbGlzaFxufVxuXG5jb25zdCBwcmlvcml0aXplZFR5cGVzID0gW1xuICBUWVBFX1VOS05PV04sXG4gIFRZUEVfT0JKRUNUX0lELFxuICBUWVBFX1VVSUQsXG4gIFRZUEVfQk9PTEVBTixcbiAgVFlQRV9EQVRFLFxuICBUWVBFX1RJTUVTVEFNUCxcbiAgVFlQRV9DVVJSRU5DWSxcbiAgVFlQRV9GTE9BVCxcbiAgVFlQRV9OVU1CRVIsXG4gIFRZUEVfTlVMTCxcbiAgVFlQRV9FTUFJTCxcbiAgVFlQRV9TVFJJTkcsXG4gIFRZUEVfQVJSQVksXG4gIFRZUEVfT0JKRUNUXG5dXG5cbi8qKlxuICogVHlwZSBSYW5rIE1hcDogVXNlIHRvIHNvcnQgTG93ZXN0IHRvIEhpZ2hlc3RcbiAqL1xuY29uc3QgdHlwZVJhbmtpbmdzID0ge1xuICBbVFlQRV9VTktOT1dOLnR5cGVdOiAtMSxcbiAgW1RZUEVfT0JKRUNUX0lELnR5cGVdOiAxLFxuICBbVFlQRV9VVUlELnR5cGVdOiAyLFxuICBbVFlQRV9CT09MRUFOLnR5cGVdOiAzLFxuICBbVFlQRV9EQVRFLnR5cGVdOiA0LFxuICBbVFlQRV9USU1FU1RBTVAudHlwZV06IDUsXG4gIFtUWVBFX0NVUlJFTkNZLnR5cGVdOiA2LFxuICBbVFlQRV9GTE9BVC50eXBlXTogNyxcbiAgW1RZUEVfTlVNQkVSLnR5cGVdOiA4LFxuICBbVFlQRV9OVUxMLnR5cGVdOiAxMCxcbiAgW1RZUEVfRU1BSUwudHlwZV06IDExLFxuICBbVFlQRV9TVFJJTkcudHlwZV06IDEyLFxuICBbVFlQRV9BUlJBWS50eXBlXTogMTMsXG4gIFtUWVBFX09CSkVDVC50eXBlXTogMTRcbn1cblxuZXhwb3J0IHtcbiAgdHlwZVJhbmtpbmdzLFxuICBwcmlvcml0aXplZFR5cGVzLFxuICBkZXRlY3RUeXBlcyxcbiAgTWV0YUNoZWNrcyxcbiAgVFlQRV9VTktOT1dOLFxuICBUWVBFX09CSkVDVF9JRCxcbiAgVFlQRV9VVUlELFxuICBUWVBFX0JPT0xFQU4sXG4gIFRZUEVfREFURSxcbiAgVFlQRV9USU1FU1RBTVAsXG4gIFRZUEVfQ1VSUkVOQ1ksXG4gIFRZUEVfRkxPQVQsXG4gIFRZUEVfTlVNQkVSLFxuICBUWVBFX05VTEwsXG4gIFRZUEVfRU1BSUwsXG4gIFRZUEVfU1RSSU5HLFxuICBUWVBFX0FSUkFZLFxuICBUWVBFX09CSkVDVFxufVxuLy8gY29uc3QgVFlQRV9FTlVNID0ge1xuLy8gICB0eXBlOiBcIlN0cmluZ1wiLFxuLy8gICBjaGVjazogKHZhbHVlLCBmaWVsZEluZm8sIHNjaGVtYUluZm8pID0+IHtcbi8vICAgICAvLyBUaHJlc2hvbGQgc2V0IHRvIDUlIC0gNSAob3IgZmV3ZXIpIG91dCBvZiAxMDAgdW5pcXVlIHN0cmluZ3Mgc2hvdWxkIGVuYWJsZSAnZW51bScgbW9kZVxuLy8gICAgIGlmIChzY2hlbWFJbmZvLmlucHV0Um93Q291bnQgPCAxMDApIHJldHVybiBmYWxzZTsgLy8gZGlzYWJsZWQgaWYgc2V0IHRvbyBzbWFsbFxuLy8gICB9XG4vLyB9O1xuIiwiaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuLy8gaW1wb3J0IEZQIGZyb20gJ2Z1bmN0aW9uYWwtcHJvbWlzZXMnO1xuLy8gaW1wb3J0IHsgZGV0ZWN0VHlwZXMgfSBmcm9tICcuL3R5cGUtaGVscGVycy5qcydcbi8vIGltcG9ydCBTdGF0c01hcCBmcm9tICdzdGF0cy1tYXAnO1xuLy8gaW1wb3J0IG1lbSBmcm9tICdtZW0nO1xuaW1wb3J0IHsgZGV0ZWN0VHlwZXMsIE1ldGFDaGVja3MsIHR5cGVSYW5raW5ncyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzLmpzJ1xuY29uc3QgbG9nID0gZGVidWcoJ3NjaGVtYS1idWlsZGVyOmluZGV4Jylcbi8vIGNvbnN0IGNhY2hlID0gbmV3IFN0YXRzTWFwKCk7XG4vLyBjb25zdCBkZXRlY3RUeXBlc0NhY2hlZCA9IG1lbShfZGV0ZWN0VHlwZXMsIHsgY2FjaGUsIG1heEFnZTogMTAwMCAqIDYwMCB9KSAvLyBrZWVwIGNhY2hlIHVwIHRvIDEwIG1pbnV0ZXNcblxuZXhwb3J0IHsgc2NoZW1hQnVpbGRlciwgcGl2b3RGaWVsZERhdGFCeVR5cGUsIGdldE51bWJlclJhbmdlU3RhdHMsIGlzVmFsaWREYXRlIH1cblxuZnVuY3Rpb24gaXNWYWxpZERhdGUgKGRhdGUpIHtcbiAgZGF0ZSA9IGRhdGUgaW5zdGFuY2VvZiBEYXRlID8gZGF0ZSA6IG5ldyBEYXRlKGRhdGUpXG4gIHJldHVybiBpc05hTihkYXRlLmdldEZ1bGxZZWFyKCkpID8gZmFsc2UgOiBkYXRlXG59XG5cbmNvbnN0IHBhcnNlRGF0ZSA9IChkYXRlKSA9PiB7XG4gIGRhdGUgPSBpc1ZhbGlkRGF0ZShkYXRlKVxuICByZXR1cm4gZGF0ZSAmJiBkYXRlLnRvSVNPU3RyaW5nICYmIGRhdGUudG9JU09TdHJpbmcoKVxufVxuXG4vKipcbiAqIEluY2x1ZGVzIHRoZSByZXN1bHRzIG9mIG1haW4gdG9wLWxldmVsIHNjaGVtYS5cbiAqIEB0eXBlZGVmIFR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7e1xuICogIGZpZWxkczogT2JqZWN0LjxzdHJpbmcsIEZpZWxkSW5mbz47IFxuICogIHRvdGFsUm93czogbnVtYmVyO1xuICogIG5lc3RlZFR5cGVzPzogT2JqZWN0LjxzdHJpbmcsIFR5cGVTdW1tYXJ5PjsgXG4gKiB9fVxuICovXG5cbi8qKlxuICogRGVzY3JpYmVzIG9uZSBvciBtb3JlIHBvdGVudGlhbCB0eXBlcyBkaXNjb3ZlcmVkIGZvciBhIGZpZWxkLiBUaGUgYHR5cGVzYCBvYmplY3Qgd2lsbCBoYXZlIGEgYCRyZWZgIGtleSBpZiBhbnkgbmVzdGVkIHN0cnVjdHVyZXMgd2VyZSBmb3VuZC5cbiAqIEB0eXBlZGVmIEZpZWxkSW5mb1xuICogQHR5cGUge29iamVjdH1cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0LjxzdHJpbmcsIHN0cmluZyB8IEZpZWxkVHlwZVN1bW1hcnk+fSB0eXBlcyAtIGZpZWxkIHN0YXRzIG9yZ2FuaXplZCBieSB0eXBlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IG51bGxhYmxlIC0gaXMgdGhlIGZpZWxkIG51bGxhYmxlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHVuaXF1ZSAtIGlzIHRoZSBmaWVsZCB1bmlxdWVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW118bnVtYmVyW119IFtlbnVtXSAtIGVudW1lcmF0aW9uIGRldGVjdGVkLCB0aGUgdmFsdWVzIGFyZSBsaXN0ZWQgb24gdGhpcyBwcm9wZXJ0eS5cbiAqLyBcblxuLyoqXG4gKiBDb250YWlucyBzdGF0cyBmb3IgYSBnaXZlbiBmaWVsZCdzIChwb3RlbnRpYWwpIHR5cGUuXG4gKiBcbiAqIFRPRE86IEFkZCBzdHJpbmcgcHJvcGVydHkgZm9yIHRoZSB0eXBlIG5hbWUuXG4gKiAgICBXZSBjdXJyZW50bHkgdXNlcyBvYmplY3Qga2V5IHN0cnVjdHVyZToge1wiU3RyaW5nXCI6IEZpZWxkVHlwZVN1bW1hcnl9XG4gKiBAdHlwZWRlZiBGaWVsZFR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0eXBlQWxpYXNdIC0gZm9yIG5lc3RlZCB0eXBlIHN1cHBvcnQuXG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFt2YWx1ZV0gLSBleHRyYWN0ZWQgZmllbGQgdmFsdWVzLCBwbGFjZWQgaW50byBhbiBhcnJheS4gVGhpcyBzaW1wbGlmaWVzIChhdCBleHBlbnNlIG9mIG1lbW9yeSkgdHlwZSBhbmFseXNpcyBhbmQgc3VtbWFyaXphdGlvbiB3aGVuIGNyZWF0aW5nIHRoZSBgQWdncmVnYXRlU3VtbWFyeWAuXG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFtsZW5ndGhdIC0gc3VtbWFyeSBvZiBhcnJheSBvZiBzdHJpbmcgKG9yIGRlY2ltYWwpIHNpemVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3ByZWNpc2lvbl0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIFN1bW1hcnkgb2YgYXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGJvdGggYmVmb3JlIGFuZCBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3NjYWxlXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gU3VtbWFyeSBvZiBhcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYWZ0ZXIgdGhlIGRlY2ltYWwuXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfG51bWJlcltdfSBbZW51bV0gLSBpZiBlbnVtIHJ1bGVzIHdlcmUgdHJpZ2dlcmVkIHdpbGwgY29udGFpbiB0aGUgZGV0ZWN0ZWQgdW5pcXVlIHZhbHVlcy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjb3VudCAtIG51bWJlciBvZiB0aW1lcyB0aGUgdHlwZSB3YXMgbWF0Y2hlZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHJhbmsgLSBhYnNvbHV0ZSBwcmlvcml0eSBvZiB0aGUgZGV0ZWN0ZWQgVHlwZU5hbWUsIGRlZmluZWQgaW4gdGhlIG9iamVjdCBgdHlwZVJhbmtpbmdzYFxuICovXG5cbi8qKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcm1lZGlhdGUgc3RydWN0dXJlLlxuICogSXQgbWlycm9ycyB0aGUgYEZpZWxkU3VtbWFyeWAgdHlwZSBpdCB3aWxsIGJlY29tZS5cbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiBJbnRlcm5hbEZpZWxkVHlwZURhdGFcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJvcGVydHkge2FueVtdfSBbdmFsdWVdIC0gYXJyYXkgb2YgdmFsdWVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtsZW5ndGhdIC0gYXJyYXkgb2Ygc3RyaW5nIChvciBkZWNpbWFsKSBzaXplcywgcHJlIHByb2Nlc3NpbmcgaW50byBhbiBBZ2dyZWdhdGVTdW1tYXJ5XG4gKiBAcHJvcGVydHkge251bWJlcltdfSBbcHJlY2lzaW9uXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gQXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGJvdGggYmVmb3JlIGFuZCBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtzY2FsZV0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIEFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbY291bnRdIC0gbnVtYmVyIG9mIHRpbWVzIHRoZSB0eXBlIHdhcyBtYXRjaGVkXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3JhbmtdIC0gYWJzb2x1dGUgcHJpb3JpdHkgb2YgdGhlIGRldGVjdGVkIFR5cGVOYW1lLCBkZWZpbmVkIGluIHRoZSBvYmplY3QgYHR5cGVSYW5raW5nc2BcbiAqXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIHJlcHJlc2VudCBhIG51bWJlciBzZXJpZXMgb2YgYW55IHNpemUuXG4gKiBJbmNsdWRlcyB0aGUgbG93ZXN0IChgbWluYCksIGhpZ2hlc3QgKGBtYXhgKSwgbWVhbi9hdmVyYWdlIChgbWVhbmApIGFuZCBtZWFzdXJlbWVudHMgYXQgY2VydGFpbiBgcGVyY2VudGlsZXNgLlxuICogQHR5cGVkZWYgQWdncmVnYXRlU3VtbWFyeVxuICogQHR5cGUge3ttaW46IG51bWJlciwgbWF4OiBudW1iZXIsIG1lYW46IG51bWJlciwgcDI1OiBudW1iZXIsIHAzMzogbnVtYmVyLCBwNTA6IG51bWJlciwgcDY2OiBudW1iZXIsIHA3NTogbnVtYmVyLCBwOTk6IG51bWJlcn19XG4gKi9cblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIGlzIGRpc3BsYXllZCBhcyBhIGdsb2JhbCBtZW1iZXIuXG4gKiBAY2FsbGJhY2sgcHJvZ3Jlc3NDYWxsYmFja1xuICogQHBhcmFtIHt7dG90YWxSb3dzOiBudW1iZXIsIGN1cnJlbnRSb3c6IG51bWJlcn19IHByb2dyZXNzIC0gVGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgcHJvY2Vzc2luZy5cbiAqL1xuXG4vKipcbiAqIHNjaGVtYUJ1aWxkZXIoKSBpcyB0aGUgbWFpbiBmdW5jdGlvbiBhbmQgd2hlcmUgYWxsIHRoZSBhbmFseXNpcyAmIHByb2Nlc3NpbmcgaGFwcGVucy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWFOYW1lIFRoZSBuYW1lLCBvciBuYW1lIHByZWZpeCB0byB1c2Ugd2hlbiBhc3NlbWJsaW5nIHJlc3VsdHMuIEhlbHBmdWwgd2l0aCBuZXN0ZWQgdHlwZXMgKGFrYSBzdWItdHlwZXMuKVxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBpbnB1dCAtIFRoZSBpbnB1dCBkYXRhIHRvIGFuYWx5emUuIE11c3QgYmUgYW4gYXJyYXkgb2Ygb2JqZWN0cy5cbiAqIEBwYXJhbSB7eyBcbiAqICAgb25Qcm9ncmVzcz86IHByb2dyZXNzQ2FsbGJhY2ssIFxuICogICBlbnVtTWluaW11bVJvd0NvdW50PzogbnVtYmVyLCBcbiAqICAgZW51bUFic29sdXRlTGltaXQ/OiBudW1iZXIsIFxuICogICBlbnVtUGVyY2VudFRocmVzaG9sZD86IG51bWJlciwgXG4gKiAgIG51bGxhYmxlUm93c1RocmVzaG9sZD86IG51bWJlciwgXG4gKiAgIHVuaXF1ZVJvd3NUaHJlc2hvbGQ/OiBudW1iZXIsIFxuICogICBzdHJpY3RNYXRjaGluZz86IGJvb2xlYW4sXG4gKiAgIGRpc2FibGVOZXN0ZWRUeXBlcz86IGJvb2xlYW5cbiAqIH19IFtvcHRpb25zXSAtIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPFR5cGVTdW1tYXJ5Pn0gUmV0dXJucyBhbmRcbiAqL1xuZnVuY3Rpb24gc2NoZW1hQnVpbGRlciAoXG4gIHNjaGVtYU5hbWUsXG4gIGlucHV0LFxuICBvcHRpb25zID0ge1xuICAgIG9uUHJvZ3Jlc3M6ICh7IHRvdGFsUm93cywgY3VycmVudFJvdyB9KSA9PiB7fSxcbiAgICBzdHJpY3RNYXRjaGluZzogdHJ1ZSxcbiAgICBkaXNhYmxlTmVzdGVkVHlwZXM6IGZhbHNlLFxuICAgIGVudW1NaW5pbXVtUm93Q291bnQ6IDEwMCxcbiAgICBlbnVtQWJzb2x1dGVMaW1pdDogMTAsXG4gICAgZW51bVBlcmNlbnRUaHJlc2hvbGQ6IDAuMDEsXG4gICAgbnVsbGFibGVSb3dzVGhyZXNob2xkOiAwLjAyLFxuICAgIHVuaXF1ZVJvd3NUaHJlc2hvbGQ6IDEuMFxuICB9XG4pIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGlucHV0KSB8fCB0eXBlb2YgaW5wdXQgIT09ICdvYmplY3QnKSB0aHJvdyBFcnJvcignSW5wdXQgRGF0YSBtdXN0IGJlIGFuIEFycmF5IG9mIE9iamVjdHMnKVxuICBpZiAodHlwZW9mIGlucHV0WzBdICE9PSAnb2JqZWN0JykgdGhyb3cgRXJyb3IoJ0lucHV0IERhdGEgbXVzdCBiZSBhbiBBcnJheSBvZiBPYmplY3RzJylcbiAgaWYgKGlucHV0Lmxlbmd0aCA8IDUpIHRocm93IEVycm9yKCdBbmFseXNpcyByZXF1aXJlcyBhdCBsZWFzdCA1IHJlY29yZHMuIChVc2UgMjAwKyBmb3IgZ3JlYXQgcmVzdWx0cy4pJylcbiAgY29uc3Qge1xuICAgIG9uUHJvZ3Jlc3MgPSAoeyB0b3RhbFJvd3MsIGN1cnJlbnRSb3cgfSkgPT4ge30sXG4gICAgc3RyaWN0TWF0Y2hpbmcgPSB0cnVlLFxuICAgIGRpc2FibGVOZXN0ZWRUeXBlcyA9IGZhbHNlLFxuICAgIGVudW1NaW5pbXVtUm93Q291bnQgPSAxMDAsIGVudW1BYnNvbHV0ZUxpbWl0ID0gMTAsIGVudW1QZXJjZW50VGhyZXNob2xkID0gMC4wMSxcbiAgICBudWxsYWJsZVJvd3NUaHJlc2hvbGQgPSAwLjAyLFxuICAgIHVuaXF1ZVJvd3NUaHJlc2hvbGQgPSAxLjBcbiAgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGlzRW51bUVuYWJsZWQgPSBpbnB1dC5sZW5ndGggPj0gZW51bU1pbmltdW1Sb3dDb3VudFxuICBjb25zdCBuZXN0ZWREYXRhID0ge31cblxuICBsb2coJ1N0YXJ0aW5nJylcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnB1dClcbiAgICAudGhlbihwaXZvdFJvd3NHcm91cGVkQnlUeXBlKVxuICAgIC50aGVuKGNvbmRlbnNlRmllbGREYXRhKVxuICAgIC50aGVuKGFzeW5jIChzY2hlbWEpID0+IHtcbiAgICAgIGxvZygnQnVpbHQgc3VtbWFyeSBmcm9tIEZpZWxkIFR5cGUgZGF0YS4nKVxuICAgICAgLy8gY29uc29sZS5sb2coJ2dlblNjaGVtYScsIEpTT04uc3RyaW5naWZ5KGdlblNjaGVtYSwgbnVsbCwgMikpXG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5rZXlzKHNjaGVtYS5maWVsZHMpXG4gICAgICAgIC5yZWR1Y2UoKGZpZWxkSW5mbywgZmllbGROYW1lKSA9PiB7XG4gICAgICAgICAgY29uc3QgdHlwZXNJbmZvID0gc2NoZW1hLmZpZWxkc1tmaWVsZE5hbWVdXG4gICAgICAgICAgLyovLyogQHR5cGUge0ZpZWxkSW5mb30gKi9cbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IHtcbiAgICAgICAgICAgIC4uLnR5cGVzSW5mb1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IE1ldGFDaGVja3MuVFlQRV9FTlVNLmNoZWNrKGZpZWxkSW5mb1tmaWVsZE5hbWVdLFxuICAgICAgICAgICAgeyByb3dDb3VudDogaW5wdXQubGVuZ3RoLCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIH0sXG4gICAgICAgICAgICB7IGVudW1BYnNvbHV0ZUxpbWl0LCBlbnVtUGVyY2VudFRocmVzaG9sZCB9KVxuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0gTWV0YUNoZWNrcy5UWVBFX05VTExBQkxFLmNoZWNrKGZpZWxkSW5mb1tmaWVsZE5hbWVdLFxuICAgICAgICAgICAgeyByb3dDb3VudDogaW5wdXQubGVuZ3RoLCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIH0sXG4gICAgICAgICAgICB7IG51bGxhYmxlUm93c1RocmVzaG9sZCB9KVxuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0gTWV0YUNoZWNrcy5UWVBFX1VOSVFVRS5jaGVjayhmaWVsZEluZm9bZmllbGROYW1lXSxcbiAgICAgICAgICAgIHsgcm93Q291bnQ6IGlucHV0Lmxlbmd0aCwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMgJiYgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB9LFxuICAgICAgICAgICAgeyB1bmlxdWVSb3dzVGhyZXNob2xkIH0pXG4gICAgICAgICAgLy8gdHlwZXNJbmZvLiRyZWZcbiAgICAgICAgICBjb25zdCBpc0lkZW50aXR5ID0gKHR5cGVzSW5mby5OdW1iZXIgfHwgdHlwZXNJbmZvLlVVSUQpICYmIGZpZWxkSW5mb1tmaWVsZE5hbWVdLnVuaXF1ZSAmJiAvaWQkL2kudGVzdChmaWVsZE5hbWUpXG4gICAgICAgICAgaWYgKGlzSWRlbnRpdHkpIHtcbiAgICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdLmlkZW50aXR5ID0gdHJ1ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXS51bmlxdWVDb3VudCA9IHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0ubGVuZ3RoXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmaWVsZEluZm9cbiAgICAgICAgfSwge30pXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkcyxcbiAgICAgICAgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzLFxuICAgICAgICBuZXN0ZWRUeXBlczogZGlzYWJsZU5lc3RlZFR5cGVzID8gdW5kZWZpbmVkIDogYXdhaXQgbmVzdGVkU2NoZW1hQnVpbGRlcihuZXN0ZWREYXRhKVxuICAgICAgfVxuICAgIH0pXG4gIFxuICAgIGZ1bmN0aW9uIG5lc3RlZFNjaGVtYUJ1aWxkZXIobmVzdGVkRGF0YSkge1xuICAgICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKG5lc3RlZERhdGEpXG4gICAgICAucmVkdWNlKGFzeW5jIChuZXN0ZWRUeXBlU3VtbWFyaWVzLCBbZnVsbFR5cGVOYW1lLCBkYXRhXSkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lUGFydHMgPSBmdWxsVHlwZU5hbWUuc3BsaXQoJy4nKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCBuYW1lU3VmZml4ID0gbmFtZVBhcnRzW25hbWVQYXJ0cy5sZW5ndGggLSAxXTtcbiAgICAgICAgbmVzdGVkVHlwZVN1bW1hcmllc1tmdWxsVHlwZU5hbWVdID0gYXdhaXQgc2NoZW1hQnVpbGRlcihuYW1lU3VmZml4LCBkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIG5lc3RlZFR5cGVTdW1tYXJpZXM7XG4gICAgICB9LCB7fSlcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdFtdfSBkb2NzXG4gICAgICogQHJldHVybnMge3sgdG90YWxSb3dzOiBudW1iZXI7IHVuaXF1ZXM6IHsgW3g6IHN0cmluZ106IGFueVtdOyB9OyBmaWVsZHNEYXRhOiB7IFt4OiBzdHJpbmddOiBJbnRlcm5hbEZpZWxkVHlwZURhdGFbXTsgfTsgfX0gc2NoZW1hXG4gICAgICovXG4gICAgZnVuY3Rpb24gcGl2b3RSb3dzR3JvdXBlZEJ5VHlwZSAoZG9jcykge1xuICAgICAgY29uc3QgZGV0ZWN0ZWRTY2hlbWEgPSB7IHVuaXF1ZXM6IGlzRW51bUVuYWJsZWQgPyB7fSA6IG51bGwsIGZpZWxkc0RhdGE6IHt9LCB0b3RhbFJvd3M6IG51bGwgfVxuICAgICAgbG9nKGAgIEFib3V0IHRvIGV4YW1pbmUgZXZlcnkgcm93ICYgY2VsbC4gRm91bmQgJHtkb2NzLmxlbmd0aH0gcmVjb3Jkcy4uLmApXG4gICAgICBjb25zdCBwaXZvdGVkU2NoZW1hID0gZG9jcy5yZWR1Y2UoZXZhbHVhdGVTY2hlbWFMZXZlbCwgZGV0ZWN0ZWRTY2hlbWEpXG4gICAgICBsb2coJyAgRXh0cmFjdGVkIGRhdGEgcG9pbnRzIGZyb20gRmllbGQgVHlwZSBhbmFseXNpcycpXG4gICAgICByZXR1cm4gcGl2b3RlZFNjaGVtYVxuICAgIH1cbiAgXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHt7IHRvdGFsUm93czogbnVtYmVyOyB1bmlxdWVzOiB7IFt4OiBzdHJpbmddOiBhbnlbXTsgfTsgZmllbGRzRGF0YTogeyBbeDogc3RyaW5nXTogSW50ZXJuYWxGaWVsZFR5cGVEYXRhW107IH07IH19IHNjaGVtYVxuICAgICAqIEBwYXJhbSB7eyBbeDogc3RyaW5nXTogYW55OyB9fSByb3dcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcGFyYW0ge2FueVtdfSBhcnJheVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV2YWx1YXRlU2NoZW1hTGV2ZWwgKHNjaGVtYSwgcm93LCBpbmRleCwgYXJyYXkpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgc2NoZW1hLnRvdGFsUm93cyA9IHNjaGVtYS50b3RhbFJvd3MgfHwgYXJyYXkubGVuZ3RoXG4gICAgICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMocm93KVxuICAgICAgbG9nKGBQcm9jZXNzaW5nIFJvdyAjICR7aW5kZXggKyAxfS8ke3NjaGVtYS50b3RhbFJvd3N9Li4uYClcbiAgICAgIGZpZWxkTmFtZXMuZm9yRWFjaCgoZmllbGROYW1lLCBpbmRleCwgYXJyYXkpID0+IHtcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSBsb2coYEZvdW5kICR7YXJyYXkubGVuZ3RofSBDb2x1bW4ocykhYClcbiAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbZmllbGROYW1lXTtcbiAgICAgICAgY29uc3QgdHlwZUZpbmdlcnByaW50ID0gZ2V0RmllbGRNZXRhZGF0YSh7IHZhbHVlLCBzdHJpY3RNYXRjaGluZyB9KTtcbiAgICAgICAgY29uc3QgdHlwZU5hbWVzID0gT2JqZWN0LmtleXModHlwZUZpbmdlcnByaW50KVxuICAgICAgICBjb25zdCBpc1Bvc3NpYmxlRW51bVR5cGUgPSB0eXBlTmFtZXMuaW5jbHVkZXMoJ051bWJlcicpIHx8IHR5cGVOYW1lcy5pbmNsdWRlcygnU3RyaW5nJylcbiAgXG4gICAgICAgIGlmICghZGlzYWJsZU5lc3RlZFR5cGVzKSB7XG4gICAgICAgICAgLy8gVE9ETzogUmV2aWV3IGhhY2tleSBwYXR0ZXJuIGhlcmUgKGJ1ZmZlcnMgdG9vIG11Y2gsIGJldHRlciBhc3NvY2lhdGlvbiBvZiBjdXN0b20gdHlwZXMsIHNlZSBgJHJlZmApXG4gICAgICAgICAgLy8gU3RlcHM6IDEuIENoZWNrIGlmIEFycmF5IG9mIE9iamVjdHMsIDIuIEFkZCB0byBsb2NhbCBgbmVzdGVkRGF0YWAgdG8gaG9sZCBkYXRhIGZvciBwb3N0LXByb2Nlc3NpbmcuXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+PSAxICYmIHR5cGVvZiB2YWx1ZVswXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG5lc3RlZERhdGFbYCR7c2NoZW1hTmFtZX0uJHtmaWVsZE5hbWV9YF0gPSBuZXN0ZWREYXRhW2Ake3NjaGVtYU5hbWV9LiR7ZmllbGROYW1lfWBdIHx8IFtdO1xuICAgICAgICAgICAgbmVzdGVkRGF0YVtgJHtzY2hlbWFOYW1lfS4ke2ZpZWxkTmFtZX1gXS5wdXNoKC4uLnZhbHVlKTtcbiAgICAgICAgICAgIHR5cGVGaW5nZXJwcmludFsnJHJlZiddID0gYCR7c2NoZW1hTmFtZX0uJHtmaWVsZE5hbWV9YFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0VudW1FbmFibGVkICYmIGlzUG9zc2libGVFbnVtVHlwZSkge1xuICAgICAgICAgIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gPSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIHx8IFtdXG4gICAgICAgICAgaWYgKCFzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdLmluY2x1ZGVzKHZhbHVlKSkgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5wdXNoKHJvd1tmaWVsZE5hbWVdKVxuICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgLy8gICBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdID0gbnVsbFxuICAgICAgICB9XG4gICAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gPSBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdIHx8IFtdXG4gICAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0ucHVzaCh0eXBlRmluZ2VycHJpbnQpXG4gICAgICB9KVxuICAgICAgb25Qcm9ncmVzcyh7IHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cywgY3VycmVudFJvdzogaW5kZXggKyAxIH0pXG4gICAgICByZXR1cm4gc2NoZW1hXG4gICAgfVxuXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGZpZWxkTmFtZSBrZXllZC1vYmplY3Qgd2l0aCB0eXBlIGRldGVjdGlvbiBzdW1tYXJ5IGRhdGEuXG4gKiAgXG4gKiAjIyMgRXhhbXBsZSBgZmllbGRTdW1tYXJ5YDpcbiAqIGBgYFxuICoge1xuICogIFwiaWRcIjoge1xuICogICAgXCJVVUlEXCI6IHtcbiAqICAgICAgXCJyYW5rXCI6IDIsXG4gKiAgICAgIFwiY291bnRcIjogMjVcbiAqICAgIH0sXG4gKiAgICBcIk51bWJlclwiOiB7XG4gKiAgICAgIFwicmFua1wiOiA4LFxuICogICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgIFwidmFsdWVcIjoge1xuICogICAgICAgIFwibWluXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJtZWFuXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJtYXhcIjogOTk5OTk5OSxcbiAqICAgICAgICBcInAyNVwiOiA5OTk5OTk5LFxuICogICAgICAgIFwicDMzXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJwNTBcIjogOTk5OTk5OSxcbiAqICAgICAgICBcInA2NlwiOiA5OTk5OTk5LFxuICogICAgICAgIFwicDc1XCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJwOTlcIjogOTk5OTk5OVxuICogICAgICB9XG4gKiAgICB9XG4gKiAgfVxuICogfVxuICogYGBgXG4gKiBcbiAqIEBwYXJhbSB7eyBmaWVsZHNEYXRhOiBPYmplY3QuPHN0cmluZywgSW50ZXJuYWxGaWVsZFR5cGVEYXRhW10+LCB1bmlxdWVzOiBPYmplY3QuPHN0cmluZywgYW55W10+LCB0b3RhbFJvd3M6IG51bWJlcn19IHNjaGVtYVxuICogQHJldHVybnMge3sgXG4gKiAgZmllbGRzOiBPYmplY3QuPHN0cmluZywgT2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN1bW1hcnk+PixcbiAqICB1bmlxdWVzOiBPYmplY3QuPHN0cmluZywgYW55W10+LFxuICogIHRvdGFsUm93czogbnVtYmVyXG4gKiB9fVxuICovXG5mdW5jdGlvbiBjb25kZW5zZUZpZWxkRGF0YSAoc2NoZW1hKSB7XG4gIGNvbnN0IHsgZmllbGRzRGF0YSB9ID0gc2NoZW1hXG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhmaWVsZHNEYXRhKVxuXG4gIC8qKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIE9iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pj59ICovXG4gIGNvbnN0IGZpZWxkU3VtbWFyeSA9IHt9XG4gIGxvZyhgUHJlLWNvbmRlbnNlRmllbGRTaXplcyhmaWVsZHNbZmllbGROYW1lXSkgZm9yICR7ZmllbGROYW1lcy5sZW5ndGh9IGNvbHVtbnNgKVxuICBmaWVsZE5hbWVzXG4gICAgLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgLyoqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgSW50ZXJuYWxGaWVsZFR5cGVEYXRhPn0gKi9cbiAgICAgIGNvbnN0IHBpdm90ZWREYXRhID0gcGl2b3RGaWVsZERhdGFCeVR5cGUoZmllbGRzRGF0YVtmaWVsZE5hbWVdKVxuICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0gPSBjb25kZW5zZUZpZWxkU2l6ZXMocGl2b3RlZERhdGEpO1xuICAgICAgaWYgKHBpdm90ZWREYXRhLiRyZWYgJiYgcGl2b3RlZERhdGEuJHJlZi5jb3VudCA+IDEpIHtcbiAgICAgICAgLy8gUHJldmVudCBvdmVycmlkaW5nIHRoZSAkcmVmIHR5cGUgbGFiZWxcbiAgICAgICAgLy8gMS4gRmluZCB0aGUgZmlyc3QgJHJlZlxuICAgICAgICBjb25zdCByZWZUeXBlID0gZmllbGRzRGF0YVtmaWVsZE5hbWVdLmZpbmQodHlwZVJlZnMgPT4gdHlwZVJlZnMuJHJlZilcbiAgICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0uJHJlZi50eXBlQWxpYXMgPSByZWZUeXBlLiRyZWY7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBmaWVsZFN1bW1hcnlbJHtmaWVsZE5hbWV9XWAsIGZpZWxkU3VtbWFyeVtmaWVsZE5hbWVdKVxuICAgIH0pXG4gIGxvZygnUG9zdC1jb25kZW5zZUZpZWxkU2l6ZXMoZmllbGRzW2ZpZWxkTmFtZV0pJylcbiAgbG9nKCdSZXBsYWNlZCBmaWVsZERhdGEgd2l0aCBmaWVsZFN1bW1hcnknKVxuICByZXR1cm4geyBmaWVsZHM6IGZpZWxkU3VtbWFyeSwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMsIHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cyB9XG59XG5cbi8qLy8qXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCB7IHZhbHVlPywgbGVuZ3RoPywgc2NhbGU/LCBwcmVjaXNpb24/LCBpbnZhbGlkPyB9PltdfSB0eXBlU2l6ZURhdGEgLSBBbiBvYmplY3QgY29udGFpbmluZyB0aGVcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywgSW50ZXJuYWxGaWVsZFR5cGVEYXRhPn1cbiAqL1xuZnVuY3Rpb24gcGl2b3RGaWVsZERhdGFCeVR5cGUgKHR5cGVTaXplRGF0YSkge1xuICAvLyBjb25zdCBibGFua1R5cGVTdW1zID0gKCkgPT4gKHsgbGVuZ3RoOiAwLCBzY2FsZTogMCwgcHJlY2lzaW9uOiAwIH0pXG4gIGxvZyhgUHJvY2Vzc2luZyAke3R5cGVTaXplRGF0YS5sZW5ndGh9IHR5cGUgZ3Vlc3Nlc2ApXG4gIHJldHVybiB0eXBlU2l6ZURhdGEucmVkdWNlKChwaXZvdGVkRGF0YSwgY3VycmVudFR5cGVHdWVzc2VzKSA9PiB7XG4gICAgT2JqZWN0LmVudHJpZXMoY3VycmVudFR5cGVHdWVzc2VzKVxuICAgICAgLm1hcCgoW3R5cGVOYW1lLCB7IHZhbHVlLCBsZW5ndGgsIHNjYWxlLCBwcmVjaXNpb24gfV0pID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHR5cGVOYW1lLCBKU09OLnN0cmluZ2lmeSh7IGxlbmd0aCwgc2NhbGUsIHByZWNpc2lvbiB9KSlcbiAgICAgICAgcGl2b3RlZERhdGFbdHlwZU5hbWVdID0gcGl2b3RlZERhdGFbdHlwZU5hbWVdIHx8IHsgdHlwZU5hbWUsIGNvdW50OiAwIH1cbiAgICAgICAgLy8gaWYgKCFwaXZvdGVkRGF0YVt0eXBlTmFtZV0uY291bnQpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCA9IDBcbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShsZW5ndGgpICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0ubGVuZ3RoKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ubGVuZ3RoID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShzY2FsZSkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5zY2FsZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShwcmVjaXNpb24pICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucHJlY2lzaW9uKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucHJlY2lzaW9uID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS52YWx1ZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlID0gW11cblxuICAgICAgICBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uY291bnQrK1xuICAgICAgICAvLyBpZiAoaW52YWxpZCAhPSBudWxsKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uaW52YWxpZCsrXG4gICAgICAgIGlmIChsZW5ndGgpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGgucHVzaChsZW5ndGgpXG4gICAgICAgIGlmIChzY2FsZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlLnB1c2goc2NhbGUpXG4gICAgICAgIGlmIChwcmVjaXNpb24pIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24ucHVzaChwcmVjaXNpb24pXG4gICAgICAgIGlmICh2YWx1ZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlLnB1c2godmFsdWUpXG4gICAgICAgIC8vIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5yYW5rID0gdHlwZVJhbmtpbmdzW3R5cGVOYW1lXVxuICAgICAgICByZXR1cm4gcGl2b3RlZERhdGFbdHlwZU5hbWVdXG4gICAgICB9KVxuICAgIHJldHVybiBwaXZvdGVkRGF0YVxuICB9LCB7fSlcbiAgLypcbiAgPiBFeGFtcGxlIG9mIHN1bUNvdW50cyBhdCB0aGlzIHBvaW50XG4gIHtcbiAgICBGbG9hdDogeyBjb3VudDogNCwgc2NhbGU6IFsgNSwgNSwgNSwgNSBdLCBwcmVjaXNpb246IFsgMiwgMiwgMiwgMiBdIH0sXG4gICAgU3RyaW5nOiB7IGNvdW50OiAzLCBsZW5ndGg6IFsgMiwgMywgNiBdIH0sXG4gICAgTnVtYmVyOiB7IGNvdW50OiAxLCBsZW5ndGg6IFsgNiBdIH1cbiAgfVxuKi9cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB3aGljaCBhbmFseXplcyBhbmQgc3VtbWFyaXplcyBlYWNoIGNvbHVtbnMgZGF0YSBieSB0eXBlLiBTb3J0IG9mIGEgaGlzdG9ncmFtIG9mIHNpZ25pZmljYW50IHBvaW50cy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBJbnRlcm5hbEZpZWxkVHlwZURhdGE+fSBwaXZvdGVkRGF0YUJ5VHlwZSAtIGEgbWFwIG9yZ2FuaXplZCBieSBUeXBlIGtleXMgKGBUeXBlTmFtZWApLCBjb250YWluaW5nIGV4dHJhY3RlZCBkYXRhIGZvciB0aGUgcmV0dXJuZWQgYEZpZWxkU3VtbWFyeWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN1bW1hcnk+fSAtIFRoZSBmaW5hbCBvdXRwdXQsIHdpdGggaGlzdG9ncmFtcyBvZiBzaWduaWZpY2FudCBwb2ludHNcbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZFNpemVzIChwaXZvdGVkRGF0YUJ5VHlwZSkge1xuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gKi9cbiAgY29uc3QgYWdncmVnYXRlU3VtbWFyeSA9IHt9XG4gIGxvZygnU3RhcnRpbmcgY29uZGVuc2VGaWVsZFNpemVzKCknKVxuICBPYmplY3Qua2V5cyhwaXZvdGVkRGF0YUJ5VHlwZSlcbiAgICAubWFwKCh0eXBlTmFtZSkgPT4ge1xuICAgICAgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0gPSB7XG4gICAgICAgIC8vIHR5cGVOYW1lLFxuICAgICAgICByYW5rOiB0eXBlUmFua2luZ3NbdHlwZU5hbWVdIHx8IC00MixcbiAgICAgICAgY291bnQ6IHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5jb3VudFxuICAgICAgfVxuICAgICAgaWYgKHR5cGVOYW1lID09PSAnJHJlZicpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Bpdm90ZWREYXRhQnlUeXBlLiRyZWYnLCBKU09OLnN0cmluZ2lmeShwaXZvdGVkRGF0YUJ5VHlwZS4kcmVmLCBudWxsLCAyKSk7XG4gICAgICAgIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnR5cGVBbGlhcyA9IHBpdm90ZWREYXRhQnlUeXBlLiRyZWYgPyAndHJ1ZScgOiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS52YWx1ZSkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0udmFsdWUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS52YWx1ZSlcbiAgICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5sZW5ndGgpIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLmxlbmd0aCA9IGdldE51bWJlclJhbmdlU3RhdHMocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmxlbmd0aCwgdHJ1ZSlcbiAgICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uc2NhbGUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSwgdHJ1ZSlcbiAgICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5wcmVjaXNpb24pIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnByZWNpc2lvbiA9IGdldE51bWJlclJhbmdlU3RhdHMocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnByZWNpc2lvbiwgdHJ1ZSlcbiAgICAgIH1cblxuXG4gICAgICAvLyBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmludmFsaWQpIHsgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uaW52YWxpZCA9IHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5pbnZhbGlkIH1cblxuICAgICAgaWYgKFsnVGltZXN0YW1wJywgJ0RhdGUnXS5pbmRleE9mKHR5cGVOYW1lKSA+IC0xKSB7XG4gICAgICAgIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlID0gZm9ybWF0UmFuZ2VTdGF0cyhhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS52YWx1ZSwgcGFyc2VEYXRlKVxuICAgICAgfVxuICAgIH0pXG4gIGxvZygnRG9uZSBjb25kZW5zZUZpZWxkU2l6ZXMoKS4uLicpXG4gIHJldHVybiBhZ2dyZWdhdGVTdW1tYXJ5XG59XG5cbmZ1bmN0aW9uIGdldEZpZWxkTWV0YWRhdGEgKHtcbiAgdmFsdWUsXG4gIHN0cmljdE1hdGNoaW5nLFxufSkge1xuICAvLyBHZXQgaW5pdGlhbCBwYXNzIGF0IHRoZSBkYXRhIHdpdGggdGhlIFRZUEVfKiBgLmNoZWNrKClgIG1ldGhvZHMuXG4gIGNvbnN0IHR5cGVHdWVzc2VzID0gZGV0ZWN0VHlwZXModmFsdWUsIHN0cmljdE1hdGNoaW5nKVxuXG4gIC8vIEFzc2lnbiBpbml0aWFsIG1ldGFkYXRhIGZvciBlYWNoIG1hdGNoZWQgdHlwZSBiZWxvd1xuICByZXR1cm4gdHlwZUd1ZXNzZXMucmVkdWNlKChhbmFseXNpcywgdHlwZUd1ZXNzLCByYW5rKSA9PiB7XG4gICAgbGV0IGxlbmd0aFxuICAgIGxldCBwcmVjaXNpb25cbiAgICBsZXQgc2NhbGVcblxuICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IHJhbms6IHJhbmsgKyAxIH1cblxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdBcnJheScpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aFxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgbGVuZ3RoIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0Zsb2F0Jykge1xuICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKVxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgdmFsdWUgfVxuICAgICAgY29uc3Qgc2lnbmlmaWNhbmRBbmRNYW50aXNzYSA9IFN0cmluZyh2YWx1ZSkuc3BsaXQoJy4nKVxuICAgICAgaWYgKHNpZ25pZmljYW5kQW5kTWFudGlzc2EubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHByZWNpc2lvbiA9IHNpZ25pZmljYW5kQW5kTWFudGlzc2Euam9pbignJykubGVuZ3RoIC8vIHRvdGFsICMgb2YgbnVtZXJpYyBwb3NpdGlvbnMgYmVmb3JlICYgYWZ0ZXIgZGVjaW1hbFxuICAgICAgICBzY2FsZSA9IHNpZ25pZmljYW5kQW5kTWFudGlzc2FbMV0ubGVuZ3RoXG4gICAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHByZWNpc2lvbiwgc2NhbGUgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnTnVtYmVyJykge1xuICAgICAgdmFsdWUgPSBOdW1iZXIodmFsdWUpXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZSB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdEYXRlJyB8fCB0eXBlR3Vlc3MgPT09ICdUaW1lc3RhbXAnKSB7XG4gICAgICBjb25zdCBjaGVja2VkRGF0ZSA9IGlzVmFsaWREYXRlKHZhbHVlKVxuICAgICAgaWYgKGNoZWNrZWREYXRlKSB7XG4gICAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHZhbHVlOiBjaGVja2VkRGF0ZS5nZXRUaW1lKCkgfVxuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgaW52YWxpZDogdHJ1ZSwgdmFsdWU6IHZhbHVlIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ1N0cmluZycgfHwgdHlwZUd1ZXNzID09PSAnRW1haWwnKSB7XG4gICAgICBsZW5ndGggPSBTdHJpbmcodmFsdWUpLmxlbmd0aFxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgbGVuZ3RoIH1cbiAgICB9XG4gICAgcmV0dXJuIGFuYWx5c2lzXG4gIH0sIHt9KVxufVxuXG4vKipcbiAqIEFjY2VwdHMgYW4gYXJyYXkgb2YgbnVtYmVycyBhbmQgcmV0dXJucyBzdW1tYXJ5IGRhdGEgYWJvdXRcbiAqICB0aGUgcmFuZ2UgJiBzcHJlYWQgb2YgcG9pbnRzIGluIHRoZSBzZXQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJbXX0gbnVtYmVycyAtIHNlcXVlbmNlIG9mIHVuc29ydGVkIGRhdGEgcG9pbnRzXG4gKiBAcmV0dXJucyB7QWdncmVnYXRlU3VtbWFyeX1cbiAqL1xuZnVuY3Rpb24gZ2V0TnVtYmVyUmFuZ2VTdGF0cyAobnVtYmVycywgdXNlU29ydGVkRGF0YUZvclBlcmNlbnRpbGVzID0gZmFsc2UpIHtcbiAgaWYgKCFudW1iZXJzIHx8IG51bWJlcnMubGVuZ3RoIDwgMSkgcmV0dXJuIHVuZGVmaW5lZFxuICBjb25zdCBzb3J0ZWROdW1iZXJzID0gbnVtYmVycy5zbGljZSgpLnNvcnQoKGEsIGIpID0+IGEgPCBiID8gLTEgOiBhID09PSBiID8gMCA6IDEpXG4gIGNvbnN0IHN1bSA9IG51bWJlcnMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMClcbiAgaWYgKHVzZVNvcnRlZERhdGFGb3JQZXJjZW50aWxlcykgbnVtYmVycyA9IHNvcnRlZE51bWJlcnNcbiAgcmV0dXJuIHtcbiAgICAvLyBzaXplOiBudW1iZXJzLmxlbmd0aCxcbiAgICBtaW46IHNvcnRlZE51bWJlcnNbMF0sXG4gICAgbWVhbjogc3VtIC8gbnVtYmVycy5sZW5ndGgsXG4gICAgbWF4OiBzb3J0ZWROdW1iZXJzW251bWJlcnMubGVuZ3RoIC0gMV0sXG4gICAgcDI1OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuMjUpLCAxMCldLFxuICAgIHAzMzogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjMzKSwgMTApXSxcbiAgICBwNTA6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC41MCksIDEwKV0sXG4gICAgcDY2OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuNjYpLCAxMCldLFxuICAgIHA3NTogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjc1KSwgMTApXSxcbiAgICBwOTk6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC45OSksIDEwKV1cbiAgfVxufVxuXG4vKipcbiAqXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFJhbmdlU3RhdHMgKHN0YXRzLCBmb3JtYXR0ZXIpIHtcbiAgLy8gaWYgKCFzdGF0cyB8fCAhZm9ybWF0dGVyKSByZXR1cm4gdW5kZWZpbmVkXG4gIHJldHVybiB7XG4gICAgLy8gc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICBtaW46IGZvcm1hdHRlcihzdGF0cy5taW4pLFxuICAgIG1lYW46IGZvcm1hdHRlcihzdGF0cy5tZWFuKSxcbiAgICBtYXg6IGZvcm1hdHRlcihzdGF0cy5tYXgpLFxuICAgIHAyNTogZm9ybWF0dGVyKHN0YXRzLnAyNSksXG4gICAgcDMzOiBmb3JtYXR0ZXIoc3RhdHMucDMzKSxcbiAgICBwNTA6IGZvcm1hdHRlcihzdGF0cy5wNTApLFxuICAgIHA2NjogZm9ybWF0dGVyKHN0YXRzLnA2NiksXG4gICAgcDc1OiBmb3JtYXR0ZXIoc3RhdHMucDc1KSxcbiAgICBwOTk6IGZvcm1hdHRlcihzdGF0cy5wOTkpXG4gIH1cbn1cblxuZXhwb3J0IHsgXG4gIC8vIHBpdm90Um93c0dyb3VwZWRCeVR5cGUgYXMgX3Bpdm90Um93c0dyb3VwZWRCeVR5cGUsXG4gIC8vIGV2YWx1YXRlU2NoZW1hTGV2ZWwgYXMgX2V2YWx1YXRlU2NoZW1hTGV2ZWwsXG4gIGNvbmRlbnNlRmllbGREYXRhIGFzIF9jb25kZW5zZUZpZWxkRGF0YSxcbiAgcGl2b3RGaWVsZERhdGFCeVR5cGUgYXMgX3Bpdm90RmllbGREYXRhQnlUeXBlLFxuICBnZXROdW1iZXJSYW5nZVN0YXRzIGFzIF9nZXROdW1iZXJSYW5nZVN0YXRzLFxuICBmb3JtYXRSYW5nZVN0YXRzIGFzIF9mb3JtYXRSYW5nZVN0YXRzLFxufSJdLCJuYW1lcyI6WyJyZXF1aXJlJCQwIiwiZ2xvYmFsIiwiaXNEYXRlIiwiZGVidWciXSwibWFwcGluZ3MiOiI7Ozs7Q0FBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQWMsR0FBRyxTQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUU7QUFDeEMsRUFBRSxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUMxQixFQUFFLElBQUksSUFBSSxHQUFHLE9BQU8sR0FBRyxDQUFDO0FBQ3hCLEVBQUUsSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzNDLElBQUksT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEIsR0FBRyxNQUFNLElBQUksSUFBSSxLQUFLLFFBQVEsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDakQsSUFBSSxPQUFPLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2RCxHQUFHO0FB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RSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQyxHQUFHO0FBQ0gsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQyxHQUFHO0FBQ0gsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQyxHQUFHO0FBQ0gsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQyxHQUFHO0FBQ0gsRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNyQixFQUFFLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2QyxHQUFHO0FBQ0gsRUFBRSxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7QUFDbEIsSUFBSSxPQUFPLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN4QyxHQUFHO0FBQ0gsRUFBRSxJQUFJLEtBQUssSUFB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QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsU0FBUyxHQUFHO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLENBQUMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxVQUFVLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2SCxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsRUFBRTtBQUNGO0FBQ0E7QUFDQSxDQUFDLElBQUksT0FBTyxTQUFTLEtBQUssV0FB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sR0FBRyxVQUFVLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUM3QixFQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLENBQUM7QUFDN0MsQ0FBQztBQUNEO0FBQ0EsY0FBYyxHQUFHLE1BQU07R0N4R3ZCLE1BQU0sVUFBVSxHQUFHO0FBQ25CLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVB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QUMsQ0FBQztBQUMxQyxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxHQUFHO0FBQ0gsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQzdDO0FBQ0EsRUFBRSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztBQUMvQixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixHQUFHO0FBQ0gsQ0FBQyJ9
