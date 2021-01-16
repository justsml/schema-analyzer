(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?f(exports):typeof define==='function'&&define.amd?define(['exports'],f):(g=g||self,f(g.schemaAnalyzer={}));}(this,(function(exports){'use strict';var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

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
      let nullishTypeCount = 0;
      if (typeInfo && typeInfo.types && typeInfo.types.Null) console.warn('Unexpected type info structure! (.types. key!)');

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

      console.log(`fieldSummary[${fieldName}]`, fieldSummary[fieldName]);
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
}exports._condenseFieldData=condenseFieldData;exports._formatRangeStats=formatRangeStats;exports._getNumberRangeStats=getNumberRangeStats;exports._pivotFieldDataByType=pivotFieldDataByType;exports.getNumberRangeStats=getNumberRangeStats;exports.isValidDate=isValidDate;exports.pivotFieldDataByType=pivotFieldDataByType;exports.schemaBuilder=schemaBuilder;Object.defineProperty(exports,'__esModule',{value:true});})));//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdHlwZS1oZWxwZXJzLm1qcyIsIi4uL2luZGV4Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHcgPSBkICogNztcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUodmFsKSkge1xuICAgIHJldHVybiBvcHRpb25zLmxvbmcgPyBmbXRMb25nKHZhbCkgOiBmbXRTaG9ydCh2YWwpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG1hdGNoID0gL14oLT8oPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHdlZWtzP3x3fHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICd3ZWVrcyc6XG4gICAgY2FzZSAnd2Vlayc6XG4gICAgY2FzZSAndyc6XG4gICAgICByZXR1cm4gbiAqIHc7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaHJzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAnc2Vjcyc6XG4gICAgY2FzZSAnc2VjJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogcztcbiAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgIGNhc2UgJ21pbGxpc2Vjb25kJzpcbiAgICBjYXNlICdtc2Vjcyc6XG4gICAgY2FzZSAnbXNlYyc6XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICB2YXIgbXNBYnMgPSBNYXRoLmFicyhtcyk7XG4gIGlmIChtc0FicyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXNBYnMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtc0FicyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICB2YXIgbXNBYnMgPSBNYXRoLmFicyhtcyk7XG4gIGlmIChtc0FicyA+PSBkKSB7XG4gICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIGQsICdkYXknKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gaCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBoLCAnaG91cicpO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIHBsdXJhbChtcywgbXNBYnMsIG0sICdtaW51dGUnKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBzLCAnc2Vjb25kJyk7XG4gIH1cbiAgcmV0dXJuIG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBtc0FicywgbiwgbmFtZSkge1xuICB2YXIgaXNQbHVyYWwgPSBtc0FicyA+PSBuICogMS41O1xuICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG4pICsgJyAnICsgbmFtZSArIChpc1BsdXJhbCA/ICdzJyA6ICcnKTtcbn1cbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICovXG5cbmZ1bmN0aW9uIHNldHVwKGVudikge1xuXHRjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5kZWZhdWx0ID0gY3JlYXRlRGVidWc7XG5cdGNyZWF0ZURlYnVnLmNvZXJjZSA9IGNvZXJjZTtcblx0Y3JlYXRlRGVidWcuZGlzYWJsZSA9IGRpc2FibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZSA9IGVuYWJsZTtcblx0Y3JlYXRlRGVidWcuZW5hYmxlZCA9IGVuYWJsZWQ7XG5cdGNyZWF0ZURlYnVnLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuXHRPYmplY3Qua2V5cyhlbnYpLmZvckVhY2goa2V5ID0+IHtcblx0XHRjcmVhdGVEZWJ1Z1trZXldID0gZW52W2tleV07XG5cdH0pO1xuXG5cdC8qKlxuXHQqIEFjdGl2ZSBgZGVidWdgIGluc3RhbmNlcy5cblx0Ki9cblx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzID0gW107XG5cblx0LyoqXG5cdCogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG5cdCovXG5cblx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0Y3JlYXRlRGVidWcuc2tpcHMgPSBbXTtcblxuXHQvKipcblx0KiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG5cdCpcblx0KiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmZvcm1hdHRlcnMgPSB7fTtcblxuXHQvKipcblx0KiBTZWxlY3RzIGEgY29sb3IgZm9yIGEgZGVidWcgbmFtZXNwYWNlXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHN0cmluZyBmb3IgdGhlIGZvciB0aGUgZGVidWcgaW5zdGFuY2UgdG8gYmUgY29sb3JlZFxuXHQqIEByZXR1cm4ge051bWJlcnxTdHJpbmd9IEFuIEFOU0kgY29sb3IgY29kZSBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcblx0XHRsZXQgaGFzaCA9IDA7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzcGFjZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuXHRcdH1cblxuXHRcdHJldHVybiBjcmVhdGVEZWJ1Zy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBjcmVhdGVEZWJ1Zy5jb2xvcnMubGVuZ3RoXTtcblx0fVxuXHRjcmVhdGVEZWJ1Zy5zZWxlY3RDb2xvciA9IHNlbGVjdENvbG9yO1xuXG5cdC8qKlxuXHQqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEByZXR1cm4ge0Z1bmN0aW9ufVxuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXHRcdGxldCBwcmV2VGltZTtcblxuXHRcdGZ1bmN0aW9uIGRlYnVnKC4uLmFyZ3MpIHtcblx0XHRcdC8vIERpc2FibGVkP1xuXHRcdFx0aWYgKCFkZWJ1Zy5lbmFibGVkKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgc2VsZiA9IGRlYnVnO1xuXG5cdFx0XHQvLyBTZXQgYGRpZmZgIHRpbWVzdGFtcFxuXHRcdFx0Y29uc3QgY3VyciA9IE51bWJlcihuZXcgRGF0ZSgpKTtcblx0XHRcdGNvbnN0IG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcblx0XHRcdHNlbGYuZGlmZiA9IG1zO1xuXHRcdFx0c2VsZi5wcmV2ID0gcHJldlRpbWU7XG5cdFx0XHRzZWxmLmN1cnIgPSBjdXJyO1xuXHRcdFx0cHJldlRpbWUgPSBjdXJyO1xuXG5cdFx0XHRhcmdzWzBdID0gY3JlYXRlRGVidWcuY29lcmNlKGFyZ3NbMF0pO1xuXG5cdFx0XHRpZiAodHlwZW9mIGFyZ3NbMF0gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdC8vIEFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVPXG5cdFx0XHRcdGFyZ3MudW5zaGlmdCgnJU8nKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcblx0XHRcdGxldCBpbmRleCA9IDA7XG5cdFx0XHRhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgKG1hdGNoLCBmb3JtYXQpID0+IHtcblx0XHRcdFx0Ly8gSWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuXHRcdFx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHRcdH1cblx0XHRcdFx0aW5kZXgrKztcblx0XHRcdFx0Y29uc3QgZm9ybWF0dGVyID0gY3JlYXRlRGVidWcuZm9ybWF0dGVyc1tmb3JtYXRdO1xuXHRcdFx0XHRpZiAodHlwZW9mIGZvcm1hdHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNvbnN0IHZhbCA9IGFyZ3NbaW5kZXhdO1xuXHRcdFx0XHRcdG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuXHRcdFx0XHRcdC8vIE5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcblx0XHRcdFx0XHRhcmdzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0aW5kZXgtLTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcblx0XHRcdGNyZWF0ZURlYnVnLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuXHRcdFx0Y29uc3QgbG9nRm4gPSBzZWxmLmxvZyB8fCBjcmVhdGVEZWJ1Zy5sb2c7XG5cdFx0XHRsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcblx0XHR9XG5cblx0XHRkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cdFx0ZGVidWcuZW5hYmxlZCA9IGNyZWF0ZURlYnVnLmVuYWJsZWQobmFtZXNwYWNlKTtcblx0XHRkZWJ1Zy51c2VDb2xvcnMgPSBjcmVhdGVEZWJ1Zy51c2VDb2xvcnMoKTtcblx0XHRkZWJ1Zy5jb2xvciA9IHNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcuZGVzdHJveSA9IGRlc3Ryb3k7XG5cdFx0ZGVidWcuZXh0ZW5kID0gZXh0ZW5kO1xuXHRcdC8vIERlYnVnLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuXHRcdC8vIGRlYnVnLnJhd0xvZyA9IHJhd0xvZztcblxuXHRcdC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG5cdFx0aWYgKHR5cGVvZiBjcmVhdGVEZWJ1Zy5pbml0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRjcmVhdGVEZWJ1Zy5pbml0KGRlYnVnKTtcblx0XHR9XG5cblx0XHRjcmVhdGVEZWJ1Zy5pbnN0YW5jZXMucHVzaChkZWJ1Zyk7XG5cblx0XHRyZXR1cm4gZGVidWc7XG5cdH1cblxuXHRmdW5jdGlvbiBkZXN0cm95KCkge1xuXHRcdGNvbnN0IGluZGV4ID0gY3JlYXRlRGVidWcuaW5zdGFuY2VzLmluZGV4T2YodGhpcyk7XG5cdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG5hbWVzcGFjZSwgZGVsaW1pdGVyKSB7XG5cdFx0Y29uc3QgbmV3RGVidWcgPSBjcmVhdGVEZWJ1Zyh0aGlzLm5hbWVzcGFjZSArICh0eXBlb2YgZGVsaW1pdGVyID09PSAndW5kZWZpbmVkJyA/ICc6JyA6IGRlbGltaXRlcikgKyBuYW1lc3BhY2UpO1xuXHRcdG5ld0RlYnVnLmxvZyA9IHRoaXMubG9nO1xuXHRcdHJldHVybiBuZXdEZWJ1Zztcblx0fVxuXG5cdC8qKlxuXHQqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcblx0KiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuXHRcdGNyZWF0ZURlYnVnLnNhdmUobmFtZXNwYWNlcyk7XG5cblx0XHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRcdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0XHRsZXQgaTtcblx0XHRjb25zdCBzcGxpdCA9ICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycgPyBuYW1lc3BhY2VzIDogJycpLnNwbGl0KC9bXFxzLF0rLyk7XG5cdFx0Y29uc3QgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoIXNwbGl0W2ldKSB7XG5cdFx0XHRcdC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcblxuXHRcdFx0aWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNyZWF0ZURlYnVnLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGNyZWF0ZURlYnVnLmluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgaW5zdGFuY2UgPSBjcmVhdGVEZWJ1Zy5pbnN0YW5jZXNbaV07XG5cdFx0XHRpbnN0YW5jZS5lbmFibGVkID0gY3JlYXRlRGVidWcuZW5hYmxlZChpbnN0YW5jZS5uYW1lc3BhY2UpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuXHQqXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0XHRjb25zdCBuYW1lc3BhY2VzID0gW1xuXHRcdFx0Li4uY3JlYXRlRGVidWcubmFtZXMubWFwKHRvTmFtZXNwYWNlKSxcblx0XHRcdC4uLmNyZWF0ZURlYnVnLnNraXBzLm1hcCh0b05hbWVzcGFjZSkubWFwKG5hbWVzcGFjZSA9PiAnLScgKyBuYW1lc3BhY2UpXG5cdFx0XS5qb2luKCcsJyk7XG5cdFx0Y3JlYXRlRGVidWcuZW5hYmxlKCcnKTtcblx0XHRyZXR1cm4gbmFtZXNwYWNlcztcblx0fVxuXG5cdC8qKlxuXHQqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG5cdCogQHJldHVybiB7Qm9vbGVhbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcblx0XHRpZiAobmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnKicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGxldCBpO1xuXHRcdGxldCBsZW47XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGNyZWF0ZURlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoY3JlYXRlRGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0KiBDb252ZXJ0IHJlZ2V4cCB0byBuYW1lc3BhY2Vcblx0KlxuXHQqIEBwYXJhbSB7UmVnRXhwfSByZWd4ZXBcblx0KiBAcmV0dXJuIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiB0b05hbWVzcGFjZShyZWdleHApIHtcblx0XHRyZXR1cm4gcmVnZXhwLnRvU3RyaW5nKClcblx0XHRcdC5zdWJzdHJpbmcoMiwgcmVnZXhwLnRvU3RyaW5nKCkubGVuZ3RoIC0gMilcblx0XHRcdC5yZXBsYWNlKC9cXC5cXCpcXD8kLywgJyonKTtcblx0fVxuXG5cdC8qKlxuXHQqIENvZXJjZSBgdmFsYC5cblx0KlxuXHQqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuXHQqIEByZXR1cm4ge01peGVkfVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBjb2VyY2UodmFsKSB7XG5cdFx0aWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRyZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuXHRcdH1cblx0XHRyZXR1cm4gdmFsO1xuXHR9XG5cblx0Y3JlYXRlRGVidWcuZW5hYmxlKGNyZWF0ZURlYnVnLmxvYWQoKSk7XG5cblx0cmV0dXJuIGNyZWF0ZURlYnVnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNldHVwO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICovXG5cbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5leHBvcnRzLnN0b3JhZ2UgPSBsb2NhbHN0b3JhZ2UoKTtcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG5cdCcjMDAwMENDJyxcblx0JyMwMDAwRkYnLFxuXHQnIzAwMzNDQycsXG5cdCcjMDAzM0ZGJyxcblx0JyMwMDY2Q0MnLFxuXHQnIzAwNjZGRicsXG5cdCcjMDA5OUNDJyxcblx0JyMwMDk5RkYnLFxuXHQnIzAwQ0MwMCcsXG5cdCcjMDBDQzMzJyxcblx0JyMwMENDNjYnLFxuXHQnIzAwQ0M5OScsXG5cdCcjMDBDQ0NDJyxcblx0JyMwMENDRkYnLFxuXHQnIzMzMDBDQycsXG5cdCcjMzMwMEZGJyxcblx0JyMzMzMzQ0MnLFxuXHQnIzMzMzNGRicsXG5cdCcjMzM2NkNDJyxcblx0JyMzMzY2RkYnLFxuXHQnIzMzOTlDQycsXG5cdCcjMzM5OUZGJyxcblx0JyMzM0NDMDAnLFxuXHQnIzMzQ0MzMycsXG5cdCcjMzNDQzY2Jyxcblx0JyMzM0NDOTknLFxuXHQnIzMzQ0NDQycsXG5cdCcjMzNDQ0ZGJyxcblx0JyM2NjAwQ0MnLFxuXHQnIzY2MDBGRicsXG5cdCcjNjYzM0NDJyxcblx0JyM2NjMzRkYnLFxuXHQnIzY2Q0MwMCcsXG5cdCcjNjZDQzMzJyxcblx0JyM5OTAwQ0MnLFxuXHQnIzk5MDBGRicsXG5cdCcjOTkzM0NDJyxcblx0JyM5OTMzRkYnLFxuXHQnIzk5Q0MwMCcsXG5cdCcjOTlDQzMzJyxcblx0JyNDQzAwMDAnLFxuXHQnI0NDMDAzMycsXG5cdCcjQ0MwMDY2Jyxcblx0JyNDQzAwOTknLFxuXHQnI0NDMDBDQycsXG5cdCcjQ0MwMEZGJyxcblx0JyNDQzMzMDAnLFxuXHQnI0NDMzMzMycsXG5cdCcjQ0MzMzY2Jyxcblx0JyNDQzMzOTknLFxuXHQnI0NDMzNDQycsXG5cdCcjQ0MzM0ZGJyxcblx0JyNDQzY2MDAnLFxuXHQnI0NDNjYzMycsXG5cdCcjQ0M5OTAwJyxcblx0JyNDQzk5MzMnLFxuXHQnI0NDQ0MwMCcsXG5cdCcjQ0NDQzMzJyxcblx0JyNGRjAwMDAnLFxuXHQnI0ZGMDAzMycsXG5cdCcjRkYwMDY2Jyxcblx0JyNGRjAwOTknLFxuXHQnI0ZGMDBDQycsXG5cdCcjRkYwMEZGJyxcblx0JyNGRjMzMDAnLFxuXHQnI0ZGMzMzMycsXG5cdCcjRkYzMzY2Jyxcblx0JyNGRjMzOTknLFxuXHQnI0ZGMzNDQycsXG5cdCcjRkYzM0ZGJyxcblx0JyNGRjY2MDAnLFxuXHQnI0ZGNjYzMycsXG5cdCcjRkY5OTAwJyxcblx0JyNGRjk5MzMnLFxuXHQnI0ZGQ0MwMCcsXG5cdCcjRkZDQzMzJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuXHQvLyBOQjogSW4gYW4gRWxlY3Ryb24gcHJlbG9hZCBzY3JpcHQsIGRvY3VtZW50IHdpbGwgYmUgZGVmaW5lZCBidXQgbm90IGZ1bGx5XG5cdC8vIGluaXRpYWxpemVkLiBTaW5jZSB3ZSBrbm93IHdlJ3JlIGluIENocm9tZSwgd2UnbGwganVzdCBkZXRlY3QgdGhpcyBjYXNlXG5cdC8vIGV4cGxpY2l0bHlcblx0aWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wcm9jZXNzICYmICh3aW5kb3cucHJvY2Vzcy50eXBlID09PSAncmVuZGVyZXInIHx8IHdpbmRvdy5wcm9jZXNzLl9fbndqcykpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIEludGVybmV0IEV4cGxvcmVyIGFuZCBFZGdlIGRvIG5vdCBzdXBwb3J0IGNvbG9ycy5cblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC8oZWRnZXx0cmlkZW50KVxcLyhcXGQrKS8pKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gSXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcblx0Ly8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcblx0cmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLldlYmtpdEFwcGVhcmFuY2UpIHx8XG5cdFx0Ly8gSXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuXHRcdCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUuZmlyZWJ1ZyB8fCAod2luZG93LmNvbnNvbGUuZXhjZXB0aW9uICYmIHdpbmRvdy5jb25zb2xlLnRhYmxlKSkpIHx8XG5cdFx0Ly8gSXMgZmlyZWZveCA+PSB2MzE/XG5cdFx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG5cdFx0KHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpIHx8XG5cdFx0Ly8gRG91YmxlIGNoZWNrIHdlYmtpdCBpbiB1c2VyQWdlbnQganVzdCBpbiBjYXNlIHdlIGFyZSBpbiBhIHdvcmtlclxuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSk7XG59XG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG5cdGFyZ3NbMF0gPSAodGhpcy51c2VDb2xvcnMgPyAnJWMnIDogJycpICtcblx0XHR0aGlzLm5hbWVzcGFjZSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyAlYycgOiAnICcpICtcblx0XHRhcmdzWzBdICtcblx0XHQodGhpcy51c2VDb2xvcnMgPyAnJWMgJyA6ICcgJykgK1xuXHRcdCcrJyArIG1vZHVsZS5leHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cblx0aWYgKCF0aGlzLnVzZUNvbG9ycykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuXHRhcmdzLnNwbGljZSgxLCAwLCBjLCAnY29sb3I6IGluaGVyaXQnKTtcblxuXHQvLyBUaGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuXHQvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG5cdC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuXHRsZXQgaW5kZXggPSAwO1xuXHRsZXQgbGFzdEMgPSAwO1xuXHRhcmdzWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZywgbWF0Y2ggPT4ge1xuXHRcdGlmIChtYXRjaCA9PT0gJyUlJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRpbmRleCsrO1xuXHRcdGlmIChtYXRjaCA9PT0gJyVjJykge1xuXHRcdFx0Ly8gV2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG5cdFx0XHQvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuXHRcdFx0bGFzdEMgPSBpbmRleDtcblx0XHR9XG5cdH0pO1xuXG5cdGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gbG9nKC4uLmFyZ3MpIHtcblx0Ly8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgvOSwgd2hlcmVcblx0Ly8gdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcblx0cmV0dXJuIHR5cGVvZiBjb25zb2xlID09PSAnb2JqZWN0JyAmJlxuXHRcdGNvbnNvbGUubG9nICYmXG5cdFx0Y29uc29sZS5sb2coLi4uYXJncyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcblx0dHJ5IHtcblx0XHRpZiAobmFtZXNwYWNlcykge1xuXHRcdFx0ZXhwb3J0cy5zdG9yYWdlLnNldEl0ZW0oJ2RlYnVnJywgbmFtZXNwYWNlcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuXHRcdH1cblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gbG9hZCgpIHtcblx0bGV0IHI7XG5cdHRyeSB7XG5cdFx0ciA9IGV4cG9ydHMuc3RvcmFnZS5nZXRJdGVtKCdkZWJ1ZycpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxuXG5cdC8vIElmIGRlYnVnIGlzbid0IHNldCBpbiBMUywgYW5kIHdlJ3JlIGluIEVsZWN0cm9uLCB0cnkgdG8gbG9hZCAkREVCVUdcblx0aWYgKCFyICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAnZW52JyBpbiBwcm9jZXNzKSB7XG5cdFx0ciA9IHByb2Nlc3MuZW52LkRFQlVHO1xuXHR9XG5cblx0cmV0dXJuIHI7XG59XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCkge1xuXHR0cnkge1xuXHRcdC8vIFRWTUxLaXQgKEFwcGxlIFRWIEpTIFJ1bnRpbWUpIGRvZXMgbm90IGhhdmUgYSB3aW5kb3cgb2JqZWN0LCBqdXN0IGxvY2FsU3RvcmFnZSBpbiB0aGUgZ2xvYmFsIGNvbnRleHRcblx0XHQvLyBUaGUgQnJvd3NlciBhbHNvIGhhcyBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0LlxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2U7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jb21tb24nKShleHBvcnRzKTtcblxuY29uc3Qge2Zvcm1hdHRlcnN9ID0gbW9kdWxlLmV4cG9ydHM7XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uICh2KSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHJldHVybiAnW1VuZXhwZWN0ZWRKU09OUGFyc2VFcnJvcl06ICcgKyBlcnJvci5tZXNzYWdlO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBsb2Rhc2ggKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pxdWVyeS5vcmcvPlxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICovXG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCAmJiBnbG9iYWwuT2JqZWN0ID09PSBPYmplY3QgJiYgZ2xvYmFsO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGV4cG9ydHNgLiAqL1xudmFyIGZyZWVFeHBvcnRzID0gdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgJiYgZXhwb3J0cyAmJiAhZXhwb3J0cy5ub2RlVHlwZSAmJiBleHBvcnRzO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYG1vZHVsZWAuICovXG52YXIgZnJlZU1vZHVsZSA9IGZyZWVFeHBvcnRzICYmIHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUgJiYgbW9kdWxlO1xuXG4vKiogRGV0ZWN0IHRoZSBwb3B1bGFyIENvbW1vbkpTIGV4dGVuc2lvbiBgbW9kdWxlLmV4cG9ydHNgLiAqL1xudmFyIG1vZHVsZUV4cG9ydHMgPSBmcmVlTW9kdWxlICYmIGZyZWVNb2R1bGUuZXhwb3J0cyA9PT0gZnJlZUV4cG9ydHM7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgcHJvY2Vzc2AgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVQcm9jZXNzID0gbW9kdWxlRXhwb3J0cyAmJiBmcmVlR2xvYmFsLnByb2Nlc3M7XG5cbi8qKiBVc2VkIHRvIGFjY2VzcyBmYXN0ZXIgTm9kZS5qcyBoZWxwZXJzLiAqL1xudmFyIG5vZGVVdGlsID0gKGZ1bmN0aW9uKCkge1xuICB0cnkge1xuICAgIHJldHVybiBmcmVlUHJvY2VzcyAmJiBmcmVlUHJvY2Vzcy5iaW5kaW5nKCd1dGlsJyk7XG4gIH0gY2F0Y2ggKGUpIHt9XG59KCkpO1xuXG4vKiBOb2RlLmpzIGhlbHBlciByZWZlcmVuY2VzLiAqL1xudmFyIG5vZGVJc0RhdGUgPSBub2RlVXRpbCAmJiBub2RlVXRpbC5pc0RhdGU7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udW5hcnlgIHdpdGhvdXQgc3VwcG9ydCBmb3Igc3RvcmluZyBtZXRhZGF0YS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gY2FwIGFyZ3VtZW50cyBmb3IuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBjYXBwZWQgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VVbmFyeShmdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jKHZhbHVlKTtcbiAgfTtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNEYXRlYCB3aXRob3V0IE5vZGUuanMgb3B0aW1pemF0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGRhdGUgb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0RhdGUodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gZGF0ZVRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYERhdGVgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGRhdGUgb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNEYXRlKG5ldyBEYXRlKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRGF0ZSgnTW9uIEFwcmlsIDIzIDIwMTInKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbnZhciBpc0RhdGUgPSBub2RlSXNEYXRlID8gYmFzZVVuYXJ5KG5vZGVJc0RhdGUpIDogYmFzZUlzRGF0ZTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNEYXRlO1xuIiwiaW1wb3J0IGlzRGF0ZSBmcm9tICdsb2Rhc2guaXNkYXRlJ1xuZXhwb3J0IHtcbiAgaXNCb29saXNoLFxuICBpc0N1cnJlbmN5LFxuICBpc0RhdGVTdHJpbmcsXG4gIGlzRW1haWxTaGFwZWQsXG4gIGlzRmxvYXRpc2gsXG4gIGlzTnVsbGlzaCxcbiAgaXNOdW1lcmljLFxuICBpc09iamVjdElkLFxuICBpc1RpbWVzdGFtcCxcbiAgaXNVdWlkXG59XG5cbmNvbnN0IGN1cnJlbmNpZXMgPSBbXG4gICckJywgJ8KiJywgJ8KjJywgJ8KkJywgJ8KlJywgJ9aPJywgJ9iLJywgJ9++JywgJ9+/JywgJ+CnsicsICfgp7MnLCAn4Ke7JyxcbiAgJ+CrsScsICfgr7knLCAn4Li/JywgJ+GfmycsICfigqAnLCAn4oKhJywgJ+KCoicsICfigqMnLCAn4oKkJywgJ+KCpScsICfigqYnLCAn4oKnJyxcbiAgJ+KCqCcsICfigqknLCAn4oKqJywgJ+KCqycsICfigqwnLCAn4oKtJywgJ+KCricsICfigq8nLCAn4oKwJywgJ+KCsScsICfigrInLCAn4oKzJyxcbiAgJ+KCtCcsICfigrUnLCAn4oK2JywgJ+KCtycsICfigrgnLCAn4oK5JywgJ+KCuicsICfigrsnLCAn4oK8JywgJ+KCvScsICfigr4nLCAn4oK/JyxcbiAgJ+qguCcsICfvt7wnLCAn77mpJywgJ++8hCcsICfvv6AnLCAn77+hJywgJ++/pScsICfvv6YnLFxuICAn8JG/nScsICfwkb+eJywgJ/CRv58nLCAn8JG/oCcsICfwnou/JywgJ/CesrAnXG5dXG5cbmNvbnN0IGJvb2xpc2hQYXR0ZXJuID0gL14oW1lOXXwoVFJVRSl8KEZBTFNFKSkkL2lcbmNvbnN0IHV1aWRQYXR0ZXJuID0gL15bMC05YS1mQS1GXXs4fS1bMC05YS1mQS1GXXs0fS1bMC05YS1mQS1GXXs0fS1bMC05YS1mQS1GXXs0fS1bMC05YS1mQS1GXXsxMn0kL1xuY29uc3Qgb2JqZWN0SWRQYXR0ZXJuID0gL15bYS1mXFxkXXsyNH0kL2lcbmNvbnN0IGRhdGVTdHJpbmdQYXR0ZXJuID0gL14oWystXT9cXGR7NH0oPyFcXGR7Mn1cXGIpKSgoLT8pKCgwWzEtOV18MVswLTJdKShcXDMoWzEyXVxcZHwwWzEtOV18M1swMV0pKT98VyhbMC00XVxcZHw1WzAtMl0pKC0/WzEtN10pP3woMDBbMS05XXwwWzEtOV1cXGR8WzEyXVxcZHsyfXwzKFswLTVdXFxkfDZbMS02XSkpKShbVFxcc10oKChbMDFdXFxkfDJbMC0zXSkoKDo/KVswLTVdXFxkKT98MjQ6PzAwKShbLixdXFxkKyg/ITopKT8pPyhcXDE3WzAtNV1cXGQoWy4sXVxcZCspPyk/KFt6Wl18KFsrLV0pKFswMV1cXGR8MlswLTNdKTo/KFswLTVdXFxkKT8pPyk/KT8kL1xuY29uc3QgdGltZXN0YW1wUGF0dGVybiA9IC9eWzEyXVxcZHsxMn0kL1xuLy8gY29uc3QgY3VycmVuY3lQYXR0ZXJuVVMgPSAvXlxccHtTY31cXHM/W1xcZCwuXSskL3VpZ1xuLy8gY29uc3QgY3VycmVuY3lQYXR0ZXJuRVUgPSAvXltcXGQsLl0rXFxzP1xccHtTY30kL3VpZ1xuY29uc3QgbnVtYmVyaXNoUGF0dGVybiA9IC9eLT9bXFxkLixdKyQvXG5jb25zdCBmbG9hdFBhdHRlcm4gPSAvXFxkXFwuXFxkL1xuLy8gY29uc3QgZW1haWxQYXR0ZXJuID0gL15bXkBdK0BbXkBdezIsfVxcLlteQF17Mix9W14uXSQvXG5jb25zdCBlbWFpbFBhdHRlcm4gPSAvXlxcdysoWy4tXT9cXHcrKSpAXFx3KyhbLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC9cbmNvbnN0IG51bGxpc2hQYXR0ZXJuID0gL251bGwvaVxuLy8gY29uc3QgZW1haWxQYXR0ZXJuID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskL2lnbVxuXG5mdW5jdGlvbiBpc0Jvb2xpc2ggKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPD0gNiAmJiBib29saXNoUGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkpXG59XG5cbmZ1bmN0aW9uIGlzVXVpZCAodmFsdWUsIGZpZWxkTmFtZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDQwICYmIHV1aWRQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5mdW5jdGlvbiBpc09iamVjdElkICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDwgNDAgJiYgb2JqZWN0SWRQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzRGF0ZVN0cmluZyAodmFsdWUsIGZpZWxkTmFtZSkge1xuICAvLyBub3QgYnVsbGV0LXByb29mLCBtZWFudCB0byBzbmlmZiBpbnRlbnRpb24gaW4gdGhlIGRhdGFcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkgcmV0dXJuIHRydWVcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDwgMzAgJiYgZGF0ZVN0cmluZ1BhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNUaW1lc3RhbXAgKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdGltZXN0YW1wUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0N1cnJlbmN5ICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgY29uc3QgdmFsdWVTeW1ib2wgPSBjdXJyZW5jaWVzLmZpbmQoKGN1clN5bWJvbCkgPT4gdmFsdWUuaW5kZXhPZihjdXJTeW1ib2wpID4gLTEpXG4gIGlmICghdmFsdWVTeW1ib2wpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UodmFsdWVTeW1ib2wsICcnKVxuICByZXR1cm4gaXNOdW1lcmljKHZhbHVlKVxuICAvLyBjb25zb2xlLmxvZyh2YWx1ZSwgJ2N1cnJlbmN5UGF0dGVyblVTJywgY3VycmVuY3lQYXR0ZXJuVVMudGVzdCh2YWx1ZSksICdjdXJyZW5jeVBhdHRlcm5FVScsIGN1cnJlbmN5UGF0dGVybkVVLnRlc3QodmFsdWUpKTtcbiAgLy8gcmV0dXJuIGN1cnJlbmN5UGF0dGVyblVTLnRlc3QodmFsdWUpIHx8IGN1cnJlbmN5UGF0dGVybkVVLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyAodmFsdWUsIGZpZWxkTmFtZSkge1xuICAvLyBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIG51bWJlcmlzaFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNGbG9hdGlzaCAodmFsdWUpIHtcbiAgcmV0dXJuICEhKGlzTnVtZXJpYyhTdHJpbmcodmFsdWUpKSAmJiBmbG9hdFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKSAmJiAhTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpXG59XG5cbmZ1bmN0aW9uIGlzRW1haWxTaGFwZWQgKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICBpZiAodmFsdWUuaW5jbHVkZXMoJyAnKSB8fCAhdmFsdWUuaW5jbHVkZXMoJ0AnKSkgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPj0gNSAmJiB2YWx1ZS5sZW5ndGggPCA4MCAmJiBlbWFpbFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNOdWxsaXNoICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgbnVsbGlzaFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpLnRyaW0oKSlcbn1cbiIsImltcG9ydCB7XG4gIGlzQm9vbGlzaCxcbiAgaXNDdXJyZW5jeSxcbiAgaXNEYXRlU3RyaW5nLFxuICBpc0VtYWlsU2hhcGVkLFxuICBpc0Zsb2F0aXNoLFxuICBpc051bGxpc2gsXG4gIGlzTnVtZXJpYyxcbiAgaXNPYmplY3RJZCxcbiAgaXNUaW1lc3RhbXAsXG4gIGlzVXVpZFxufSBmcm9tICcuL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzJ1xuXG5jb25zdCBoYXNMZWFkaW5nWmVybyA9IC9eMCsvXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlTmFtZS5cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSAtIGlucHV0IGRhdGFcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0VHlwZXMgKHZhbHVlLCBzdHJpY3RNYXRjaGluZyA9IHRydWUpIHtcbiAgY29uc3QgZXhjbHVkZWRUeXBlcyA9IFtdXG4gIGNvbnN0IG1hdGNoZWRUeXBlcyA9IHByaW9yaXRpemVkVHlwZXMucmVkdWNlKCh0eXBlcywgdHlwZUhlbHBlcikgPT4ge1xuICAgIGlmICh0eXBlSGVscGVyLmNoZWNrKHZhbHVlKSkge1xuICAgICAgaWYgKHR5cGVIZWxwZXIuc3VwZXJjZWRlcykgZXhjbHVkZWRUeXBlcy5wdXNoKC4uLnR5cGVIZWxwZXIuc3VwZXJjZWRlcylcbiAgICAgIHR5cGVzLnB1c2godHlwZUhlbHBlci50eXBlKVxuICAgIH1cbiAgICByZXR1cm4gdHlwZXNcbiAgfSwgW10pXG4gIHJldHVybiAhc3RyaWN0TWF0Y2hpbmcgPyBtYXRjaGVkVHlwZXMgOiBtYXRjaGVkVHlwZXMuZmlsdGVyKCh0eXBlKSA9PiBleGNsdWRlZFR5cGVzLmluZGV4T2YodHlwZSkgPT09IC0xKVxufVxuXG4vKipcbiAqIE1ldGFDaGVja3MgYXJlIHVzZWQgdG8gYW5hbHl6ZSB0aGUgaW50ZXJtZWRpYXRlIHJlc3VsdHMsIGFmdGVyIHRoZSBCYXNpYyAoZGlzY3JlZXQpIHR5cGUgY2hlY2tzIGFyZSBjb21wbGV0ZS5cbiAqIFRoZXkgaGF2ZSBhY2Nlc3MgdG8gYWxsIHRoZSBkYXRhIHBvaW50cyBiZWZvcmUgaXQgaXMgZmluYWxseSBwcm9jZXNzZWQuXG4gKi9cbmNvbnN0IE1ldGFDaGVja3MgPSB7XG4gIFRZUEVfRU5VTToge1xuICAgIHR5cGU6ICdlbnVtJyxcbiAgICBtYXRjaEJhc2ljVHlwZXM6IFsnU3RyaW5nJywgJ051bWJlciddLFxuICAgIGNoZWNrOiAodHlwZUluZm8sIHsgcm93Q291bnQsIHVuaXF1ZXMgfSwgeyBlbnVtQWJzb2x1dGVMaW1pdCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgfSkgPT4ge1xuICAgICAgaWYgKCF1bmlxdWVzIHx8IHVuaXF1ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIFRPRE86IGNhbGN1bGF0ZSB1bmlxdWVuZXNzIHVzaW5nIEFMTCB1bmlxdWVzIGNvbWJpbmVkIGZyb20gQUxMIHR5cGVzLCB0aGlzIG9ubHkgc2VlcyBjb25zaXN0ZW50bHkgdHlwZWQgZGF0YVxuICAgICAgLy8gY29uc3QgdW5pcXVlbmVzcyA9IHJvd0NvdW50IC8gdW5pcXVlcy5sZW5ndGhcbiAgICAgIGNvbnN0IHJlbGF0aXZlRW51bUxpbWl0ID0gTWF0aC5taW4ocGFyc2VJbnQoU3RyaW5nKHJvd0NvdW50ICogZW51bVBlcmNlbnRUaHJlc2hvbGQpLCAxMCksIGVudW1BYnNvbHV0ZUxpbWl0KVxuICAgICAgaWYgKHVuaXF1ZXMubGVuZ3RoID4gcmVsYXRpdmVFbnVtTGltaXQpIHJldHVybiB0eXBlSW5mb1xuICAgICAgLy8gY29uc3QgZW51bUxpbWl0ID0gdW5pcXVlbmVzcyA8IGVudW1BYnNvbHV0ZUxpbWl0ICYmIHJlbGF0aXZlRW51bUxpbWl0IDwgZW51bUFic29sdXRlTGltaXRcbiAgICAgIC8vICAgPyBlbnVtQWJzb2x1dGVMaW1pdFxuICAgICAgLy8gICA6IHJlbGF0aXZlRW51bUxpbWl0XG5cbiAgICAgIHJldHVybiB7IGVudW06IHVuaXF1ZXMsIC4uLnR5cGVJbmZvIH1cbiAgICAgIC8vIFRPRE86IGNhbGN1bGF0ZSBlbnRyb3B5IHVzaW5nIGEgc3VtIG9mIGFsbCBub24tbnVsbCBkZXRlY3RlZCB0eXBlcywgbm90IGp1c3QgdHlwZUNvdW50XG4gICAgfVxuICB9LFxuICBUWVBFX05VTExBQkxFOiB7XG4gICAgdHlwZTogJ251bGxhYmxlJyxcbiAgICAvLyBtYXRjaEJhc2ljVHlwZXM6IFsnU3RyaW5nJywgJ051bWJlciddLFxuICAgIGNoZWNrOiAodHlwZUluZm8sIHsgcm93Q291bnQsIHVuaXF1ZXMgfSwgeyBudWxsYWJsZVJvd3NUaHJlc2hvbGQgfSkgPT4ge1xuICAgICAgaWYgKCF1bmlxdWVzIHx8IHVuaXF1ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gdHlwZUluZm9cbiAgICAgIGxldCBudWxsaXNoVHlwZUNvdW50ID0gMFxuICAgICAgaWYgKHR5cGVJbmZvICYmIHR5cGVJbmZvLnR5cGVzICYmIHR5cGVJbmZvLnR5cGVzLk51bGwpIGNvbnNvbGUud2FybignVW5leHBlY3RlZCB0eXBlIGluZm8gc3RydWN0dXJlISAoLnR5cGVzLiBrZXkhKScpO1xuXG4gICAgICBpZiAodHlwZUluZm8gJiYgdHlwZUluZm8uTnVsbCkge1xuICAgICAgICBudWxsaXNoVHlwZUNvdW50ICs9IHR5cGVJbmZvLk51bGwuY291bnRcbiAgICAgIH1cbiAgICAgIC8vIGlmICh0eXBlcy5Vbmtub3duKSB7XG4gICAgICAvLyAgIG51bGxpc2hUeXBlQ291bnQgKz0gdHlwZXMuVW5rbm93bi5jb3VudFxuICAgICAgLy8gfVxuICAgICAgY29uc3QgbnVsbExpbWl0ID0gcm93Q291bnQgKiBudWxsYWJsZVJvd3NUaHJlc2hvbGRcbiAgICAgIGNvbnN0IGlzTm90TnVsbGFibGUgPSBudWxsaXNoVHlwZUNvdW50IDw9IG51bGxMaW1pdFxuICAgICAgLy8gVE9ETzogTG9vayBpbnRvIHNwZWNpZmljYWxseSBjaGVja2luZyAnTnVsbCcgb3IgJ1Vua25vd24nIHR5cGUgc3RhdHNcbiAgICAgIHJldHVybiB7IG51bGxhYmxlOiAhaXNOb3ROdWxsYWJsZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH0sXG4gIFRZUEVfVU5JUVVFOiB7XG4gICAgdHlwZTogJ3VuaXF1ZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgdW5pcXVlUm93c1RocmVzaG9sZCB9KSA9PiB7XG4gICAgICBpZiAoIXVuaXF1ZXMgfHwgdW5pcXVlcy5sZW5ndGggPT09IDApIHJldHVybiB0eXBlSW5mb1xuICAgICAgLy8gY29uc3QgdW5pcXVlbmVzcyA9IHJvd0NvdW50IC8gdW5pcXVlcy5sZW5ndGhcbiAgICAgIGNvbnN0IGlzVW5pcXVlID0gdW5pcXVlcy5sZW5ndGggPT09IChyb3dDb3VudCAqIHVuaXF1ZVJvd3NUaHJlc2hvbGQpXG4gICAgICAvLyBUT0RPOiBMb29rIGludG8gc3BlY2lmaWNhbGx5IGNoZWNraW5nICdOdWxsJyBvciAnVW5rbm93bicgdHlwZSBzdGF0c1xuICAgICAgcmV0dXJuIHsgdW5pcXVlOiBpc1VuaXF1ZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gcmV0dXJuIHt1bmlxdWU6IHVuaXF1ZW5lc3MgPj0gdW5pcXVlUm93c1RocmVzaG9sZCwgLi4udHlwZUluZm99XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfVxufVxuXG4vLyBCYXNpYyBUeXBlIEZpbHRlcnMgLSBydWRpbWVudGFyeSBkYXRhIHNuaWZmaW5nIHVzZWQgdG8gdGFsbHkgdXAgXCJ2b3Rlc1wiIGZvciBhIGdpdmVuIGZpZWxkXG4vKipcbiAqIERldGVjdCBhbWJpZ3VvdXMgZmllbGQgdHlwZS5cbiAqIFdpbGwgbm90IGFmZmVjdCB3ZWlnaHRlZCBmaWVsZCBhbmFseXNpcy5cbiAqL1xuY29uc3QgVFlQRV9VTktOT1dOID0ge1xuICB0eXBlOiAnVW5rbm93bicsXG4gIGNoZWNrOiAodmFsdWUpID0+IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICd1bmRlZmluZWQnXG59XG5jb25zdCBUWVBFX09CSkVDVF9JRCA9IHtcbiAgdHlwZTogJ09iamVjdElkJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzT2JqZWN0SWRcbn1cbmNvbnN0IFRZUEVfVVVJRCA9IHtcbiAgdHlwZTogJ1VVSUQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZyddLFxuICBjaGVjazogaXNVdWlkXG59XG5jb25zdCBUWVBFX0JPT0xFQU4gPSB7XG4gIHR5cGU6ICdCb29sZWFuJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzQm9vbGlzaFxufVxuY29uc3QgVFlQRV9EQVRFID0ge1xuICB0eXBlOiAnRGF0ZScsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ10sXG4gIGNoZWNrOiBpc0RhdGVTdHJpbmdcbn1cbmNvbnN0IFRZUEVfVElNRVNUQU1QID0ge1xuICB0eXBlOiAnVGltZXN0YW1wJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc1RpbWVzdGFtcFxufVxuY29uc3QgVFlQRV9DVVJSRU5DWSA9IHtcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc0N1cnJlbmN5XG59XG5jb25zdCBUWVBFX0ZMT0FUID0ge1xuICB0eXBlOiAnRmxvYXQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgY2hlY2s6IGlzRmxvYXRpc2hcbn1cbmNvbnN0IFRZUEVfTlVNQkVSID0ge1xuICB0eXBlOiAnTnVtYmVyJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIGlmIChoYXNMZWFkaW5nWmVyby50ZXN0KFN0cmluZyh2YWx1ZSkpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gISEodmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIChOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBpc051bWVyaWModmFsdWUpKSlcbiAgfVxufVxuY29uc3QgVFlQRV9FTUFJTCA9IHtcbiAgdHlwZTogJ0VtYWlsJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzRW1haWxTaGFwZWRcbn1cbmNvbnN0IFRZUEVfU1RSSU5HID0ge1xuICB0eXBlOiAnU3RyaW5nJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAvLyAmJiB2YWx1ZS5sZW5ndGggPj0gMVxufVxuY29uc3QgVFlQRV9BUlJBWSA9IHtcbiAgdHlwZTogJ0FycmF5JyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICB9XG59XG5jb25zdCBUWVBFX09CSkVDVCA9IHtcbiAgdHlwZTogJ09iamVjdCcsXG4gIGNoZWNrOiAodmFsdWUpID0+IHtcbiAgICByZXR1cm4gIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuICB9XG59XG5jb25zdCBUWVBFX05VTEwgPSB7XG4gIHR5cGU6ICdOdWxsJyxcbiAgY2hlY2s6IGlzTnVsbGlzaFxufVxuXG5jb25zdCBwcmlvcml0aXplZFR5cGVzID0gW1xuICBUWVBFX1VOS05PV04sXG4gIFRZUEVfT0JKRUNUX0lELFxuICBUWVBFX1VVSUQsXG4gIFRZUEVfQk9PTEVBTixcbiAgVFlQRV9EQVRFLFxuICBUWVBFX1RJTUVTVEFNUCxcbiAgVFlQRV9DVVJSRU5DWSxcbiAgVFlQRV9GTE9BVCxcbiAgVFlQRV9OVU1CRVIsXG4gIFRZUEVfTlVMTCxcbiAgVFlQRV9FTUFJTCxcbiAgVFlQRV9TVFJJTkcsXG4gIFRZUEVfQVJSQVksXG4gIFRZUEVfT0JKRUNUXG5dXG5cbi8qKlxuICogVHlwZSBSYW5rIE1hcDogVXNlIHRvIHNvcnQgTG93ZXN0IHRvIEhpZ2hlc3RcbiAqL1xuY29uc3QgdHlwZVJhbmtpbmdzID0ge1xuICBbVFlQRV9VTktOT1dOLnR5cGVdOiAtMSxcbiAgW1RZUEVfT0JKRUNUX0lELnR5cGVdOiAxLFxuICBbVFlQRV9VVUlELnR5cGVdOiAyLFxuICBbVFlQRV9CT09MRUFOLnR5cGVdOiAzLFxuICBbVFlQRV9EQVRFLnR5cGVdOiA0LFxuICBbVFlQRV9USU1FU1RBTVAudHlwZV06IDUsXG4gIFtUWVBFX0NVUlJFTkNZLnR5cGVdOiA2LFxuICBbVFlQRV9GTE9BVC50eXBlXTogNyxcbiAgW1RZUEVfTlVNQkVSLnR5cGVdOiA4LFxuICBbVFlQRV9OVUxMLnR5cGVdOiAxMCxcbiAgW1RZUEVfRU1BSUwudHlwZV06IDExLFxuICBbVFlQRV9TVFJJTkcudHlwZV06IDEyLFxuICBbVFlQRV9BUlJBWS50eXBlXTogMTMsXG4gIFtUWVBFX09CSkVDVC50eXBlXTogMTRcbn1cblxuZXhwb3J0IHtcbiAgdHlwZVJhbmtpbmdzLFxuICBwcmlvcml0aXplZFR5cGVzLFxuICBkZXRlY3RUeXBlcyxcbiAgTWV0YUNoZWNrcyxcbiAgVFlQRV9VTktOT1dOLFxuICBUWVBFX09CSkVDVF9JRCxcbiAgVFlQRV9VVUlELFxuICBUWVBFX0JPT0xFQU4sXG4gIFRZUEVfREFURSxcbiAgVFlQRV9USU1FU1RBTVAsXG4gIFRZUEVfQ1VSUkVOQ1ksXG4gIFRZUEVfRkxPQVQsXG4gIFRZUEVfTlVNQkVSLFxuICBUWVBFX05VTEwsXG4gIFRZUEVfRU1BSUwsXG4gIFRZUEVfU1RSSU5HLFxuICBUWVBFX0FSUkFZLFxuICBUWVBFX09CSkVDVFxufVxuLy8gY29uc3QgVFlQRV9FTlVNID0ge1xuLy8gICB0eXBlOiBcIlN0cmluZ1wiLFxuLy8gICBjaGVjazogKHZhbHVlLCBmaWVsZEluZm8sIHNjaGVtYUluZm8pID0+IHtcbi8vICAgICAvLyBUaHJlc2hvbGQgc2V0IHRvIDUlIC0gNSAob3IgZmV3ZXIpIG91dCBvZiAxMDAgdW5pcXVlIHN0cmluZ3Mgc2hvdWxkIGVuYWJsZSAnZW51bScgbW9kZVxuLy8gICAgIGlmIChzY2hlbWFJbmZvLmlucHV0Um93Q291bnQgPCAxMDApIHJldHVybiBmYWxzZTsgLy8gZGlzYWJsZWQgaWYgc2V0IHRvbyBzbWFsbFxuLy8gICB9XG4vLyB9O1xuIiwiaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuLy8gaW1wb3J0IEZQIGZyb20gJ2Z1bmN0aW9uYWwtcHJvbWlzZXMnO1xuLy8gaW1wb3J0IHsgZGV0ZWN0VHlwZXMgfSBmcm9tICcuL3R5cGUtaGVscGVycy5qcydcbi8vIGltcG9ydCBTdGF0c01hcCBmcm9tICdzdGF0cy1tYXAnO1xuLy8gaW1wb3J0IG1lbSBmcm9tICdtZW0nO1xuaW1wb3J0IHsgZGV0ZWN0VHlwZXMsIE1ldGFDaGVja3MsIHR5cGVSYW5raW5ncyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzLm1qcydcbmNvbnN0IGxvZyA9IGRlYnVnKCdzY2hlbWEtYnVpbGRlcjppbmRleCcpXG4vLyBjb25zdCBjYWNoZSA9IG5ldyBTdGF0c01hcCgpO1xuLy8gY29uc3QgZGV0ZWN0VHlwZXNDYWNoZWQgPSBtZW0oX2RldGVjdFR5cGVzLCB7IGNhY2hlLCBtYXhBZ2U6IDEwMDAgKiA2MDAgfSkgLy8ga2VlcCBjYWNoZSB1cCB0byAxMCBtaW51dGVzXG5cbmV4cG9ydCB7IHNjaGVtYUJ1aWxkZXIsIHBpdm90RmllbGREYXRhQnlUeXBlLCBnZXROdW1iZXJSYW5nZVN0YXRzLCBpc1ZhbGlkRGF0ZSB9XG5cbmZ1bmN0aW9uIGlzVmFsaWREYXRlIChkYXRlKSB7XG4gIGRhdGUgPSBkYXRlIGluc3RhbmNlb2YgRGF0ZSA/IGRhdGUgOiBuZXcgRGF0ZShkYXRlKVxuICByZXR1cm4gaXNOYU4oZGF0ZS5nZXRGdWxsWWVhcigpKSA/IGZhbHNlIDogZGF0ZVxufVxuXG5jb25zdCBwYXJzZURhdGUgPSAoZGF0ZSkgPT4ge1xuICBkYXRlID0gaXNWYWxpZERhdGUoZGF0ZSlcbiAgcmV0dXJuIGRhdGUgJiYgZGF0ZS50b0lTT1N0cmluZyAmJiBkYXRlLnRvSVNPU3RyaW5nKClcbn1cblxuLyoqXG4gKiBJbmNsdWRlcyB0aGUgcmVzdWx0cyBvZiBtYWluIHRvcC1sZXZlbCBzY2hlbWEuXG4gKiBAdHlwZWRlZiBUeXBlU3VtbWFyeVxuICogQHR5cGUge3tcbiAqICBmaWVsZHM6IE9iamVjdC48c3RyaW5nLCBGaWVsZEluZm8+O1xuICogIHRvdGFsUm93czogbnVtYmVyO1xuICogIG5lc3RlZFR5cGVzPzogT2JqZWN0LjxzdHJpbmcsIFR5cGVTdW1tYXJ5PjtcbiAqIH19XG4gKi9cblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIG9yIG1vcmUgcG90ZW50aWFsIHR5cGVzIGRpc2NvdmVyZWQgZm9yIGEgZmllbGQuIFRoZSBgdHlwZXNgIG9iamVjdCB3aWxsIGhhdmUgYSBgJHJlZmAga2V5IGlmIGFueSBuZXN0ZWQgc3RydWN0dXJlcyB3ZXJlIGZvdW5kLlxuICogQHR5cGVkZWYgRmllbGRJbmZvXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZywgc3RyaW5nIHwgRmllbGRUeXBlU3VtbWFyeT59IHR5cGVzIC0gZmllbGQgc3RhdHMgb3JnYW5pemVkIGJ5IHR5cGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gbnVsbGFibGUgLSBpcyB0aGUgZmllbGQgbnVsbGFibGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdW5pcXVlIC0gaXMgdGhlIGZpZWxkIHVuaXF1ZVxuICogQHByb3BlcnR5IHtzdHJpbmdbXXxudW1iZXJbXX0gW2VudW1dIC0gZW51bWVyYXRpb24gZGV0ZWN0ZWQsIHRoZSB2YWx1ZXMgYXJlIGxpc3RlZCBvbiB0aGlzIHByb3BlcnR5LlxuICovXG5cbi8qKlxuICogQ29udGFpbnMgc3RhdHMgZm9yIGEgZ2l2ZW4gZmllbGQncyAocG90ZW50aWFsKSB0eXBlLlxuICpcbiAqIFRPRE86IEFkZCBzdHJpbmcgcHJvcGVydHkgZm9yIHRoZSB0eXBlIG5hbWUuXG4gKiAgICBXZSBjdXJyZW50bHkgdXNlcyBvYmplY3Qga2V5IHN0cnVjdHVyZToge1wiU3RyaW5nXCI6IEZpZWxkVHlwZVN1bW1hcnl9XG4gKiBAdHlwZWRlZiBGaWVsZFR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt0eXBlQWxpYXNdIC0gZm9yIG5lc3RlZCB0eXBlIHN1cHBvcnQuXG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFt2YWx1ZV0gLSBleHRyYWN0ZWQgZmllbGQgdmFsdWVzLCBwbGFjZWQgaW50byBhbiBhcnJheS4gVGhpcyBzaW1wbGlmaWVzIChhdCBleHBlbnNlIG9mIG1lbW9yeSkgdHlwZSBhbmFseXNpcyBhbmQgc3VtbWFyaXphdGlvbiB3aGVuIGNyZWF0aW5nIHRoZSBgQWdncmVnYXRlU3VtbWFyeWAuXG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFtsZW5ndGhdIC0gc3VtbWFyeSBvZiBhcnJheSBvZiBzdHJpbmcgKG9yIGRlY2ltYWwpIHNpemVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3ByZWNpc2lvbl0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIFN1bW1hcnkgb2YgYXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGJvdGggYmVmb3JlIGFuZCBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3NjYWxlXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gU3VtbWFyeSBvZiBhcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYWZ0ZXIgdGhlIGRlY2ltYWwuXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfG51bWJlcltdfSBbZW51bV0gLSBpZiBlbnVtIHJ1bGVzIHdlcmUgdHJpZ2dlcmVkIHdpbGwgY29udGFpbiB0aGUgZGV0ZWN0ZWQgdW5pcXVlIHZhbHVlcy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjb3VudCAtIG51bWJlciBvZiB0aW1lcyB0aGUgdHlwZSB3YXMgbWF0Y2hlZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHJhbmsgLSBhYnNvbHV0ZSBwcmlvcml0eSBvZiB0aGUgZGV0ZWN0ZWQgVHlwZU5hbWUsIGRlZmluZWQgaW4gdGhlIG9iamVjdCBgdHlwZVJhbmtpbmdzYFxuICovXG5cbi8qKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcm1lZGlhdGUgc3RydWN0dXJlLlxuICogSXQgbWlycm9ycyB0aGUgYEZpZWxkU3VtbWFyeWAgdHlwZSBpdCB3aWxsIGJlY29tZS5cbiAqIEBwcml2YXRlXG4gKiBAdHlwZWRlZiBJbnRlcm5hbEZpZWxkVHlwZURhdGFcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJvcGVydHkge2FueVtdfSBbdmFsdWVdIC0gYXJyYXkgb2YgdmFsdWVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtsZW5ndGhdIC0gYXJyYXkgb2Ygc3RyaW5nIChvciBkZWNpbWFsKSBzaXplcywgcHJlIHByb2Nlc3NpbmcgaW50byBhbiBBZ2dyZWdhdGVTdW1tYXJ5XG4gKiBAcHJvcGVydHkge251bWJlcltdfSBbcHJlY2lzaW9uXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gQXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGJvdGggYmVmb3JlIGFuZCBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtzY2FsZV0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIEFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbY291bnRdIC0gbnVtYmVyIG9mIHRpbWVzIHRoZSB0eXBlIHdhcyBtYXRjaGVkXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3JhbmtdIC0gYWJzb2x1dGUgcHJpb3JpdHkgb2YgdGhlIGRldGVjdGVkIFR5cGVOYW1lLCBkZWZpbmVkIGluIHRoZSBvYmplY3QgYHR5cGVSYW5raW5nc2BcbiAqXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIHJlcHJlc2VudCBhIG51bWJlciBzZXJpZXMgb2YgYW55IHNpemUuXG4gKiBJbmNsdWRlcyB0aGUgbG93ZXN0IChgbWluYCksIGhpZ2hlc3QgKGBtYXhgKSwgbWVhbi9hdmVyYWdlIChgbWVhbmApIGFuZCBtZWFzdXJlbWVudHMgYXQgY2VydGFpbiBgcGVyY2VudGlsZXNgLlxuICogQHR5cGVkZWYgQWdncmVnYXRlU3VtbWFyeVxuICogQHR5cGUge3ttaW46IG51bWJlciwgbWF4OiBudW1iZXIsIG1lYW46IG51bWJlciwgcDI1OiBudW1iZXIsIHAzMzogbnVtYmVyLCBwNTA6IG51bWJlciwgcDY2OiBudW1iZXIsIHA3NTogbnVtYmVyLCBwOTk6IG51bWJlcn19XG4gKi9cblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIGlzIGRpc3BsYXllZCBhcyBhIGdsb2JhbCBtZW1iZXIuXG4gKiBAY2FsbGJhY2sgcHJvZ3Jlc3NDYWxsYmFja1xuICogQHBhcmFtIHt7dG90YWxSb3dzOiBudW1iZXIsIGN1cnJlbnRSb3c6IG51bWJlcn19IHByb2dyZXNzIC0gVGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgcHJvY2Vzc2luZy5cbiAqL1xuXG4vKipcbiAqIHNjaGVtYUJ1aWxkZXIoKSBpcyB0aGUgbWFpbiBmdW5jdGlvbiBhbmQgd2hlcmUgYWxsIHRoZSBhbmFseXNpcyAmIHByb2Nlc3NpbmcgaGFwcGVucy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzY2hlbWFOYW1lIFRoZSBuYW1lLCBvciBuYW1lIHByZWZpeCB0byB1c2Ugd2hlbiBhc3NlbWJsaW5nIHJlc3VsdHMuIEhlbHBmdWwgd2l0aCBuZXN0ZWQgdHlwZXMgKGFrYSBzdWItdHlwZXMuKVxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBpbnB1dCAtIFRoZSBpbnB1dCBkYXRhIHRvIGFuYWx5emUuIE11c3QgYmUgYW4gYXJyYXkgb2Ygb2JqZWN0cy5cbiAqIEBwYXJhbSB7e1xuICogICBvblByb2dyZXNzPzogcHJvZ3Jlc3NDYWxsYmFjayxcbiAqICAgZW51bU1pbmltdW1Sb3dDb3VudD86IG51bWJlcixcbiAqICAgZW51bUFic29sdXRlTGltaXQ/OiBudW1iZXIsXG4gKiAgIGVudW1QZXJjZW50VGhyZXNob2xkPzogbnVtYmVyLFxuICogICBudWxsYWJsZVJvd3NUaHJlc2hvbGQ/OiBudW1iZXIsXG4gKiAgIHVuaXF1ZVJvd3NUaHJlc2hvbGQ/OiBudW1iZXIsXG4gKiAgIHN0cmljdE1hdGNoaW5nPzogYm9vbGVhbixcbiAqICAgZGlzYWJsZU5lc3RlZFR5cGVzPzogYm9vbGVhblxuICogfX0gW29wdGlvbnNdIC0gT3B0aW9uYWwgcGFyYW1ldGVyc1xuICogQHJldHVybnMge1Byb21pc2U8VHlwZVN1bW1hcnk+fSBSZXR1cm5zIGFuZFxuICovXG5mdW5jdGlvbiBzY2hlbWFCdWlsZGVyIChcbiAgc2NoZW1hTmFtZSxcbiAgaW5wdXQsXG4gIG9wdGlvbnMgPSB7XG4gICAgb25Qcm9ncmVzczogKHsgdG90YWxSb3dzLCBjdXJyZW50Um93IH0pID0+IHt9LFxuICAgIHN0cmljdE1hdGNoaW5nOiB0cnVlLFxuICAgIGRpc2FibGVOZXN0ZWRUeXBlczogZmFsc2UsXG4gICAgZW51bU1pbmltdW1Sb3dDb3VudDogMTAwLFxuICAgIGVudW1BYnNvbHV0ZUxpbWl0OiAxMCxcbiAgICBlbnVtUGVyY2VudFRocmVzaG9sZDogMC4wMSxcbiAgICBudWxsYWJsZVJvd3NUaHJlc2hvbGQ6IDAuMDIsXG4gICAgdW5pcXVlUm93c1RocmVzaG9sZDogMS4wXG4gIH1cbikge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcpIHRocm93IEVycm9yKCdJbnB1dCBEYXRhIG11c3QgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cycpXG4gIGlmICh0eXBlb2YgaW5wdXRbMF0gIT09ICdvYmplY3QnKSB0aHJvdyBFcnJvcignSW5wdXQgRGF0YSBtdXN0IGJlIGFuIEFycmF5IG9mIE9iamVjdHMnKVxuICBpZiAoaW5wdXQubGVuZ3RoIDwgNSkgdGhyb3cgRXJyb3IoJ0FuYWx5c2lzIHJlcXVpcmVzIGF0IGxlYXN0IDUgcmVjb3Jkcy4gKFVzZSAyMDArIGZvciBncmVhdCByZXN1bHRzLiknKVxuICBjb25zdCB7XG4gICAgb25Qcm9ncmVzcyA9ICh7IHRvdGFsUm93cywgY3VycmVudFJvdyB9KSA9PiB7fSxcbiAgICBzdHJpY3RNYXRjaGluZyA9IHRydWUsXG4gICAgZGlzYWJsZU5lc3RlZFR5cGVzID0gZmFsc2UsXG4gICAgZW51bU1pbmltdW1Sb3dDb3VudCA9IDEwMCwgZW51bUFic29sdXRlTGltaXQgPSAxMCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgPSAwLjAxLFxuICAgIG51bGxhYmxlUm93c1RocmVzaG9sZCA9IDAuMDIsXG4gICAgdW5pcXVlUm93c1RocmVzaG9sZCA9IDEuMFxuICB9ID0gb3B0aW9uc1xuICBjb25zdCBpc0VudW1FbmFibGVkID0gaW5wdXQubGVuZ3RoID49IGVudW1NaW5pbXVtUm93Q291bnRcbiAgY29uc3QgbmVzdGVkRGF0YSA9IHt9XG5cbiAgbG9nKCdTdGFydGluZycpXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5wdXQpXG4gICAgLnRoZW4ocGl2b3RSb3dzR3JvdXBlZEJ5VHlwZSlcbiAgICAudGhlbihjb25kZW5zZUZpZWxkRGF0YSlcbiAgICAudGhlbihhc3luYyAoc2NoZW1hKSA9PiB7XG4gICAgICBsb2coJ0J1aWx0IHN1bW1hcnkgZnJvbSBGaWVsZCBUeXBlIGRhdGEuJylcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdnZW5TY2hlbWEnLCBKU09OLnN0cmluZ2lmeShnZW5TY2hlbWEsIG51bGwsIDIpKVxuXG4gICAgICBjb25zdCBmaWVsZHMgPSBPYmplY3Qua2V5cyhzY2hlbWEuZmllbGRzKVxuICAgICAgICAucmVkdWNlKChmaWVsZEluZm8sIGZpZWxkTmFtZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHR5cGVzSW5mbyA9IHNjaGVtYS5maWVsZHNbZmllbGROYW1lXVxuICAgICAgICAgIC8qIC8vKiBAdHlwZSB7RmllbGRJbmZvfSAqL1xuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0ge1xuICAgICAgICAgICAgLi4udHlwZXNJbmZvXG4gICAgICAgICAgfVxuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0gTWV0YUNoZWNrcy5UWVBFX0VOVU0uY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgZW51bUFic29sdXRlTGltaXQsIGVudW1QZXJjZW50VGhyZXNob2xkIH0pXG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfTlVMTEFCTEUuY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgbnVsbGFibGVSb3dzVGhyZXNob2xkIH0pXG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfVU5JUVVFLmNoZWNrKGZpZWxkSW5mb1tmaWVsZE5hbWVdLFxuICAgICAgICAgICAgeyByb3dDb3VudDogaW5wdXQubGVuZ3RoLCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIH0sXG4gICAgICAgICAgICB7IHVuaXF1ZVJvd3NUaHJlc2hvbGQgfSlcbiAgICAgICAgICAvLyB0eXBlc0luZm8uJHJlZlxuICAgICAgICAgIGNvbnN0IGlzSWRlbnRpdHkgPSAodHlwZXNJbmZvLk51bWJlciB8fCB0eXBlc0luZm8uVVVJRCkgJiYgZmllbGRJbmZvW2ZpZWxkTmFtZV0udW5pcXVlICYmIC9pZCQvaS50ZXN0KGZpZWxkTmFtZSlcbiAgICAgICAgICBpZiAoaXNJZGVudGl0eSkge1xuICAgICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0uaWRlbnRpdHkgPSB0cnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0pIHtcbiAgICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdLnVuaXF1ZUNvdW50ID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5sZW5ndGhcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpZWxkSW5mb1xuICAgICAgICB9LCB7fSlcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICB0b3RhbFJvd3M6IHNjaGVtYS50b3RhbFJvd3MsXG4gICAgICAgIG5lc3RlZFR5cGVzOiBkaXNhYmxlTmVzdGVkVHlwZXMgPyB1bmRlZmluZWQgOiBhd2FpdCBuZXN0ZWRTY2hlbWFCdWlsZGVyKG5lc3RlZERhdGEpXG4gICAgICB9XG4gICAgfSlcblxuICBmdW5jdGlvbiBuZXN0ZWRTY2hlbWFCdWlsZGVyIChuZXN0ZWREYXRhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKG5lc3RlZERhdGEpXG4gICAgICAucmVkdWNlKGFzeW5jIChuZXN0ZWRUeXBlU3VtbWFyaWVzLCBbZnVsbFR5cGVOYW1lLCBkYXRhXSkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lUGFydHMgPSBmdWxsVHlwZU5hbWUuc3BsaXQoJy4nKVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGNvbnN0IG5hbWVTdWZmaXggPSBuYW1lUGFydHNbbmFtZVBhcnRzLmxlbmd0aCAtIDFdXG4gICAgICAgIG5lc3RlZFR5cGVTdW1tYXJpZXNbZnVsbFR5cGVOYW1lXSA9IGF3YWl0IHNjaGVtYUJ1aWxkZXIobmFtZVN1ZmZpeCwgZGF0YSwgb3B0aW9ucylcbiAgICAgICAgcmV0dXJuIG5lc3RlZFR5cGVTdW1tYXJpZXNcbiAgICAgIH0sIHt9KVxuICB9XG5cbiAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3RbXX0gZG9jc1xuICAgICAqIEByZXR1cm5zIHt7IHRvdGFsUm93czogbnVtYmVyOyB1bmlxdWVzOiB7IFt4OiBzdHJpbmddOiBhbnlbXTsgfTsgZmllbGRzRGF0YTogeyBbeDogc3RyaW5nXTogSW50ZXJuYWxGaWVsZFR5cGVEYXRhW107IH07IH19IHNjaGVtYVxuICAgICAqL1xuICBmdW5jdGlvbiBwaXZvdFJvd3NHcm91cGVkQnlUeXBlIChkb2NzKSB7XG4gICAgY29uc3QgZGV0ZWN0ZWRTY2hlbWEgPSB7IHVuaXF1ZXM6IGlzRW51bUVuYWJsZWQgPyB7fSA6IG51bGwsIGZpZWxkc0RhdGE6IHt9LCB0b3RhbFJvd3M6IG51bGwgfVxuICAgIGxvZyhgICBBYm91dCB0byBleGFtaW5lIGV2ZXJ5IHJvdyAmIGNlbGwuIEZvdW5kICR7ZG9jcy5sZW5ndGh9IHJlY29yZHMuLi5gKVxuICAgIGNvbnN0IHBpdm90ZWRTY2hlbWEgPSBkb2NzLnJlZHVjZShldmFsdWF0ZVNjaGVtYUxldmVsLCBkZXRlY3RlZFNjaGVtYSlcbiAgICBsb2coJyAgRXh0cmFjdGVkIGRhdGEgcG9pbnRzIGZyb20gRmllbGQgVHlwZSBhbmFseXNpcycpXG4gICAgcmV0dXJuIHBpdm90ZWRTY2hlbWFcbiAgfVxuXG4gIC8qKlxuICAgICAqIEBwYXJhbSB7eyB0b3RhbFJvd3M6IG51bWJlcjsgdW5pcXVlczogeyBbeDogc3RyaW5nXTogYW55W107IH07IGZpZWxkc0RhdGE6IHsgW3g6IHN0cmluZ106IEludGVybmFsRmllbGRUeXBlRGF0YVtdOyB9OyB9fSBzY2hlbWFcbiAgICAgKiBAcGFyYW0ge3sgW3g6IHN0cmluZ106IGFueTsgfX0gcm93XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAgICogQHBhcmFtIHthbnlbXX0gYXJyYXlcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBldmFsdWF0ZVNjaGVtYUxldmVsIChzY2hlbWEsIHJvdywgaW5kZXgsIGFycmF5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICBzY2hlbWEudG90YWxSb3dzID0gc2NoZW1hLnRvdGFsUm93cyB8fCBhcnJheS5sZW5ndGhcbiAgICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMocm93KVxuICAgIGxvZyhgUHJvY2Vzc2luZyBSb3cgIyAke2luZGV4ICsgMX0vJHtzY2hlbWEudG90YWxSb3dzfS4uLmApXG4gICAgZmllbGROYW1lcy5mb3JFYWNoKChmaWVsZE5hbWUsIGluZGV4LCBhcnJheSkgPT4ge1xuICAgICAgaWYgKGluZGV4ID09PSAwKSBsb2coYEZvdW5kICR7YXJyYXkubGVuZ3RofSBDb2x1bW4ocykhYClcbiAgICAgIGNvbnN0IHZhbHVlID0gcm93W2ZpZWxkTmFtZV1cbiAgICAgIGNvbnN0IHR5cGVGaW5nZXJwcmludCA9IGdldEZpZWxkTWV0YWRhdGEoeyB2YWx1ZSwgc3RyaWN0TWF0Y2hpbmcgfSlcbiAgICAgIGNvbnN0IHR5cGVOYW1lcyA9IE9iamVjdC5rZXlzKHR5cGVGaW5nZXJwcmludClcbiAgICAgIGNvbnN0IGlzUG9zc2libGVFbnVtVHlwZSA9IHR5cGVOYW1lcy5pbmNsdWRlcygnTnVtYmVyJykgfHwgdHlwZU5hbWVzLmluY2x1ZGVzKCdTdHJpbmcnKVxuXG4gICAgICBpZiAoIWRpc2FibGVOZXN0ZWRUeXBlcykge1xuICAgICAgICAvLyBUT0RPOiBSZXZpZXcgaGFja2V5IHBhdHRlcm4gaGVyZSAoYnVmZmVycyB0b28gbXVjaCwgYmV0dGVyIGFzc29jaWF0aW9uIG9mIGN1c3RvbSB0eXBlcywgc2VlIGAkcmVmYClcbiAgICAgICAgLy8gU3RlcHM6IDEuIENoZWNrIGlmIEFycmF5IG9mIE9iamVjdHMsIDIuIEFkZCB0byBsb2NhbCBgbmVzdGVkRGF0YWAgdG8gaG9sZCBkYXRhIGZvciBwb3N0LXByb2Nlc3NpbmcuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gMSAmJiB0eXBlb2YgdmFsdWVbMF0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgbmVzdGVkRGF0YVtgJHtzY2hlbWFOYW1lfS4ke2ZpZWxkTmFtZX1gXSA9IG5lc3RlZERhdGFbYCR7c2NoZW1hTmFtZX0uJHtmaWVsZE5hbWV9YF0gfHwgW11cbiAgICAgICAgICBuZXN0ZWREYXRhW2Ake3NjaGVtYU5hbWV9LiR7ZmllbGROYW1lfWBdLnB1c2goLi4udmFsdWUpXG4gICAgICAgICAgdHlwZUZpbmdlcnByaW50LiRyZWYgPSBgJHtzY2hlbWFOYW1lfS4ke2ZpZWxkTmFtZX1gXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzRW51bUVuYWJsZWQgJiYgaXNQb3NzaWJsZUVudW1UeXBlKSB7XG4gICAgICAgIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gPSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIHx8IFtdXG4gICAgICAgIGlmICghc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5pbmNsdWRlcyh2YWx1ZSkpIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0ucHVzaChyb3dbZmllbGROYW1lXSlcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdID0gbnVsbFxuICAgICAgfVxuICAgICAgc2NoZW1hLmZpZWxkc0RhdGFbZmllbGROYW1lXSA9IHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gfHwgW11cbiAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0ucHVzaCh0eXBlRmluZ2VycHJpbnQpXG4gICAgfSlcbiAgICBvblByb2dyZXNzKHsgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzLCBjdXJyZW50Um93OiBpbmRleCArIDEgfSlcbiAgICByZXR1cm4gc2NoZW1hXG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZmllbGROYW1lIGtleWVkLW9iamVjdCB3aXRoIHR5cGUgZGV0ZWN0aW9uIHN1bW1hcnkgZGF0YS5cbiAqXG4gKiAjIyMgRXhhbXBsZSBgZmllbGRTdW1tYXJ5YDpcbiAqIGBgYFxuICoge1xuICogIFwiaWRcIjoge1xuICogICAgXCJVVUlEXCI6IHtcbiAqICAgICAgXCJyYW5rXCI6IDIsXG4gKiAgICAgIFwiY291bnRcIjogMjVcbiAqICAgIH0sXG4gKiAgICBcIk51bWJlclwiOiB7XG4gKiAgICAgIFwicmFua1wiOiA4LFxuICogICAgICBcImNvdW50XCI6IDEsXG4gKiAgICAgIFwidmFsdWVcIjoge1xuICogICAgICAgIFwibWluXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJtZWFuXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJtYXhcIjogOTk5OTk5OSxcbiAqICAgICAgICBcInAyNVwiOiA5OTk5OTk5LFxuICogICAgICAgIFwicDMzXCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJwNTBcIjogOTk5OTk5OSxcbiAqICAgICAgICBcInA2NlwiOiA5OTk5OTk5LFxuICogICAgICAgIFwicDc1XCI6IDk5OTk5OTksXG4gKiAgICAgICAgXCJwOTlcIjogOTk5OTk5OVxuICogICAgICB9XG4gKiAgICB9XG4gKiAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHBhcmFtIHt7IGZpZWxkc0RhdGE6IE9iamVjdC48c3RyaW5nLCBJbnRlcm5hbEZpZWxkVHlwZURhdGFbXT4sIHVuaXF1ZXM6IE9iamVjdC48c3RyaW5nLCBhbnlbXT4sIHRvdGFsUm93czogbnVtYmVyfX0gc2NoZW1hXG4gKiBAcmV0dXJucyB7e1xuICogIGZpZWxkczogT2JqZWN0LjxzdHJpbmcsIE9iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pj4sXG4gKiAgdW5pcXVlczogT2JqZWN0LjxzdHJpbmcsIGFueVtdPixcbiAqICB0b3RhbFJvd3M6IG51bWJlclxuICogfX1cbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZERhdGEgKHNjaGVtYSkge1xuICBjb25zdCB7IGZpZWxkc0RhdGEgfSA9IHNjaGVtYVxuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoZmllbGRzRGF0YSlcblxuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT4+fSAqL1xuICBjb25zdCBmaWVsZFN1bW1hcnkgPSB7fVxuICBsb2coYFByZS1jb25kZW5zZUZpZWxkU2l6ZXMoZmllbGRzW2ZpZWxkTmFtZV0pIGZvciAke2ZpZWxkTmFtZXMubGVuZ3RofSBjb2x1bW5zYClcbiAgZmllbGROYW1lc1xuICAgIC5mb3JFYWNoKChmaWVsZE5hbWUpID0+IHtcbiAgICAgIC8qKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIEludGVybmFsRmllbGRUeXBlRGF0YT59ICovXG4gICAgICBjb25zdCBwaXZvdGVkRGF0YSA9IHBpdm90RmllbGREYXRhQnlUeXBlKGZpZWxkc0RhdGFbZmllbGROYW1lXSlcbiAgICAgIGZpZWxkU3VtbWFyeVtmaWVsZE5hbWVdID0gY29uZGVuc2VGaWVsZFNpemVzKHBpdm90ZWREYXRhKVxuICAgICAgaWYgKHBpdm90ZWREYXRhLiRyZWYgJiYgcGl2b3RlZERhdGEuJHJlZi5jb3VudCA+IDEpIHtcbiAgICAgICAgLy8gUHJldmVudCBvdmVycmlkaW5nIHRoZSAkcmVmIHR5cGUgbGFiZWxcbiAgICAgICAgLy8gMS4gRmluZCB0aGUgZmlyc3QgJHJlZlxuICAgICAgICBjb25zdCByZWZUeXBlID0gZmllbGRzRGF0YVtmaWVsZE5hbWVdLmZpbmQodHlwZVJlZnMgPT4gdHlwZVJlZnMuJHJlZilcbiAgICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0uJHJlZi50eXBlQWxpYXMgPSByZWZUeXBlLiRyZWZcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coYGZpZWxkU3VtbWFyeVske2ZpZWxkTmFtZX1dYCwgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0pXG4gICAgfSlcbiAgbG9nKCdQb3N0LWNvbmRlbnNlRmllbGRTaXplcyhmaWVsZHNbZmllbGROYW1lXSknKVxuICBsb2coJ1JlcGxhY2VkIGZpZWxkRGF0YSB3aXRoIGZpZWxkU3VtbWFyeScpXG4gIHJldHVybiB7IGZpZWxkczogZmllbGRTdW1tYXJ5LCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcywgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzIH1cbn1cblxuLyogLy8qXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCB7IHZhbHVlPywgbGVuZ3RoPywgc2NhbGU/LCBwcmVjaXNpb24/LCBpbnZhbGlkPyB9PltdfSB0eXBlU2l6ZURhdGEgLSBBbiBvYmplY3QgY29udGFpbmluZyB0aGVcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywgSW50ZXJuYWxGaWVsZFR5cGVEYXRhPn1cbiAqL1xuZnVuY3Rpb24gcGl2b3RGaWVsZERhdGFCeVR5cGUgKHR5cGVTaXplRGF0YSkge1xuICAvLyBjb25zdCBibGFua1R5cGVTdW1zID0gKCkgPT4gKHsgbGVuZ3RoOiAwLCBzY2FsZTogMCwgcHJlY2lzaW9uOiAwIH0pXG4gIGxvZyhgUHJvY2Vzc2luZyAke3R5cGVTaXplRGF0YS5sZW5ndGh9IHR5cGUgZ3Vlc3Nlc2ApXG4gIHJldHVybiB0eXBlU2l6ZURhdGEucmVkdWNlKChwaXZvdGVkRGF0YSwgY3VycmVudFR5cGVHdWVzc2VzKSA9PiB7XG4gICAgT2JqZWN0LmVudHJpZXMoY3VycmVudFR5cGVHdWVzc2VzKVxuICAgICAgLm1hcCgoW3R5cGVOYW1lLCB7IHZhbHVlLCBsZW5ndGgsIHNjYWxlLCBwcmVjaXNpb24gfV0pID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHR5cGVOYW1lLCBKU09OLnN0cmluZ2lmeSh7IGxlbmd0aCwgc2NhbGUsIHByZWNpc2lvbiB9KSlcbiAgICAgICAgcGl2b3RlZERhdGFbdHlwZU5hbWVdID0gcGl2b3RlZERhdGFbdHlwZU5hbWVdIHx8IHsgdHlwZU5hbWUsIGNvdW50OiAwIH1cbiAgICAgICAgLy8gaWYgKCFwaXZvdGVkRGF0YVt0eXBlTmFtZV0uY291bnQpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCA9IDBcbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShsZW5ndGgpICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0ubGVuZ3RoKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ubGVuZ3RoID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShzY2FsZSkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5zY2FsZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShwcmVjaXNpb24pICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucHJlY2lzaW9uKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucHJlY2lzaW9uID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS52YWx1ZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlID0gW11cblxuICAgICAgICBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uY291bnQrK1xuICAgICAgICAvLyBpZiAoaW52YWxpZCAhPSBudWxsKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uaW52YWxpZCsrXG4gICAgICAgIGlmIChsZW5ndGgpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGgucHVzaChsZW5ndGgpXG4gICAgICAgIGlmIChzY2FsZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlLnB1c2goc2NhbGUpXG4gICAgICAgIGlmIChwcmVjaXNpb24pIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24ucHVzaChwcmVjaXNpb24pXG4gICAgICAgIGlmICh2YWx1ZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlLnB1c2godmFsdWUpXG4gICAgICAgIC8vIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5yYW5rID0gdHlwZVJhbmtpbmdzW3R5cGVOYW1lXVxuICAgICAgICByZXR1cm4gcGl2b3RlZERhdGFbdHlwZU5hbWVdXG4gICAgICB9KVxuICAgIHJldHVybiBwaXZvdGVkRGF0YVxuICB9LCB7fSlcbiAgLypcbiAgPiBFeGFtcGxlIG9mIHN1bUNvdW50cyBhdCB0aGlzIHBvaW50XG4gIHtcbiAgICBGbG9hdDogeyBjb3VudDogNCwgc2NhbGU6IFsgNSwgNSwgNSwgNSBdLCBwcmVjaXNpb246IFsgMiwgMiwgMiwgMiBdIH0sXG4gICAgU3RyaW5nOiB7IGNvdW50OiAzLCBsZW5ndGg6IFsgMiwgMywgNiBdIH0sXG4gICAgTnVtYmVyOiB7IGNvdW50OiAxLCBsZW5ndGg6IFsgNiBdIH1cbiAgfVxuKi9cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB3aGljaCBhbmFseXplcyBhbmQgc3VtbWFyaXplcyBlYWNoIGNvbHVtbnMgZGF0YSBieSB0eXBlLiBTb3J0IG9mIGEgaGlzdG9ncmFtIG9mIHNpZ25pZmljYW50IHBvaW50cy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBJbnRlcm5hbEZpZWxkVHlwZURhdGE+fSBwaXZvdGVkRGF0YUJ5VHlwZSAtIGEgbWFwIG9yZ2FuaXplZCBieSBUeXBlIGtleXMgKGBUeXBlTmFtZWApLCBjb250YWluaW5nIGV4dHJhY3RlZCBkYXRhIGZvciB0aGUgcmV0dXJuZWQgYEZpZWxkU3VtbWFyeWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN1bW1hcnk+fSAtIFRoZSBmaW5hbCBvdXRwdXQsIHdpdGggaGlzdG9ncmFtcyBvZiBzaWduaWZpY2FudCBwb2ludHNcbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZFNpemVzIChwaXZvdGVkRGF0YUJ5VHlwZSkge1xuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gKi9cbiAgY29uc3QgYWdncmVnYXRlU3VtbWFyeSA9IHt9XG4gIGxvZygnU3RhcnRpbmcgY29uZGVuc2VGaWVsZFNpemVzKCknKVxuICBPYmplY3Qua2V5cyhwaXZvdGVkRGF0YUJ5VHlwZSlcbiAgICAubWFwKCh0eXBlTmFtZSkgPT4ge1xuICAgICAgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0gPSB7XG4gICAgICAgIC8vIHR5cGVOYW1lLFxuICAgICAgICByYW5rOiB0eXBlUmFua2luZ3NbdHlwZU5hbWVdIHx8IC00MixcbiAgICAgICAgY291bnQ6IHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5jb3VudFxuICAgICAgfVxuICAgICAgaWYgKHR5cGVOYW1lID09PSAnJHJlZicpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3Bpdm90ZWREYXRhQnlUeXBlLiRyZWYnLCBKU09OLnN0cmluZ2lmeShwaXZvdGVkRGF0YUJ5VHlwZS4kcmVmLCBudWxsLCAyKSk7XG4gICAgICAgIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnR5cGVBbGlhcyA9IHBpdm90ZWREYXRhQnlUeXBlLiRyZWYgPyAndHJ1ZScgOiBudWxsXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnZhbHVlKSBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS52YWx1ZSA9IGdldE51bWJlclJhbmdlU3RhdHMocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnZhbHVlKVxuICAgICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmxlbmd0aCkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0ubGVuZ3RoID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ubGVuZ3RoLCB0cnVlKVxuICAgICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnNjYWxlKSBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5zY2FsZSA9IGdldE51bWJlclJhbmdlU3RhdHMocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnNjYWxlLCB0cnVlKVxuICAgICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLnByZWNpc2lvbikgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0ucHJlY2lzaW9uID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ucHJlY2lzaW9uLCB0cnVlKVxuICAgICAgfVxuXG4gICAgICAvLyBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmludmFsaWQpIHsgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uaW52YWxpZCA9IHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5pbnZhbGlkIH1cblxuICAgICAgaWYgKFsnVGltZXN0YW1wJywgJ0RhdGUnXS5pbmRleE9mKHR5cGVOYW1lKSA+IC0xKSB7XG4gICAgICAgIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlID0gZm9ybWF0UmFuZ2VTdGF0cyhhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS52YWx1ZSwgcGFyc2VEYXRlKVxuICAgICAgfVxuICAgIH0pXG4gIGxvZygnRG9uZSBjb25kZW5zZUZpZWxkU2l6ZXMoKS4uLicpXG4gIHJldHVybiBhZ2dyZWdhdGVTdW1tYXJ5XG59XG5cbmZ1bmN0aW9uIGdldEZpZWxkTWV0YWRhdGEgKHtcbiAgdmFsdWUsXG4gIHN0cmljdE1hdGNoaW5nXG59KSB7XG4gIC8vIEdldCBpbml0aWFsIHBhc3MgYXQgdGhlIGRhdGEgd2l0aCB0aGUgVFlQRV8qIGAuY2hlY2soKWAgbWV0aG9kcy5cbiAgY29uc3QgdHlwZUd1ZXNzZXMgPSBkZXRlY3RUeXBlcyh2YWx1ZSwgc3RyaWN0TWF0Y2hpbmcpXG5cbiAgLy8gQXNzaWduIGluaXRpYWwgbWV0YWRhdGEgZm9yIGVhY2ggbWF0Y2hlZCB0eXBlIGJlbG93XG4gIHJldHVybiB0eXBlR3Vlc3Nlcy5yZWR1Y2UoKGFuYWx5c2lzLCB0eXBlR3Vlc3MsIHJhbmspID0+IHtcbiAgICBsZXQgbGVuZ3RoXG4gICAgbGV0IHByZWNpc2lvblxuICAgIGxldCBzY2FsZVxuXG4gICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgcmFuazogcmFuayArIDEgfVxuXG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0FycmF5Jykge1xuICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBsZW5ndGggfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnRmxvYXQnKSB7XG4gICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZSB9XG4gICAgICBjb25zdCBzaWduaWZpY2FuZEFuZE1hbnRpc3NhID0gU3RyaW5nKHZhbHVlKS5zcGxpdCgnLicpXG4gICAgICBpZiAoc2lnbmlmaWNhbmRBbmRNYW50aXNzYS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcHJlY2lzaW9uID0gc2lnbmlmaWNhbmRBbmRNYW50aXNzYS5qb2luKCcnKS5sZW5ndGggLy8gdG90YWwgIyBvZiBudW1lcmljIHBvc2l0aW9ucyBiZWZvcmUgJiBhZnRlciBkZWNpbWFsXG4gICAgICAgIHNjYWxlID0gc2lnbmlmaWNhbmRBbmRNYW50aXNzYVsxXS5sZW5ndGhcbiAgICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgcHJlY2lzaW9uLCBzY2FsZSB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdOdW1iZXInKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSlcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHZhbHVlIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0RhdGUnIHx8IHR5cGVHdWVzcyA9PT0gJ1RpbWVzdGFtcCcpIHtcbiAgICAgIGNvbnN0IGNoZWNrZWREYXRlID0gaXNWYWxpZERhdGUodmFsdWUpXG4gICAgICBpZiAoY2hlY2tlZERhdGUpIHtcbiAgICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgdmFsdWU6IGNoZWNrZWREYXRlLmdldFRpbWUoKSB9XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBpbnZhbGlkOiB0cnVlLCB2YWx1ZTogdmFsdWUgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnU3RyaW5nJyB8fCB0eXBlR3Vlc3MgPT09ICdFbWFpbCcpIHtcbiAgICAgIGxlbmd0aCA9IFN0cmluZyh2YWx1ZSkubGVuZ3RoXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBsZW5ndGggfVxuICAgIH1cbiAgICByZXR1cm4gYW5hbHlzaXNcbiAgfSwge30pXG59XG5cbi8qKlxuICogQWNjZXB0cyBhbiBhcnJheSBvZiBudW1iZXJzIGFuZCByZXR1cm5zIHN1bW1hcnkgZGF0YSBhYm91dFxuICogIHRoZSByYW5nZSAmIHNwcmVhZCBvZiBwb2ludHMgaW4gdGhlIHNldC5cbiAqXG4gKiBAcGFyYW0ge251bWJlcltdfSBudW1iZXJzIC0gc2VxdWVuY2Ugb2YgdW5zb3J0ZWQgZGF0YSBwb2ludHNcbiAqIEByZXR1cm5zIHtBZ2dyZWdhdGVTdW1tYXJ5fVxuICovXG5mdW5jdGlvbiBnZXROdW1iZXJSYW5nZVN0YXRzIChudW1iZXJzLCB1c2VTb3J0ZWREYXRhRm9yUGVyY2VudGlsZXMgPSBmYWxzZSkge1xuICBpZiAoIW51bWJlcnMgfHwgbnVtYmVycy5sZW5ndGggPCAxKSByZXR1cm4gdW5kZWZpbmVkXG4gIGNvbnN0IHNvcnRlZE51bWJlcnMgPSBudW1iZXJzLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYSA8IGIgPyAtMSA6IGEgPT09IGIgPyAwIDogMSlcbiAgY29uc3Qgc3VtID0gbnVtYmVycy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKVxuICBpZiAodXNlU29ydGVkRGF0YUZvclBlcmNlbnRpbGVzKSBudW1iZXJzID0gc29ydGVkTnVtYmVyc1xuICByZXR1cm4ge1xuICAgIC8vIHNpemU6IG51bWJlcnMubGVuZ3RoLFxuICAgIG1pbjogc29ydGVkTnVtYmVyc1swXSxcbiAgICBtZWFuOiBzdW0gLyBudW1iZXJzLmxlbmd0aCxcbiAgICBtYXg6IHNvcnRlZE51bWJlcnNbbnVtYmVycy5sZW5ndGggLSAxXSxcbiAgICBwMjU6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC4yNSksIDEwKV0sXG4gICAgcDMzOiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuMzMpLCAxMCldLFxuICAgIHA1MDogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjUwKSwgMTApXSxcbiAgICBwNjY6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC42NiksIDEwKV0sXG4gICAgcDc1OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuNzUpLCAxMCldLFxuICAgIHA5OTogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjk5KSwgMTApXVxuICB9XG59XG5cbi8qKlxuICpcbiAqL1xuZnVuY3Rpb24gZm9ybWF0UmFuZ2VTdGF0cyAoc3RhdHMsIGZvcm1hdHRlcikge1xuICAvLyBpZiAoIXN0YXRzIHx8ICFmb3JtYXR0ZXIpIHJldHVybiB1bmRlZmluZWRcbiAgcmV0dXJuIHtcbiAgICAvLyBzaXplOiBzdGF0cy5zaXplLFxuICAgIG1pbjogZm9ybWF0dGVyKHN0YXRzLm1pbiksXG4gICAgbWVhbjogZm9ybWF0dGVyKHN0YXRzLm1lYW4pLFxuICAgIG1heDogZm9ybWF0dGVyKHN0YXRzLm1heCksXG4gICAgcDI1OiBmb3JtYXR0ZXIoc3RhdHMucDI1KSxcbiAgICBwMzM6IGZvcm1hdHRlcihzdGF0cy5wMzMpLFxuICAgIHA1MDogZm9ybWF0dGVyKHN0YXRzLnA1MCksXG4gICAgcDY2OiBmb3JtYXR0ZXIoc3RhdHMucDY2KSxcbiAgICBwNzU6IGZvcm1hdHRlcihzdGF0cy5wNzUpLFxuICAgIHA5OTogZm9ybWF0dGVyKHN0YXRzLnA5OSlcbiAgfVxufVxuXG5leHBvcnQge1xuICAvLyBwaXZvdFJvd3NHcm91cGVkQnlUeXBlIGFzIF9waXZvdFJvd3NHcm91cGVkQnlUeXBlLFxuICAvLyBldmFsdWF0ZVNjaGVtYUxldmVsIGFzIF9ldmFsdWF0ZVNjaGVtYUxldmVsLFxuICBjb25kZW5zZUZpZWxkRGF0YSBhcyBfY29uZGVuc2VGaWVsZERhdGEsXG4gIHBpdm90RmllbGREYXRhQnlUeXBlIGFzIF9waXZvdEZpZWxkRGF0YUJ5VHlwZSxcbiAgZ2V0TnVtYmVyUmFuZ2VTdGF0cyBhcyBfZ2V0TnVtYmVyUmFuZ2VTdGF0cyxcbiAgZm9ybWF0UmFuZ2VTdGF0cyBhcyBfZm9ybWF0UmFuZ2VTdGF0c1xufVxuIl0sIm5hbWVzIjpbInJlcXVpcmUkJDAiLCJnbG9iYWwiLCJpc0RhdGUiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7OztDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBYyxHQUFHLFNBQVMsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUN4QyxFQUFFLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQzFCLEVBQUUsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLENBQUM7QUFDeEIsRUFBRSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDM0MsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixHQUFHLE1BQU0sSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNqRCxJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZELEdBQUc7QUFDSCxFQUFFLE1BQU0s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QUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztBQUNuQixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ3JCLEVBQUUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLEdBQUc7QUFDSCxFQUFFLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztBQUNwQixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRTtBQUNwQyxFQUFFLElBQUksUUFBUSxHQUFHLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ2xDLEVBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFJLFFBQVEsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDakUsQ0NoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsS0FBSyxDQUFDLEdBQUcsRUFBRTtBQUNwQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDO0FBQ2pDLENBQUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7QUFDbkMsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUM3QixDQUFDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQy9CLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUMvQixDQUFDLFdBQVcsQ0FBQyxRQUFRLEdBQUdBLEVBQWEsQ0FBQztBQUN0QztBQUNBLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJO0FBQ2pDLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixFQUFFLENBQUMsQ0FBQztBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxXQUFXLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUN4QixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLFNBQVMsV0FBVyxDQUFDLFNBQVMsRUFBRTtBQUNqQyxFQUFFLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNmO0FBQ0EsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3QyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxHQUFHLElBQUksSUFBSSxDQUFDLENBQUM7QUFDYixHQUFHO0FBQ0g7QUFDQSxFQUFFLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEUsRUFBRTtBQUNGLENBQUMsV0FBVyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUyxXQUFXLENBQUMsU0FBUyxFQUFFO0FBQ2pDLEVBQUUsSUFBSSxRQUFRLENBQUM7QUFDZjtBQUNBLEVBQUUsU0FBUyxLQUFLLENBQUMsR0FBRyxJQUFJLEVBQUU7QUFDMUI7QUFDQSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQ3ZCLElBQUksT0FBTztBQUNYLElBQUk7QUFDSjtBQUNBLEdBQUcsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ3RCO0FBQ0E7QUFDQSxHQUFHLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUM7QUFDbkMsR0FBRyxNQUFNLEVBQUUsR0FBRyxJQUFJLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQ3hDLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7QUFDbEIsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztBQUN4QixHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQztBQUNuQjtBQUNBLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekM7QUFDQSxHQUFHLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO0FBQ3BDO0FBQ0EsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUk7QUFDSjtBQUNBO0FBQ0EsR0FBRyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDakIsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxLQUFLO0FBQ2pFO0FBQ0EsSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDeEIsS0FBSyxPQUFPLEtBQUssQ0FBQztBQUNsQixLQUFLO0FBQ0wsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNaLElBQUksTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyRCxJQUFJLElBQUksT0FBTyxTQUFTLEtBQUssVUFBVSxFQUFFO0FBQ3pDLEtBQUssTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLEtBQUssS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDO0FBQ0E7QUFDQSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNCLEtBQUssS0FBSyxFQUFFLENBQUM7QUFDYixLQUFLO0FBQ0wsSUFBSSxPQUFPLEtBQUssQ0FBQztBQUNqQixJQUFJLENBQUMsQ0FBQztBQUNOO0FBQ0E7QUFDQSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQztBQUNBLEdBQUcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDO0FBQzdDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDM0IsR0FBRztBQUNIO0FBQ0EsRUFBRSxLQUFLLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUM5QixFQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCxFQUFFLEtBQUssQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzVDLEVBQUUsS0FBSyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdkMsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUMxQixFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxJQUFJLE9BQU8sV0FBVyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7QUFDOUMsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLEdBQUc7QUFDSDtBQUNBLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEM7QUFDQSxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxTQUFTLE9BQU8sR0FBRztBQUNwQixFQUFFLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BELEVBQUUsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDcEIsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDMUMsR0FBRyxPQUFPLElBQUksQ0FBQztBQUNmLEdBQUc7QUFDSCxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxTQUFTLE1BQU0sQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFO0FBQ3ZDLEVBQUUsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztBQUNsSCxFQUFFLFFBQVEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUMxQixFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxTQUFTLE1BQU0sQ0FBQyxVQUFVLEVBQUU7QUFDN0IsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQy9CO0FBQ0EsRUFBRSxXQUFXLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUN6QixFQUFFLFdBQVcsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ3pCO0FBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNSLEVBQUUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxRQUFRLEdBQUcsVUFBVSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkYsRUFBRSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQzNCO0FBQ0EsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1QixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDbEI7QUFDQSxJQUFJLFNBQVM7QUFDYixJQUFJO0FBQ0o7QUFDQSxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMvQztBQUNBLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQzlCLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN6RSxJQUFJLE1BQU07QUFDVixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMvRCxJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JELEdBQUcsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUQsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUyxPQUFPLEdBQUc7QUFDcEIsRUFBRSxNQUFNLFVBQVUsR0FBRztBQUNyQixHQUFHLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQ3hDLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUM7QUFDMUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN6QixFQUFFLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDeEIsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyQyxHQUFHLE9BQU8sSUFBSSxDQUFDO0FBQ2YsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNSLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFDVjtBQUNBLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzVELEdBQUcsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN4QyxJQUFJLE9BQU8sS0FBSyxDQUFDO0FBQ2pCLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1RCxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNoQixJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNmLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDOUIsRUFBRSxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUU7QUFDMUIsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM1QixFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFO0FBQ3RCLEVBQUUsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO0FBQzVCLEdBQUcsT0FBTyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDbkMsR0FBRztBQUNILEVBQUUsT0FBTyxHQUFHLENBQUM7QUFDYixFQUFFO0FBQ0Y7QUFDQSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDeEM7QUFDQSxDQUFDLE9BQU8sV0FBVyxDQUFDO0FBQ3BCLENBQUM7QUFDRDtBQUNBLFVBQWMsR0FBRyxLQUFLO0FDelF0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLGtCQUFrQixHQUFHLFVBQVUsQ0FBQztBQUNoQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDcEIsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGVBQWUsR0FBRyxZQUFZLEVBQUUsQ0FBQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxHQUFHO0FBQ2pCLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsQ0FBQztBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxTQUFTLEdBQUc7QUFDckI7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3ZILEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDZCxFQUFFO0FBQ0Y7QUFDQTtBQUNBLENBQUMsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO0FBQ2xJLEVBQUUsT0FBTyxLQUFLLENBQUM7QUFDZixFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxPQUFPLENBQUMsT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCO0FBQ3pKO0FBQ0EsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDckk7QUFDQTtBQUNBLEdBQUcsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeko7QUFDQSxHQUFHLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztBQUM3SCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFDMUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFO0FBQ3RDLEVBQUUsSUFBSSxDQUFDLFNBQVM7QUFDaEIsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDaEMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ1QsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDaEMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDO0FBQ0EsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUN0QixFQUFFLE9BQU87QUFDVCxFQUFFO0FBQ0Y7QUFDQSxDQUFDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ2xDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsS0FBSyxJQUFJO0FBQ3pDLEVBQUUsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQ3RCLEdBQUcsT0FBTztBQUNWLEdBQUc7QUFDSCxFQUFFLEtBQUssRUFBRSxDQUFDO0FBQ1YsRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDdEI7QUFDQTtBQUNBLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNqQixHQUFHO0FBQ0gsRUFBRSxDQUFDLENBQUM7QUFDSjtBQUNBLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFO0FBQ3RCO0FBQ0E7QUFDQSxDQUFDLE9BQU8sT0FBTyxPQUFPLEtBQUssUUFBUTtBQUNuQyxFQUFFLE9BQU8sQ0FBQyxHQUFHO0FBQ2IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQzFCLENBQUMsSUFBSTtBQUNMLEVBQUUsSUFBSSxVQUFVLEVBQUU7QUFDbEIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDaEQsR0FBRyxNQUFNO0FBQ1QsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QyxHQUFHO0FBQ0gsRUFBRSxDQUFDLE9BQU8sS0FBSyxFQUFFO0FBQ2pCO0FBQ0E7QUFDQSxFQUFFO0FBQ0YsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxJQUFJLEdBQUc7QUFDaEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNQLENBQUMsSUFBSTtBQUNMLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZDLEVBQUUsQ0FBQyxPQUFPLEtBQUssRUFBRTtBQUNqQjtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUU7QUFDL0QsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDeEIsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNWLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFlBQVksR0FBRztBQUN4QixDQUFDLElBQUk7QUFDTDtBQUNBO0FBQ0EsRUFBRSxPQUFPLFlBQVksQ0FBQztBQUN0QixFQUFFLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDakI7QUFDQTtBQUNBLEVBQUU7QUFDRixDQUFDO0FBQ0Q7QUFDQSxjQUFjLEdBQUdBLE1BQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDOUM7QUFDQSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRTtBQUM1QixDQUFDLElBQUk7QUFDTCxFQUFFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixFQUFFLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDakIsRUFBRSxPQUFPLDhCQUE4QixHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFDeEQsRUFBRTtBQUNGLENBQUM7Ozs7Ozs7OztBQ3ZRRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQztBQUM5QjtBQUNBO0FBQ0EsSUFBSSxVQUFVLEdBQUcsT0FBT0MsY0FBTSxJQUFJLFFBQVEsSUFBSUEsY0FBTSxJQUFJQSxjQUFNLENBQUMsTUFBTSxLQUFLLE1BQU0sSUFBSUEsY0FBTSxDQUFDO0FBQzNGO0FBQ0E7QUFDQSxJQUFJLFdBQVcsR0FBRyxDQUE4QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQztBQUN4RjtBQUNBO0FBQ0EsSUFBSSxVQUFVLEdBQUcsV0FBVyxJQUFJLFFBQWEsSUFBSSxRQUFRLElBQUksTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUM7QUFDbEc7QUFDQTtBQUNBLElBQUksYUFBYSxHQUFHLFVBQVUsSUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLFdBQVcsQ0FBQztBQUNyRTtBQUNBO0FBQ0EsSUFBSSxXQUFXLEdBQUcsYUFBYSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUM7QUFDdEQ7QUFDQTtBQUNBLElBQUksUUFBUSxJQUFJLFdBQVc7QUFDM0IsRUFBRSxJQUFJO0FBQ04sSUFBSSxPQUFPLFdBQVcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RELEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ2hCLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDTDtBQUNBO0FBQ0EsSUFBSSxVQUFVLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsU0FBUyxDQUFDLElBQUksRUFBRTtBQUN6QixFQUFFLE9BQU8sU0FBUyxLQUFLLEVBQUU7QUFDekIsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QixHQUFHLENBQUM7QUFDSixDQUFDO0FBQ0Q7QUFDQTtBQUNBLElBQUksV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxjQUFjLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFO0FBQzNCLEVBQUUsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUM7QUFDdEUsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxHQUFHLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFO0FBQzdCLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxJQUFJLFFBQVEsQ0FBQztBQUM3QyxDQUFDO0FBQ0Q7QUFDQSxjQUFjLEdBQUcsTUFBTTtHQ3hHdkIsTUFBTSxVQUFVLEdBQUc7QUFDbkIsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7QUFDNUQsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7QUFDNUQsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7QUFDNUQsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7QUFDNUQsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUs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SyxPQUFPLEVBQUU7QUFDL0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBQztBQUMvQixNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssR0FBRTtBQUM3RCxNQUFNLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUM7QUFDN0QsTUFBTSxJQUFJLHNCQUFzQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDL0MsUUFBUSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU07QUFDMUQsUUFBUSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTTtBQUNoRCxRQUFRLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEdBQUU7QUFDMUUsT0FBTztBQUNQLEtBQUs7QUFDTCxJQUFJLElBQUksU0FBUyxLQUFLLFFBQVEsRUFBRTtBQUNoQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFDO0FBQzNCLE1BQU0sUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxHQUFFO0FBQzdELEtBQUs7QUFDTCxJQUFJLElBQUksU0FBUyxLQUFLLE1BQU0sSUFBSSxTQUFTLEtBQUssV0FBVyxFQUFFO0FBQzNELE1BQU0sTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssRUFBQztBQUM1QyxNQUFNLElBQUksV0FBVyxFQUFFO0FBQ3ZCLFFBQVEsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsR0FBRTtBQUN0RjtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTCxJQUFJLElBQUksU0FBUyxLQUFLLFFBQVEsSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFO0FBQ3pELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFNO0FBQ25DLE1BQU0sUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxHQUFFO0FBQzlELEtBQUs7QUFDTCxJQUFJLE9BQU8sUUFBUTtBQUNuQixHQUFHLEVBQUUsRUFBRSxDQUFDO0FBQ1IsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLG1CQUFtQixFQUFFLE9BQU8sRUFBRSwyQkFBMkIsR0FBRyxLQUFLLEVBQUU7QUFDNUUsRUFBRSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE9BQU8sU0FBUztBQUN0RCxFQUFFLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ3BGLEVBQUUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUM7QUFDaEQsRUFBRSxJQUFJLDJCQUEyQixFQUFFLE9BQU8sR0FBRyxjQUFhO0FBQzFELEVBQUUsT0FBTztBQUNUO0FBQ0EsSUFBSSxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUN6QixJQUFJLElBQUksRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU07QUFDOUIsSUFBSSxHQUFHLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLGdCQUFnQixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDN0M7QUFDQSxFQUFFLE9BQU87QUFDVDtBQUNBLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksSUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQy9CLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLEdBQUc7QUFDSCxDQUFDIn0=
