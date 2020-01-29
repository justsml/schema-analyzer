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
  `$`, `¢`, `£`, `¤`, `¥`, `֏`, `؋`, `߾`, `߿`, `৲`, `৳`, `৻`,
  `૱`, `௹`, `฿`, `៛`, `₠`, `₡`, `₢`, `₣`, `₤`, `₥`, `₦`, `₧`,
  `₨`, `₩`, `₪`, `₫`, `€`, `₭`, `₮`, `₯`, `₰`, `₱`, `₲`, `₳`,
  `₴`, `₵`, `₶`, `₷`, `₸`, `₹`, `₺`, `₻`, `₼`, `₽`, `₾`, `₿`,
  `꠸`, `﷼`, `﹩`, `＄`, `￠`, `￡`, `￥`, `￦`,
  `𑿝`, `𑿞`, `𑿟`, `𑿠`, `𞋿`, `𞲰`
];

const boolishPattern = /^([YN]|(TRUE)|(FALSE))$/i;
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const objectIdPattern = /^[a-f\d]{24}$/i;
const dateStringPattern = /^([+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([.,]\d+(?!:))?)?(\17[0-5]\d([.,]\d+)?)?([zZ]|([+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
const timestampPattern = /^[12]\d{12}$/;
const numberishPattern = /^-?[\d.,]+$/;
const floatPattern = /\d\.\d/;
// const emailPattern = /^[^@]+@[^@]{2,}\.[^@]{2,}[^.]$/
const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
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

function isTimestamp(value) {
  if (value == null) return false
  value = String(value).trim();
  return timestampPattern.test(value)
}

function isCurrency(value) {
  if (value == null) return false
  value = String(value).trim();
  const valueSymbol = currencies.find(curSymbol => value.indexOf(curSymbol) > -1);
  if (!valueSymbol) return false
  value = value.replace(valueSymbol, ``);
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

function isEmailShaped(value) {
  if (value == null) return false
  value = String(value).trim();
  if (value.includes(' ') || !value.includes('@')) return false
  return value.length >= 5 && value.length < 80 && emailPattern.test(value)
}

function isNullish (value) {
  return value === null || nullishPattern.test(String(value).trim())
}function detectTypes (value) {
  return prioritizedTypes.reduce((types, typeHelper) => {
    if (typeHelper.check(value)) types.push(typeHelper.type);
    return types
  }, [])
}

// Basic Type Filters - rudimentary data sniffing used to tally up "votes" for a given field
/**
 * Detect ambiguous field type.
 * Will not affect weighted field analysis.
 */
const TYPE_UNKNOWN = {
  type: 'Unknown',
  check: value => value === '' || value === undefined || value === 'undefined'
};
const TYPE_OBJECT_ID = {
  type: 'ObjectId',
  check: isObjectId
};
const TYPE_UUID = {
  type: 'UUID',
  check: isUuid
};
const TYPE_BOOLEAN = {
  type: 'Boolean',
  check: isBoolish
};
const TYPE_DATE = {
  type: 'Date',
  check: isDateString
};
const TYPE_TIMESTAMP = {
  type: 'Timestamp',
  check: isTimestamp
};
const TYPE_CURRENCY = {
  type: 'Currency',
  check: isCurrency
};
const TYPE_FLOAT = {
  type: 'Float',
  check: isFloatish
};
const TYPE_NUMBER = {
  type: 'Number',
  check: value => {
    return !!(value !== null && !Array.isArray(value) && (Number.isInteger(value) || isNumeric(value)))
  }
};
const TYPE_EMAIL = {
  type: 'Email',
  check: isEmailShaped
};
const TYPE_STRING = {
  type: 'String',
  check: value => typeof value === 'string' && value.length >= 1
};
const TYPE_ARRAY = {
  type: 'Array',
  check: value => {
    return Array.isArray(value)
  }
};
const TYPE_OBJECT = {
  type: 'Object',
  check: value => {
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


function schemaBuilder (name, data, onProgress = ({totalRows, currentRow, columns}) => {}) {
  // const { promise, resolve, reject } = FP.unpack()
  if (typeof name !== 'string') throw Error('Argument `name` must be a String')
  if (!Array.isArray(data)) throw Error('Input Data must be an Array of Objects')
  log('Starting');
  const detectedSchema = { uniques: {}, fieldsData: {}, totalRecords: null };
  return Promise.resolve(data)
    .then(docs => {
      log(`  About to examine every row & cell. Found ${docs.length} records...`);
      const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
      log('  Extracted data points from Field Type analysis');
      return pivotedSchema
    })
    .then(schema => condenseFieldData(schema))
    .then(genSchema => {
      log('Built summary from Field Type data.');
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const uniques = Object.keys(genSchema.fieldsData)
      .reduce((uniques, fieldName) => {
        if (genSchema.uniques[fieldName]) {
          uniques[fieldName] = genSchema.uniques[fieldName].length;
        }
        return uniques
      }, {});

      return {
        totalRows: genSchema.totalRecords,
        uniques: uniques,
        fields: genSchema.fieldsData
      }
    })

    function evaluateSchemaLevel (schema, row, index, array) { // eslint-disable-line
      schema = schema;
      schema.totalRecords = schema.totalRecords || array.length;
      const fieldNames = Object.keys(row);
      log(`Processing Row # ${index + 1}/${schema.totalRecords}...`);
      onProgress({ totalRows: schema.totalRecords, currentRow: index + 1, columns: fieldNames });
      fieldNames.forEach((fieldName, index, array) => {
        if (index === 0) log(`Found ${array.length} Column(s)!`);
        const typeFingerprint = getFieldMetadata({
          schema,
          fieldName,
          value: row[fieldName]
        });
        schema.uniques[fieldName] = schema.uniques[fieldName] || [];
        if (!schema.uniques[fieldName].includes(row[fieldName])) schema.uniques[fieldName].push(row[fieldName]);
        schema.fieldsData[fieldName] = schema.fieldsData[fieldName] || [];
        schema.fieldsData[fieldName].push(typeFingerprint);
      });
      return schema
    }
}


function condenseFieldData (schema) {
  const fieldsData = schema.fieldsData;
  const fieldNames = Object.keys(fieldsData);

  // console.log('condensefieldData', fieldNames)
  const fieldSummary = {};
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`);
  fieldNames
    .forEach((fieldName) => {
      fieldSummary[fieldName] = condenseFieldSizes(fieldsData[fieldName]);
    });
  log('Post-condenseFieldSizes(fields[fieldName])');
  schema.fieldsData = fieldSummary;
  log('Replaced fieldData with fieldSummary');
  return schema
}
function condenseFieldSizes (typeSizesList) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  const sumCounts = {};
  log(`Processing ${typeSizesList.length} type guesses`);
  typeSizesList.map(currentTypeGuesses => {
    const typeSizes = Object.entries(currentTypeGuesses)
      .map(([typeName, { value, length, scale, precision }]) => {
      // console.log(typeName, JSON.stringify({ length, scale, precision }))
        sumCounts[typeName] = sumCounts[typeName] || { count: 0 };
        if (!sumCounts[typeName].count) sumCounts[typeName].count = 0;
        if (Number.isFinite(length) && !sumCounts[typeName].length) sumCounts[typeName].length = [];
        if (Number.isFinite(scale) && !sumCounts[typeName].scale) sumCounts[typeName].scale = [];
        if (Number.isFinite(precision) && !sumCounts[typeName].precision) sumCounts[typeName].precision = [];
        if (Number.isFinite(value) && !sumCounts[typeName].value) sumCounts[typeName].value = [];

        sumCounts[typeName].count++;
        if (length) sumCounts[typeName].length.push(length);
        if (scale) sumCounts[typeName].scale.push(scale);
        if (precision) sumCounts[typeName].precision.push(precision);
        if (value) sumCounts[typeName].value.push(value);
        sumCounts[typeName].rank = typeRankings[typeName];
        return sumCounts[typeName]
      });
  });
  /*
  > Example of sumCounts at this point
  {
    Float: { count: 4, scale: [ 5, 5, 5, 5 ], precision: [ 2, 2, 2, 2 ] },
    String: { count: 3, length: [ 2, 3, 6 ] },
    Number: { count: 1, length: [ 6 ] }
  }
  */
  log('Condensing data points to stats summaries...');
  Object.keys(sumCounts)
    .map(typeName => {
      // if (!sizeRangeSummary[typeName]) sizeRangeSummary[typeName] = {}
      if (sumCounts[typeName].value) sumCounts[typeName].value = getNumberRangeStats(sumCounts[typeName].value);
      if (sumCounts[typeName].length) sumCounts[typeName].length = getNumberRangeStats(sumCounts[typeName].length);
      if (sumCounts[typeName].scale) sumCounts[typeName].scale = getNumberRangeStats(sumCounts[typeName].scale);
      if (sumCounts[typeName].precision) sumCounts[typeName].precision = getNumberRangeStats(sumCounts[typeName].precision);
      // if (sumCounts[typeName].count) sumCounts[typeName].count = sumCounts[typeName].count

    });
  log('Done condensing data points...');
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
  const typeGuesses = detectTypes(value);

  const typeAnalysis = typeGuesses.reduce((analysis, typeGuess, rank) => {
    let length;
    let precision;
    let scale;

    analysis[typeGuess] = { rank: rank + 1 };

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
    if (typeGuess === 'String') {
      length = String(value).length;
      analysis[typeGuess] = { ...analysis[typeGuess], length };
    }
    if (typeGuess === 'Array') {
      length = value.length;
      analysis[typeGuess] = { ...analysis[typeGuess], length };
    }
    return analysis
  }, {});

  return typeAnalysis
}

function getNumberRangeStats (numbers) {
  if (!numbers || numbers.length < 1) return undefined
  numbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1);
  const sum = numbers.reduce((a, b) => a + b, 0);
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
}exports.condenseFieldData=condenseFieldData;exports.condenseFieldSizes=condenseFieldSizes;exports.getNumberRangeStats=getNumberRangeStats;exports.schemaBuilder=schemaBuilder;Object.defineProperty(exports,'__esModule',{value:true});})));//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLnVtZC5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdHlwZS1oZWxwZXJzLmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBBY3RpdmUgYGRlYnVnYCBpbnN0YW5jZXMuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmluc3RhbmNlcyA9IFtdO1xuXG5cdC8qKlxuXHQqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuXHQqL1xuXG5cdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0LyoqXG5cdCogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuXHQqXG5cdCogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuXHQqL1xuXHRjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzID0ge307XG5cblx0LyoqXG5cdCogU2VsZWN0cyBhIGNvbG9yIGZvciBhIGRlYnVnIG5hbWVzcGFjZVxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBzdHJpbmcgZm9yIHRoZSBmb3IgdGhlIGRlYnVnIGluc3RhbmNlIHRvIGJlIGNvbG9yZWRcblx0KiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBBbiBBTlNJIGNvbG9yIGNvZGUgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG5cdFx0bGV0IGhhc2ggPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0aGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcblx0XHR9XG5cblx0XHRyZXR1cm4gY3JlYXRlRGVidWcuY29sb3JzW01hdGguYWJzKGhhc2gpICUgY3JlYXRlRGVidWcuY29sb3JzLmxlbmd0aF07XG5cdH1cblx0Y3JlYXRlRGVidWcuc2VsZWN0Q29sb3IgPSBzZWxlY3RDb2xvcjtcblxuXHQvKipcblx0KiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAcmV0dXJuIHtGdW5jdGlvbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblx0XHRsZXQgcHJldlRpbWU7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHRcdGNvbnN0IGZvcm1hdHRlciA9IGNyZWF0ZURlYnVnLmZvcm1hdHRlcnNbZm9ybWF0XTtcblx0XHRcdFx0aWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCB2YWwgPSBhcmdzW2luZGV4XTtcblx0XHRcdFx0XHRtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cblx0XHRcdFx0XHQvLyBOb3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG5cdFx0XHRcdFx0YXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG5cdFx0XHRjcmVhdGVEZWJ1Zy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cblx0XHRcdGNvbnN0IGxvZ0ZuID0gc2VsZi5sb2cgfHwgY3JlYXRlRGVidWcubG9nO1xuXHRcdFx0bG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0ZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXHRcdGRlYnVnLmVuYWJsZWQgPSBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHQvLyBEZWJ1Zy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcblx0XHQvLyBkZWJ1Zy5yYXdMb2cgPSByYXdMb2c7XG5cblx0XHQvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0XHRjb25zdCBpbmRleCA9IGNyZWF0ZURlYnVnLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuXHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdGNyZWF0ZURlYnVnLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChuYW1lc3BhY2UsIGRlbGltaXRlcikge1xuXHRcdGNvbnN0IG5ld0RlYnVnID0gY3JlYXRlRGVidWcodGhpcy5uYW1lc3BhY2UgKyAodHlwZW9mIGRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnOicgOiBkZWxpbWl0ZXIpICsgbmFtZXNwYWNlKTtcblx0XHRuZXdEZWJ1Zy5sb2cgPSB0aGlzLmxvZztcblx0XHRyZXR1cm4gbmV3RGVidWc7XG5cdH1cblxuXHQvKipcblx0KiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG5cdCogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcblx0XHRjcmVhdGVEZWJ1Zy5zYXZlKG5hbWVzcGFjZXMpO1xuXG5cdFx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0XHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdFx0bGV0IGk7XG5cdFx0Y29uc3Qgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuXHRcdGNvbnN0IGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKCFzcGxpdFtpXSkge1xuXHRcdFx0XHQvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0bmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG5cblx0XHRcdGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBjcmVhdGVEZWJ1Zy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGluc3RhbmNlID0gY3JlYXRlRGVidWcuaW5zdGFuY2VzW2ldO1xuXHRcdFx0aW5zdGFuY2UuZW5hYmxlZCA9IGNyZWF0ZURlYnVnLmVuYWJsZWQoaW5zdGFuY2UubmFtZXNwYWNlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdGNyZWF0ZURlYnVnLmVuYWJsZShjcmVhdGVEZWJ1Zy5sb2FkKCkpO1xuXG5cdHJldHVybiBjcmVhdGVEZWJ1Zztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cDtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG5cdC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG5cdC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG5cdHJldHVybiB0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcgJiZcblx0XHRjb25zb2xlLmxvZyAmJlxuXHRcdGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHByb2Nlc3NgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlUHJvY2VzcyA9IG1vZHVsZUV4cG9ydHMgJiYgZnJlZUdsb2JhbC5wcm9jZXNzO1xuXG4vKiogVXNlZCB0byBhY2Nlc3MgZmFzdGVyIE5vZGUuanMgaGVscGVycy4gKi9cbnZhciBub2RlVXRpbCA9IChmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZnJlZVByb2Nlc3MgJiYgZnJlZVByb2Nlc3MuYmluZGluZygndXRpbCcpO1xuICB9IGNhdGNoIChlKSB7fVxufSgpKTtcblxuLyogTm9kZS5qcyBoZWxwZXIgcmVmZXJlbmNlcy4gKi9cbnZhciBub2RlSXNEYXRlID0gbm9kZVV0aWwgJiYgbm9kZVV0aWwuaXNEYXRlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2FwcGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRGF0ZWAgd2l0aG91dCBOb2RlLmpzIG9wdGltaXphdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNEYXRlKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGRhdGVUYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBEYXRlYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRGF0ZShuZXcgRGF0ZSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0RhdGUoJ01vbiBBcHJpbCAyMyAyMDEyJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNEYXRlID0gbm9kZUlzRGF0ZSA/IGJhc2VVbmFyeShub2RlSXNEYXRlKSA6IGJhc2VJc0RhdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRGF0ZTtcbiIsImltcG9ydCBpc0RhdGUgZnJvbSAnbG9kYXNoLmlzZGF0ZSdcbmV4cG9ydCB7XG4gIGlzQm9vbGlzaCxcbiAgaXNDdXJyZW5jeSxcbiAgaXNEYXRlU3RyaW5nLFxuICBpc0VtYWlsU2hhcGVkLFxuICBpc0Zsb2F0aXNoLFxuICBpc051bGxpc2gsXG4gIGlzTnVtZXJpYyxcbiAgaXNPYmplY3RJZCxcbiAgaXNUaW1lc3RhbXAsXG4gIGlzVXVpZFxufVxuXG5jb25zdCBjdXJyZW5jaWVzID0gW1xuICBgJGAsIGDComAsIGDCo2AsIGDCpGAsIGDCpWAsIGDWj2AsIGDYi2AsIGDfvmAsIGDfv2AsIGDgp7JgLCBg4KezYCwgYOCnu2AsXG4gIGDgq7FgLCBg4K+5YCwgYOC4v2AsIGDhn5tgLCBg4oKgYCwgYOKCoWAsIGDigqJgLCBg4oKjYCwgYOKCpGAsIGDigqVgLCBg4oKmYCwgYOKCp2AsXG4gIGDigqhgLCBg4oKpYCwgYOKCqmAsIGDigqtgLCBg4oKsYCwgYOKCrWAsIGDigq5gLCBg4oKvYCwgYOKCsGAsIGDigrFgLCBg4oKyYCwgYOKCs2AsXG4gIGDigrRgLCBg4oK1YCwgYOKCtmAsIGDigrdgLCBg4oK4YCwgYOKCuWAsIGDigrpgLCBg4oK7YCwgYOKCvGAsIGDigr1gLCBg4oK+YCwgYOKCv2AsXG4gIGDqoLhgLCBg77e8YCwgYO+5qWAsIGDvvIRgLCBg77+gYCwgYO+/oWAsIGDvv6VgLCBg77+mYCxcbiAgYPCRv51gLCBg8JG/nmAsIGDwkb+fYCwgYPCRv6BgLCBg8J6Lv2AsIGDwnrKwYFxuXVxuXG5jb25zdCBib29saXNoUGF0dGVybiA9IC9eKFtZTl18KFRSVUUpfChGQUxTRSkpJC9pXG5jb25zdCB1dWlkUGF0dGVybiA9IC9eWzAtOWEtZkEtRl17OH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17MTJ9JC9cbmNvbnN0IG9iamVjdElkUGF0dGVybiA9IC9eW2EtZlxcZF17MjR9JC9pXG5jb25zdCBkYXRlU3RyaW5nUGF0dGVybiA9IC9eKFsrLV0/XFxkezR9KD8hXFxkezJ9XFxiKSkoKC0/KSgoMFsxLTldfDFbMC0yXSkoXFwzKFsxMl1cXGR8MFsxLTldfDNbMDFdKSk/fFcoWzAtNF1cXGR8NVswLTJdKSgtP1sxLTddKT98KDAwWzEtOV18MFsxLTldXFxkfFsxMl1cXGR7Mn18MyhbMC01XVxcZHw2WzEtNl0pKSkoW1RcXHNdKCgoWzAxXVxcZHwyWzAtM10pKCg6PylbMC01XVxcZCk/fDI0XFw6PzAwKShbLixdXFxkKyg/ITopKT8pPyhcXDE3WzAtNV1cXGQoWy4sXVxcZCspPyk/KFt6Wl18KFsrLV0pKFswMV1cXGR8MlswLTNdKTo/KFswLTVdXFxkKT8pPyk/KT8kL1xuY29uc3QgdGltZXN0YW1wUGF0dGVybiA9IC9eWzEyXVxcZHsxMn0kL1xuY29uc3QgY3VycmVuY3lQYXR0ZXJuVVMgPSAvXlxccHtTY31cXHM/W1xcZCwuXSskL3VpZ1xuY29uc3QgY3VycmVuY3lQYXR0ZXJuRVUgPSAvXltcXGQsLl0rXFxzP1xccHtTY30kL3VpZ1xuY29uc3QgbnVtYmVyaXNoUGF0dGVybiA9IC9eLT9bXFxkLixdKyQvXG5jb25zdCBmbG9hdFBhdHRlcm4gPSAvXFxkXFwuXFxkL1xuLy8gY29uc3QgZW1haWxQYXR0ZXJuID0gL15bXkBdK0BbXkBdezIsfVxcLlteQF17Mix9W14uXSQvXG5jb25zdCBlbWFpbFBhdHRlcm4gPSAvXlxcdysoW1xcLi1dP1xcdyspKkBcXHcrKFtcXC4tXT9cXHcrKSooXFwuXFx3ezIsM30pKyQvXG5jb25zdCBudWxsaXNoUGF0dGVybiA9IC9udWxsL2lcbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC9pZ21cblxuZnVuY3Rpb24gaXNCb29saXNoICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDw9IDYgJiYgYm9vbGlzaFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc1V1aWQgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCA0MCAmJiB1dWlkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuZnVuY3Rpb24gaXNPYmplY3RJZCAodmFsdWUsIGZpZWxkTmFtZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDQwICYmIG9iamVjdElkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0RhdGVTdHJpbmcgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gbm90IGJ1bGxldC1wcm9vZiwgbWVhbnQgdG8gc25pZmYgaW50ZW50aW9uIGluIHRoZSBkYXRhXG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHJldHVybiB0cnVlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIGRhdGVTdHJpbmdQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzVGltZXN0YW1wKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdGltZXN0YW1wUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0N1cnJlbmN5KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICBjb25zdCB2YWx1ZVN5bWJvbCA9IGN1cnJlbmNpZXMuZmluZChjdXJTeW1ib2wgPT4gdmFsdWUuaW5kZXhPZihjdXJTeW1ib2wpID4gLTEpXG4gIGlmICghdmFsdWVTeW1ib2wpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UodmFsdWVTeW1ib2wsIGBgKVxuICByZXR1cm4gaXNOdW1lcmljKHZhbHVlKVxuICAvLyBjb25zb2xlLmxvZyh2YWx1ZSwgJ2N1cnJlbmN5UGF0dGVyblVTJywgY3VycmVuY3lQYXR0ZXJuVVMudGVzdCh2YWx1ZSksICdjdXJyZW5jeVBhdHRlcm5FVScsIGN1cnJlbmN5UGF0dGVybkVVLnRlc3QodmFsdWUpKTtcbiAgLy8gcmV0dXJuIGN1cnJlbmN5UGF0dGVyblVTLnRlc3QodmFsdWUpIHx8IGN1cnJlbmN5UGF0dGVybkVVLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyAodmFsdWUsIGZpZWxkTmFtZSkge1xuICAvLyBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIG51bWJlcmlzaFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNGbG9hdGlzaCAodmFsdWUpIHtcbiAgcmV0dXJuICEhKGlzTnVtZXJpYyhTdHJpbmcodmFsdWUpKSAmJiBmbG9hdFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKSAmJiAhTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpXG59XG5cbmZ1bmN0aW9uIGlzRW1haWxTaGFwZWQodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGlmICh2YWx1ZS5pbmNsdWRlcygnICcpIHx8ICF2YWx1ZS5pbmNsdWRlcygnQCcpKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA+PSA1ICYmIHZhbHVlLmxlbmd0aCA8IDgwICYmIGVtYWlsUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc051bGxpc2ggKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCBudWxsaXNoUGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkudHJpbSgpKVxufVxuIiwiaW1wb3J0IHtcbiAgaXNCb29saXNoLFxuICBpc0N1cnJlbmN5LFxuICBpc0RhdGVTdHJpbmcsXG4gIGlzRW1haWxTaGFwZWQsXG4gIGlzRmxvYXRpc2gsXG4gIGlzTnVsbGlzaCxcbiAgaXNOdW1lcmljLFxuICBpc09iamVjdElkLFxuICBpc1RpbWVzdGFtcCxcbiAgaXNVdWlkXG59IGZyb20gJy4vdXRpbHMvdHlwZS1kZXRlY3RvcnMuanMnXG5cbmZ1bmN0aW9uIGRldGVjdFR5cGVzICh2YWx1ZSkge1xuICByZXR1cm4gcHJpb3JpdGl6ZWRUeXBlcy5yZWR1Y2UoKHR5cGVzLCB0eXBlSGVscGVyKSA9PiB7XG4gICAgaWYgKHR5cGVIZWxwZXIuY2hlY2sodmFsdWUpKSB0eXBlcy5wdXNoKHR5cGVIZWxwZXIudHlwZSlcbiAgICByZXR1cm4gdHlwZXNcbiAgfSwgW10pXG59XG5cbi8vIEJhc2ljIFR5cGUgRmlsdGVycyAtIHJ1ZGltZW50YXJ5IGRhdGEgc25pZmZpbmcgdXNlZCB0byB0YWxseSB1cCBcInZvdGVzXCIgZm9yIGEgZ2l2ZW4gZmllbGRcbi8qKlxuICogRGV0ZWN0IGFtYmlndW91cyBmaWVsZCB0eXBlLlxuICogV2lsbCBub3QgYWZmZWN0IHdlaWdodGVkIGZpZWxkIGFuYWx5c2lzLlxuICovXG5jb25zdCBUWVBFX1VOS05PV04gPSB7XG4gIHR5cGU6ICdVbmtub3duJyxcbiAgY2hlY2s6IHZhbHVlID0+IHZhbHVlID09PSAnJyB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSAndW5kZWZpbmVkJ1xufVxuY29uc3QgVFlQRV9PQkpFQ1RfSUQgPSB7XG4gIHR5cGU6ICdPYmplY3RJZCcsXG4gIGNoZWNrOiBpc09iamVjdElkXG59XG5jb25zdCBUWVBFX1VVSUQgPSB7XG4gIHR5cGU6ICdVVUlEJyxcbiAgY2hlY2s6IGlzVXVpZFxufVxuY29uc3QgVFlQRV9CT09MRUFOID0ge1xuICB0eXBlOiAnQm9vbGVhbicsXG4gIGNoZWNrOiBpc0Jvb2xpc2hcbn1cbmNvbnN0IFRZUEVfREFURSA9IHtcbiAgdHlwZTogJ0RhdGUnLFxuICBjaGVjazogaXNEYXRlU3RyaW5nXG59XG5jb25zdCBUWVBFX1RJTUVTVEFNUCA9IHtcbiAgdHlwZTogJ1RpbWVzdGFtcCcsXG4gIGNoZWNrOiBpc1RpbWVzdGFtcFxufVxuY29uc3QgVFlQRV9DVVJSRU5DWSA9IHtcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgY2hlY2s6IGlzQ3VycmVuY3lcbn1cbmNvbnN0IFRZUEVfRkxPQVQgPSB7XG4gIHR5cGU6ICdGbG9hdCcsXG4gIGNoZWNrOiBpc0Zsb2F0aXNoXG59XG5jb25zdCBUWVBFX05VTUJFUiA9IHtcbiAgdHlwZTogJ051bWJlcicsXG4gIGNoZWNrOiB2YWx1ZSA9PiB7XG4gICAgcmV0dXJuICEhKHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiAoTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgfHwgaXNOdW1lcmljKHZhbHVlKSkpXG4gIH1cbn1cbmNvbnN0IFRZUEVfRU1BSUwgPSB7XG4gIHR5cGU6ICdFbWFpbCcsXG4gIGNoZWNrOiBpc0VtYWlsU2hhcGVkXG59XG5jb25zdCBUWVBFX1NUUklORyA9IHtcbiAgdHlwZTogJ1N0cmluZycsXG4gIGNoZWNrOiB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLmxlbmd0aCA+PSAxXG59XG5jb25zdCBUWVBFX0FSUkFZID0ge1xuICB0eXBlOiAnQXJyYXknLFxuICBjaGVjazogdmFsdWUgPT4ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICB9XG59XG5jb25zdCBUWVBFX09CSkVDVCA9IHtcbiAgdHlwZTogJ09iamVjdCcsXG4gIGNoZWNrOiB2YWx1ZSA9PiB7XG4gICAgcmV0dXJuICFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcbiAgfVxufVxuY29uc3QgVFlQRV9OVUxMID0ge1xuICB0eXBlOiAnTnVsbCcsXG4gIGNoZWNrOiBpc051bGxpc2hcbn1cblxuY29uc3QgcHJpb3JpdGl6ZWRUeXBlcyA9IFtcbiAgVFlQRV9VTktOT1dOLFxuICBUWVBFX09CSkVDVF9JRCxcbiAgVFlQRV9VVUlELFxuICBUWVBFX0JPT0xFQU4sXG4gIFRZUEVfREFURSxcbiAgVFlQRV9USU1FU1RBTVAsXG4gIFRZUEVfQ1VSUkVOQ1ksXG4gIFRZUEVfRkxPQVQsXG4gIFRZUEVfTlVNQkVSLFxuICBUWVBFX05VTEwsXG4gIFRZUEVfRU1BSUwsXG4gIFRZUEVfU1RSSU5HLFxuICBUWVBFX0FSUkFZLFxuICBUWVBFX09CSkVDVFxuXVxuXG4vKipcbiAqIFR5cGUgUmFuayBNYXA6IFVzZSB0byBzb3J0IExvd2VzdCB0byBIaWdoZXN0XG4gKi9cbmNvbnN0IHR5cGVSYW5raW5ncyA9IHtcbiAgW1RZUEVfVU5LTk9XTi50eXBlXTogLTEsXG4gIFtUWVBFX09CSkVDVF9JRC50eXBlXTogMSxcbiAgW1RZUEVfVVVJRC50eXBlXTogMixcbiAgW1RZUEVfQk9PTEVBTi50eXBlXTogMyxcbiAgW1RZUEVfREFURS50eXBlXTogNCxcbiAgW1RZUEVfVElNRVNUQU1QLnR5cGVdOiA1LFxuICBbVFlQRV9DVVJSRU5DWS50eXBlXTogNixcbiAgW1RZUEVfRkxPQVQudHlwZV06IDcsXG4gIFtUWVBFX05VTUJFUi50eXBlXTogOCxcbiAgW1RZUEVfTlVMTC50eXBlXTogMTAsXG4gIFtUWVBFX0VNQUlMLnR5cGVdOiAxMSxcbiAgW1RZUEVfU1RSSU5HLnR5cGVdOiAxMixcbiAgW1RZUEVfQVJSQVkudHlwZV06IDEzLFxuICBbVFlQRV9PQkpFQ1QudHlwZV06IDE0XG59XG5cbmV4cG9ydCB7XG4gIHR5cGVSYW5raW5ncyxcbiAgcHJpb3JpdGl6ZWRUeXBlcyxcbiAgZGV0ZWN0VHlwZXMsXG4gIFRZUEVfVU5LTk9XTixcbiAgVFlQRV9PQkpFQ1RfSUQsXG4gIFRZUEVfVVVJRCxcbiAgVFlQRV9CT09MRUFOLFxuICBUWVBFX0RBVEUsXG4gIFRZUEVfVElNRVNUQU1QLFxuICBUWVBFX0NVUlJFTkNZLFxuICBUWVBFX0ZMT0FULFxuICBUWVBFX05VTUJFUixcbiAgVFlQRV9OVUxMLFxuICBUWVBFX0VNQUlMLFxuICBUWVBFX1NUUklORyxcbiAgVFlQRV9BUlJBWSxcbiAgVFlQRV9PQkpFQ1Rcbn1cbi8vIGNvbnN0IFRZUEVfRU5VTSA9IHtcbi8vICAgdHlwZTogXCJTdHJpbmdcIixcbi8vICAgY2hlY2s6ICh2YWx1ZSwgZmllbGRJbmZvLCBzY2hlbWFJbmZvKSA9PiB7XG4vLyAgICAgLy8gVGhyZXNob2xkIHNldCB0byA1JSAtIDUgKG9yIGZld2VyKSBvdXQgb2YgMTAwIHVuaXF1ZSBzdHJpbmdzIHNob3VsZCBlbmFibGUgJ2VudW0nIG1vZGVcbi8vICAgICBpZiAoc2NoZW1hSW5mby5pbnB1dFJvd0NvdW50IDwgMTAwKSByZXR1cm4gZmFsc2U7IC8vIGRpc2FibGVkIGlmIHNldCB0b28gc21hbGxcbi8vICAgfVxuLy8gfTtcbiIsImltcG9ydCBkZWJ1ZyBmcm9tICdkZWJ1Zydcbi8vIGltcG9ydCBGUCBmcm9tICdmdW5jdGlvbmFsLXByb21pc2VzJztcbi8vIGltcG9ydCB7IGRldGVjdFR5cGVzIH0gZnJvbSAnLi90eXBlLWhlbHBlcnMuanMnXG4vLyBpbXBvcnQgU3RhdHNNYXAgZnJvbSAnc3RhdHMtbWFwJztcbi8vIGltcG9ydCBtZW0gZnJvbSAnbWVtJztcbmltcG9ydCB7IGRldGVjdFR5cGVzLCBwcmlvcml0aXplZFR5cGVzLCB0eXBlUmFua2luZ3MgfSBmcm9tICcuL3R5cGUtaGVscGVycy5qcydcbmNvbnN0IGxvZyA9IGRlYnVnKCdzY2hlbWEtYnVpbGRlcjppbmRleCcpXG4vLyBjb25zdCBjYWNoZSA9IG5ldyBTdGF0c01hcCgpO1xuLy8gY29uc3QgZGV0ZWN0VHlwZXNDYWNoZWQgPSBtZW0oX2RldGVjdFR5cGVzLCB7IGNhY2hlLCBtYXhBZ2U6IDEwMDAgKiA2MDAgfSkgLy8ga2VlcCBjYWNoZSB1cCB0byAxMCBtaW51dGVzXG5cbmV4cG9ydCB7IHNjaGVtYUJ1aWxkZXIsIGNvbmRlbnNlRmllbGREYXRhLCBjb25kZW5zZUZpZWxkU2l6ZXMsIGdldE51bWJlclJhbmdlU3RhdHMgfVxuXG5cbmZ1bmN0aW9uIHNjaGVtYUJ1aWxkZXIgKG5hbWUsIGRhdGEsIG9uUHJvZ3Jlc3MgPSAoe3RvdGFsUm93cywgY3VycmVudFJvdywgY29sdW1uc30pID0+IHt9KSB7XG4gIC8vIGNvbnN0IHsgcHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0IH0gPSBGUC51bnBhY2soKVxuICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB0aHJvdyBFcnJvcignQXJndW1lbnQgYG5hbWVgIG11c3QgYmUgYSBTdHJpbmcnKVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHRocm93IEVycm9yKCdJbnB1dCBEYXRhIG11c3QgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cycpXG4gIGxvZygnU3RhcnRpbmcnKVxuICBjb25zdCBkZXRlY3RlZFNjaGVtYSA9IHsgdW5pcXVlczoge30sIGZpZWxkc0RhdGE6IHt9LCB0b3RhbFJlY29yZHM6IG51bGwgfVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRhdGEpXG4gICAgLnRoZW4oZG9jcyA9PiB7XG4gICAgICBsb2coYCAgQWJvdXQgdG8gZXhhbWluZSBldmVyeSByb3cgJiBjZWxsLiBGb3VuZCAke2RvY3MubGVuZ3RofSByZWNvcmRzLi4uYClcbiAgICAgIGNvbnN0IHBpdm90ZWRTY2hlbWEgPSBkb2NzLnJlZHVjZShldmFsdWF0ZVNjaGVtYUxldmVsLCBkZXRlY3RlZFNjaGVtYSlcbiAgICAgIGxvZygnICBFeHRyYWN0ZWQgZGF0YSBwb2ludHMgZnJvbSBGaWVsZCBUeXBlIGFuYWx5c2lzJylcbiAgICAgIHJldHVybiBwaXZvdGVkU2NoZW1hXG4gICAgfSlcbiAgICAudGhlbihzY2hlbWEgPT4gY29uZGVuc2VGaWVsZERhdGEoc2NoZW1hKSlcbiAgICAudGhlbihnZW5TY2hlbWEgPT4ge1xuICAgICAgbG9nKCdCdWlsdCBzdW1tYXJ5IGZyb20gRmllbGQgVHlwZSBkYXRhLicpXG4gICAgICAvLyBjb25zb2xlLmxvZygnZ2VuU2NoZW1hJywgSlNPTi5zdHJpbmdpZnkoZ2VuU2NoZW1hLCBudWxsLCAyKSlcblxuICAgICAgY29uc3QgdW5pcXVlcyA9IE9iamVjdC5rZXlzKGdlblNjaGVtYS5maWVsZHNEYXRhKVxuICAgICAgLnJlZHVjZSgodW5pcXVlcywgZmllbGROYW1lKSA9PiB7XG4gICAgICAgIGlmIChnZW5TY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgdW5pcXVlc1tmaWVsZE5hbWVdID0gZ2VuU2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5sZW5ndGhcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5pcXVlc1xuICAgICAgfSwge30pXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsUm93czogZ2VuU2NoZW1hLnRvdGFsUmVjb3JkcyxcbiAgICAgICAgdW5pcXVlczogdW5pcXVlcyxcbiAgICAgICAgZmllbGRzOiBnZW5TY2hlbWEuZmllbGRzRGF0YVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBldmFsdWF0ZVNjaGVtYUxldmVsIChzY2hlbWEsIHJvdywgaW5kZXgsIGFycmF5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgIHNjaGVtYSA9IHNjaGVtYVxuICAgICAgc2NoZW1hLnRvdGFsUmVjb3JkcyA9IHNjaGVtYS50b3RhbFJlY29yZHMgfHwgYXJyYXkubGVuZ3RoXG4gICAgICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMocm93KVxuICAgICAgbG9nKGBQcm9jZXNzaW5nIFJvdyAjICR7aW5kZXggKyAxfS8ke3NjaGVtYS50b3RhbFJlY29yZHN9Li4uYClcbiAgICAgIG9uUHJvZ3Jlc3MoeyB0b3RhbFJvd3M6IHNjaGVtYS50b3RhbFJlY29yZHMsIGN1cnJlbnRSb3c6IGluZGV4ICsgMSwgY29sdW1uczogZmllbGROYW1lcyB9KVxuICAgICAgZmllbGROYW1lcy5mb3JFYWNoKChmaWVsZE5hbWUsIGluZGV4LCBhcnJheSkgPT4ge1xuICAgICAgICBpZiAoaW5kZXggPT09IDApIGxvZyhgRm91bmQgJHthcnJheS5sZW5ndGh9IENvbHVtbihzKSFgKVxuICAgICAgICBjb25zdCB0eXBlRmluZ2VycHJpbnQgPSBnZXRGaWVsZE1ldGFkYXRhKHtcbiAgICAgICAgICBzY2hlbWEsXG4gICAgICAgICAgZmllbGROYW1lLFxuICAgICAgICAgIHZhbHVlOiByb3dbZmllbGROYW1lXVxuICAgICAgICB9KVxuICAgICAgICBjb25zdCB0eXBlTmFtZXMgPSBPYmplY3Qua2V5cyh0eXBlRmluZ2VycHJpbnQpXG4gICAgICAgIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gPSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIHx8IFtdXG4gICAgICAgIGlmICghc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5pbmNsdWRlcyhyb3dbZmllbGROYW1lXSkpIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0ucHVzaChyb3dbZmllbGROYW1lXSlcbiAgICAgICAgc2NoZW1hLmZpZWxkc0RhdGFbZmllbGROYW1lXSA9IHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gfHwgW11cbiAgICAgICAgc2NoZW1hLmZpZWxkc0RhdGFbZmllbGROYW1lXS5wdXNoKHR5cGVGaW5nZXJwcmludClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gc2NoZW1hXG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNvbmRlbnNlRmllbGREYXRhIChzY2hlbWEpIHtcbiAgY29uc3QgZmllbGRzRGF0YSA9IHNjaGVtYS5maWVsZHNEYXRhXG4gIGNvbnN0IGZpZWxkTmFtZXMgPSBPYmplY3Qua2V5cyhmaWVsZHNEYXRhKVxuXG4gIC8vIGNvbnNvbGUubG9nKCdjb25kZW5zZWZpZWxkRGF0YScsIGZpZWxkTmFtZXMpXG4gIGNvbnN0IGZpZWxkU3VtbWFyeSA9IHt9XG4gIGxvZyhgUHJlLWNvbmRlbnNlRmllbGRTaXplcyhmaWVsZHNbZmllbGROYW1lXSkgZm9yICR7ZmllbGROYW1lcy5sZW5ndGh9IGNvbHVtbnNgKVxuICBmaWVsZE5hbWVzXG4gICAgLmZvckVhY2goKGZpZWxkTmFtZSkgPT4ge1xuICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0gPSBjb25kZW5zZUZpZWxkU2l6ZXMoZmllbGRzRGF0YVtmaWVsZE5hbWVdKVxuICAgIH0pXG4gIGxvZygnUG9zdC1jb25kZW5zZUZpZWxkU2l6ZXMoZmllbGRzW2ZpZWxkTmFtZV0pJylcbiAgc2NoZW1hLmZpZWxkc0RhdGEgPSBmaWVsZFN1bW1hcnlcbiAgbG9nKCdSZXBsYWNlZCBmaWVsZERhdGEgd2l0aCBmaWVsZFN1bW1hcnknKVxuICByZXR1cm4gc2NoZW1hXG59XG5mdW5jdGlvbiBjb25kZW5zZUZpZWxkU2l6ZXMgKHR5cGVTaXplc0xpc3QpIHtcbiAgLy8gY29uc3QgYmxhbmtUeXBlU3VtcyA9ICgpID0+ICh7IGxlbmd0aDogMCwgc2NhbGU6IDAsIHByZWNpc2lvbjogMCB9KVxuICBjb25zdCBzdW1Db3VudHMgPSB7fVxuICBsb2coYFByb2Nlc3NpbmcgJHt0eXBlU2l6ZXNMaXN0Lmxlbmd0aH0gdHlwZSBndWVzc2VzYClcbiAgdHlwZVNpemVzTGlzdC5tYXAoY3VycmVudFR5cGVHdWVzc2VzID0+IHtcbiAgICBjb25zdCB0eXBlU2l6ZXMgPSBPYmplY3QuZW50cmllcyhjdXJyZW50VHlwZUd1ZXNzZXMpXG4gICAgICAubWFwKChbdHlwZU5hbWUsIHsgdmFsdWUsIGxlbmd0aCwgc2NhbGUsIHByZWNpc2lvbiB9XSkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2codHlwZU5hbWUsIEpTT04uc3RyaW5naWZ5KHsgbGVuZ3RoLCBzY2FsZSwgcHJlY2lzaW9uIH0pKVxuICAgICAgICBzdW1Db3VudHNbdHlwZU5hbWVdID0gc3VtQ291bnRzW3R5cGVOYW1lXSB8fCB7IGNvdW50OiAwIH1cbiAgICAgICAgaWYgKCFzdW1Db3VudHNbdHlwZU5hbWVdLmNvdW50KSBzdW1Db3VudHNbdHlwZU5hbWVdLmNvdW50ID0gMFxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxlbmd0aCkgJiYgIXN1bUNvdW50c1t0eXBlTmFtZV0ubGVuZ3RoKSBzdW1Db3VudHNbdHlwZU5hbWVdLmxlbmd0aCA9IFtdXG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoc2NhbGUpICYmICFzdW1Db3VudHNbdHlwZU5hbWVdLnNjYWxlKSBzdW1Db3VudHNbdHlwZU5hbWVdLnNjYWxlID0gW11cbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShwcmVjaXNpb24pICYmICFzdW1Db3VudHNbdHlwZU5hbWVdLnByZWNpc2lvbikgc3VtQ291bnRzW3R5cGVOYW1lXS5wcmVjaXNpb24gPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiAhc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZSkgc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZSA9IFtdXG5cbiAgICAgICAgc3VtQ291bnRzW3R5cGVOYW1lXS5jb3VudCsrXG4gICAgICAgIGlmIChsZW5ndGgpIHN1bUNvdW50c1t0eXBlTmFtZV0ubGVuZ3RoLnB1c2gobGVuZ3RoKVxuICAgICAgICBpZiAoc2NhbGUpIHN1bUNvdW50c1t0eXBlTmFtZV0uc2NhbGUucHVzaChzY2FsZSlcbiAgICAgICAgaWYgKHByZWNpc2lvbikgc3VtQ291bnRzW3R5cGVOYW1lXS5wcmVjaXNpb24ucHVzaChwcmVjaXNpb24pXG4gICAgICAgIGlmICh2YWx1ZSkgc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZS5wdXNoKHZhbHVlKVxuICAgICAgICBzdW1Db3VudHNbdHlwZU5hbWVdLnJhbmsgPSB0eXBlUmFua2luZ3NbdHlwZU5hbWVdXG4gICAgICAgIHJldHVybiBzdW1Db3VudHNbdHlwZU5hbWVdXG4gICAgICB9KVxuICB9KVxuICAvKlxuICA+IEV4YW1wbGUgb2Ygc3VtQ291bnRzIGF0IHRoaXMgcG9pbnRcbiAge1xuICAgIEZsb2F0OiB7IGNvdW50OiA0LCBzY2FsZTogWyA1LCA1LCA1LCA1IF0sIHByZWNpc2lvbjogWyAyLCAyLCAyLCAyIF0gfSxcbiAgICBTdHJpbmc6IHsgY291bnQ6IDMsIGxlbmd0aDogWyAyLCAzLCA2IF0gfSxcbiAgICBOdW1iZXI6IHsgY291bnQ6IDEsIGxlbmd0aDogWyA2IF0gfVxuICB9XG4gICovXG4gIGxvZygnQ29uZGVuc2luZyBkYXRhIHBvaW50cyB0byBzdGF0cyBzdW1tYXJpZXMuLi4nKVxuICBPYmplY3Qua2V5cyhzdW1Db3VudHMpXG4gICAgLm1hcCh0eXBlTmFtZSA9PiB7XG4gICAgICAvLyBpZiAoIXNpemVSYW5nZVN1bW1hcnlbdHlwZU5hbWVdKSBzaXplUmFuZ2VTdW1tYXJ5W3R5cGVOYW1lXSA9IHt9XG4gICAgICBpZiAoc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZSkgc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZSA9IGdldE51bWJlclJhbmdlU3RhdHMoc3VtQ291bnRzW3R5cGVOYW1lXS52YWx1ZSlcbiAgICAgIGlmIChzdW1Db3VudHNbdHlwZU5hbWVdLmxlbmd0aCkgc3VtQ291bnRzW3R5cGVOYW1lXS5sZW5ndGggPSBnZXROdW1iZXJSYW5nZVN0YXRzKHN1bUNvdW50c1t0eXBlTmFtZV0ubGVuZ3RoKVxuICAgICAgaWYgKHN1bUNvdW50c1t0eXBlTmFtZV0uc2NhbGUpIHN1bUNvdW50c1t0eXBlTmFtZV0uc2NhbGUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHN1bUNvdW50c1t0eXBlTmFtZV0uc2NhbGUpXG4gICAgICBpZiAoc3VtQ291bnRzW3R5cGVOYW1lXS5wcmVjaXNpb24pIHN1bUNvdW50c1t0eXBlTmFtZV0ucHJlY2lzaW9uID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhzdW1Db3VudHNbdHlwZU5hbWVdLnByZWNpc2lvbilcbiAgICAgIC8vIGlmIChzdW1Db3VudHNbdHlwZU5hbWVdLmNvdW50KSBzdW1Db3VudHNbdHlwZU5hbWVdLmNvdW50ID0gc3VtQ291bnRzW3R5cGVOYW1lXS5jb3VudFxuXG4gICAgfSlcbiAgbG9nKCdEb25lIGNvbmRlbnNpbmcgZGF0YSBwb2ludHMuLi4nKVxuICAvKlxuICA+IEV4YW1wbGUgb2Ygc2l6ZVJhbmdlU3VtbWFyeSBhdCB0aGlzIHBvaW50XG4gIHtcbiAgICBGbG9hdDoge1xuICAgICAgc2NhbGU6IHsgbWluOiA1LCBhdmc6IDUsIG1heDogNSwgcGN0MzA6IDUsIHBjdDYwOiA1LCBwY3Q5MDogNSB9LFxuICAgICAgcHJlY2lzaW9uOiB7IG1pbjogMiwgYXZnOiAyLCBtYXg6IDIsIHBjdDMwOiAyLCBwY3Q2MDogMiwgcGN0OTA6IDIgfSxcbiAgICAgIGNvdW50OiA0XG4gICAgfSxcbiAgICBTdHJpbmc6IHtcbiAgICAgIGxlbmd0aDogeyBtaW46IDIsIGF2ZzogMy42NjY2NjY2NjY2NjY2NjY1LCBtYXg6IDYsIHBjdDMwOiAyLCBwY3Q2MDogMywgcGN0OTA6IDYgfSxcbiAgICAgIGNvdW50OiAzXG4gICAgfSxcbiAgICBOdW1iZXI6IHtcbiAgICAgIGxlbmd0aDogeyBtaW46IDYsIGF2ZzogNiwgbWF4OiA2LCBwY3QzMDogNiwgcGN0NjA6IDYsIHBjdDkwOiA2IH0sXG4gICAgICBjb3VudDogMVxuICAgIH1cbiAgfVxuICAqL1xuICAvLyBjb25zb2xlLmxvZygndHlwZVNpemVzIFNVTTonLCBzdW1Db3VudHMpXG4gIC8vIGNvbnNvbGUubG9nKHNpemVSYW5nZVN1bW1hcnkpXG4gIHJldHVybiBzdW1Db3VudHNcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGRNZXRhZGF0YSAoe1xuICB2YWx1ZSxcbiAgZmllbGROYW1lLFxuICBzY2hlbWEsIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgcmVjdXJzaXZlID0gZmFsc2Vcbn0pIHtcbiAgY29uc3QgdHlwZUd1ZXNzZXMgPSBkZXRlY3RUeXBlcyh2YWx1ZSlcblxuICBjb25zdCB0eXBlQW5hbHlzaXMgPSB0eXBlR3Vlc3Nlcy5yZWR1Y2UoKGFuYWx5c2lzLCB0eXBlR3Vlc3MsIHJhbmspID0+IHtcbiAgICBsZXQgbGVuZ3RoXG4gICAgbGV0IHByZWNpc2lvblxuICAgIGxldCBzY2FsZVxuXG4gICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgcmFuazogcmFuayArIDEgfVxuXG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0Zsb2F0Jykge1xuICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0KHZhbHVlKVxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgdmFsdWUgfVxuICAgICAgY29uc3Qgc2lnbmlmaWNhbmRBbmRNYW50aXNzYSA9IFN0cmluZyh2YWx1ZSkuc3BsaXQoJy4nKVxuICAgICAgaWYgKHNpZ25pZmljYW5kQW5kTWFudGlzc2EubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHByZWNpc2lvbiA9IHNpZ25pZmljYW5kQW5kTWFudGlzc2Euam9pbignJykubGVuZ3RoIC8vIHRvdGFsICMgb2YgbnVtZXJpYyBwb3NpdGlvbnMgYmVmb3JlICYgYWZ0ZXIgZGVjaW1hbFxuICAgICAgICBzY2FsZSA9IHNpZ25pZmljYW5kQW5kTWFudGlzc2FbMV0ubGVuZ3RoXG4gICAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHByZWNpc2lvbiwgc2NhbGUgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnTnVtYmVyJykge1xuICAgICAgdmFsdWUgPSBOdW1iZXIodmFsdWUpXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZSB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdTdHJpbmcnKSB7XG4gICAgICBsZW5ndGggPSBTdHJpbmcodmFsdWUpLmxlbmd0aFxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgbGVuZ3RoIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0FycmF5Jykge1xuICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBsZW5ndGggfVxuICAgIH1cbiAgICByZXR1cm4gYW5hbHlzaXNcbiAgfSwge30pXG5cbiAgcmV0dXJuIHR5cGVBbmFseXNpc1xufVxuXG5mdW5jdGlvbiBnZXROdW1iZXJSYW5nZVN0YXRzIChudW1iZXJzKSB7XG4gIGlmICghbnVtYmVycyB8fCBudW1iZXJzLmxlbmd0aCA8IDEpIHJldHVybiB1bmRlZmluZWRcbiAgbnVtYmVycyA9IG51bWJlcnMuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBhIDwgYiA/IC0xIDogYSA9PT0gYiA/IDAgOiAxKVxuICBjb25zdCBzdW0gPSBudW1iZXJzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApXG4gIHJldHVybiB7XG4gICAgbWluOiBudW1iZXJzWzBdLFxuICAgIGF2Zzogc3VtIC8gbnVtYmVycy5sZW5ndGgsXG4gICAgbWF4OiBudW1iZXJzW251bWJlcnMubGVuZ3RoIC0gMV0sXG4gICAgcGVyY2VudGlsZXM6IFtcbiAgICAgIG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC4zKSwgMTApXSxcbiAgICAgIG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC42KSwgMTApXSxcbiAgICAgIG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC45KSwgMTApXVxuICAgIF1cbiAgfVxufVxuIl0sIm5hbWVzIjpbInJlcXVpcmUkJDAiLCJnbG9iYWwiLCJpc0RhdGUiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7OztDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBYyxHQUFHLFNBQVMsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUN4QyxFQUFFLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQzFCLEVBQUUsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLENBQUM7QUFDeEIsRUFBRSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDM0MsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixHQUFHLE1BQU0sSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNqRCxJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZELEdBQUc7QUFDSCxFQUFFLE1BQU0sSUFBSSxLQUFLO0FBQ2pCLElBQUksdURBQXVEO0FBQzNELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDekIsR0FBRyxDQUFD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O0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztBQUNuQixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ3JCLEVBQUUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzFDLEdBQUc7QUFD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Q0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ3pCO0FBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNSLEVBQUUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxRQUFRLEdBQUcsVUFBVSxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkYsRUFBRSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQzNCO0FBQ0EsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1QixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDbEI7QUFDQSxJQUFJLFNBQVM7QUFDYixJQUFJO0FBQ0o7QUFDQSxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMvQztBQUNBLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQzlCLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN6RSxJQUFJLE1BQU07QUFDVixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMvRCxJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JELEdBQUcsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUQsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUyxPQUFPLEdBQUc7QUFDcEIsRUFBRSxNQUFNLFVBQVUsR0FBRztBQUNyQixHQUFHLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQ3hDLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUM7QUFDMUUsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN6QixFQUFFLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxTQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDeEIsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNyQyxHQUFHLE9BQU8sSUFBSSxDQUFDO0FBQ2YsR0FBRztBQUNIO0FBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNSLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFDVjtBQUNBLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzVELEdBQUcsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN4QyxJQUFJLE9BQU8sS0FBSyxDQUFDO0FBQ2pCLElBQUk7QUFDSixHQUFHO0FBQ0g7QUFDQSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1RCxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNoQixJQUFJO0FBQ0osR0FBRztBQUNIO0FBQ0EsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNmLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxTQUFTLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDOUIsRUFBRSxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUU7QUFDMUIsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQzlDLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM1QixFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFO0FBQ3RCLEVBQUUsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO0FBQzVCLEdBQUcsT0FBTyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDbkMsR0FBRztBQUNILEVBQUUsT0FBTyxHQUFHLENBQUM7QUFDYixFQUFFO0FBQ0Y7QUFDQSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFDeEM7QUFDQSxDQUFDLE9BQU8sV0FBVyxDQUFDO0FBQ3BCLENBQUM7QUFDRDtBQUNBLFVBQWMsR0FBRyxLQUFLO0FDelF0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLGtCQUFrQixHQUFHLFVBQVUsQ0FBQztBQUNoQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDcEIsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGVBQWUsR0FBRyxZQUFZLEVBQUUsQ0FBQztBQUNqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYyxHQUFHO0FBQ2pCLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsU0FBUztBQUNWLENBQUMsQ0FBQztBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxTQUFTLEdBQUc7QUFDckI7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3ZILEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDZCxFQUFFO0FBQ0Y7QUFDQTtBQUNBLENBQUMsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO0FBQ2xJLEVB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxZQUFZLENBQUMsS0FBSyxFQUFFO0FBQzdCLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxJQUFJLFFBQVEsQ0FBQztBQUM3QyxDQUFDO0FBQ0Q7QUFDQSxjQUFjLEdBQUcsTUFBTTtHQ3hHdkIsTUFBTSxVQUFVLEdBQUc7QUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ3BDLEVBQUM7QUFDRDtBQUNBLE1BQU0sY0FBYyxHQUFHLDJCQUEwQjtBQUNqRCxNQUFNLFdBQVcsR0FBRyxnRkFBK0U7QUFDbkcsTUFBTSxlQUFlLEdBQUcsaUJBQWdCO0FBQ3hDLE1BQU0saUJBQWlCLEdBQUcsMFJBQXlSO0FBQ25ULE1BQU0sZ0JBQWdCLEdBQUcsZUFBYztBQUN2QyxBQUVBLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYTtBQUN0QyxNQUFNLFlBQVksR0FBRyxTQUFRO0FBQzdCO0FBQ0EsTUFBTSxZQUFZLEdBQUcsZ0RBQStDO0FBQ3BFLE1BQU0sY0FBYyxHQUFHLFFBQU87QUFDOUI7QUFDQTtBQUNBLFNBQVMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDdEMsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFDRDtBQUNBLFNBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDbkMsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3JELENBQUM7QUFDRCxTQUFTLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ3ZDLEVBQUUsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFLE9BQU8sS0FBSztBQUNqQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN6RCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFlBQVksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ3pDO0FBQ0EsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsSUFBSUMsYUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sSUFBSTtBQUNoQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzNELENBQUM7QUFDRDtBQUNBLFNBQVMsV0FBVyxDQUFDLEtBQUssRUFBRTtBQUM1QixFQUFFLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDakMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRTtBQUM5QixFQUFFLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNyQyxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDM0IsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBQ2pGLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEtBQUs7QUFDaEMsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUM7QUFDeEMsRUFBRSxPQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDekI7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBLFNBQVMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDdEM7QUFDQSxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzFELENBQUM7QUFDRDtBQUNBLFNBQVMsVUFBVSxFQUFFLEtBQUssRUFBRTtBQUM1QixFQUFFLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyRyxDQUFDO0FBQ0Q7QUFDQSxTQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7QUFDOUIsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sS0FBSztBQUMvRCxFQUFFLE9BQU8sS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDM0UsQ0FBQztBQUNEO0FBQ0EsU0FBUyxTQUFTLEVBQUUsS0FBSyxFQUFFO0FBQzNCLEVBQUUsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BFLENBQUMsQUNyRkQsU0FBUyxXQUFXLEVBQUUsS0FBSyxFQUFFO0FBQzdCLEVBQUUsT0FBTyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxLQUFLO0FBQ3hELElBQUksSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBQztBQUM1RCxJQUFJLE9BQU8sS0FBSztBQUNoQixHQUFHLEVBQUUsRUFBRSxDQUFDO0FBQ1IsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sWUFBWSxHQUFHO0FBQ3JCLEVBQUUsSUFBSSxFQUFFLFNBQVM7QUFDakIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssV0FBVztBQUM5RSxFQUFDO0FBQ0QsTUFBTSxjQUFjLEdBQUc7QUFDdkIsRUFBRSxJQUFJLEVBQUUsVUFBVTtBQUNsQixFQUFFLEtBQUssRUFBRSxVQUFVO0FBQ25CLEVBQUM7QUFDRCxNQUFNLFNBQVMsR0FBRztBQUNsQixFQUFFLElBQUksRUFBRSxNQUFNO0FBQ2QsRUFBRSxLQUFLLEVBQUUsTUFBTTtBQUNmLEVBQUM7QUFDRCxNQUFNLFlBQVksR0FBRztBQUNyQixFQUFFLElBQUksRUFBRSxTQUFTO0FBQ2pCLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDbEIsRUFBQztBQUNELE1BQU0sU0FBUyxHQUFHO0FBQ2xCLEVBQUUsSUFBSSxFQUFFLE1BQU07QUFDZCxFQUFFLEtBQUssRUFBRSxZQUFZO0FBQ3JCLEVBQUM7QUFDRCxNQUFNLGNBQWMsR0FBRztBQUN2QixFQUFFLElBQUksRUFBRSxXQUFXO0FBQ25CLEVBQUUsS0FBSyxFQUFFLFdBQVc7QUFDcEIsRUFBQztBQUNELE1BQU0sYUFBYSxHQUFHO0FBQ3RCLEVBQUUsSUFBSSxFQUFFLFVBQVU7QUFDbEIsRUFBRSxLQUFLLEVBQUUsVUFBVTtBQUNuQixFQUFDO0FBQ0QsTUFBTSxVQUFVLEdBQUc7QUFDbkIsRUFBRSxJQUFJLEVBQUUsT0FBTztBQUNmLEVBQUUsS0FBSyxFQUFFLFVBQVU7QUFDbkIsRUFBQztBQUNELE1BQU0sV0FBVyxHQUFHO0FBQ3BCLEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDaEIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN2RyxHQUFHO0FBQ0gsRUFBQztBQUNELE1BQU0sVUFBVSxHQUFHO0FBQ25CLEVBQUUsSUFBSSxFQUFFLE9BQU87QUFDZixFQUFFLEtBQUssRUFBRSxhQUFhO0FBQ3RCLEVBQUM7QUFDRCxNQUFNLFdBQVcsR0FBRztBQUNwQixFQUFFLElBQUksRUFBRSxRQUFRO0FBQ2hCLEVBQUUsS0FBSyxFQUFFLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO0FBQ2hFLEVBQUM7QUFDRCxNQUFNLFVBQVUsR0FBRztBQUNuQixFQUFFLElBQUksRUFBRSxPQUFPO0FBQ2YsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztBQUMvQixHQUFHO0FBQ0gsRUFBQztBQUNELE1BQU0sV0FBVyxHQUFHO0FBQ3BCLEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDaEIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO0FBQzlFLEdBQUc7QUFDSCxFQUFDO0FBQ0QsTUFBTSxTQUFTLEdBQUc7QUFDbEIsRUFBRSxJQUFJLEVBQUUsTUFBTTtBQUNkLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDbEIsRUFBQztBQUNEO0FBQ0EsTUFBTSxnQkFBZ0IsR0FBRztBQUN6QixFQUFFLFlBQVk7QUFDZCxFQUFFLGNBQWM7QUFDaEIsRUFBRSxTQUFTO0FBQ1gsRUFBRSxZQUFZO0FBQ2QsRUFBRSxTQUFTO0FBQ1gsRUFBRSxjQUFjO0FBQ2hCLEVBQUUsYUFBYTtBQUNmLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUUsU0FBUztBQUNYLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sWUFBWSxHQUFHO0FBQ3JCLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN6QixFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQzFCLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDckIsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUN4QixFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ3JCLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDMUIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUN6QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ3RCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDdkIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUN0QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ3ZCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLEVBQUU7QUFDeEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUN2QixFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ3hCLEVBQUM7QUFDRCxBQW9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FDaEpMLE1BQU0sR0FBRyxHQUFHQyxPQUFLLENBQUMsc0JBQXNCLEVBQUM7QUFDekMsQUFJQTtBQUNBO0FBQ0EsU0FBUyxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFO0FBQzNGO0FBQ0EsRUFBRSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxNQUFNLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQztBQUMvRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDLHdDQUF3QyxDQUFDO0FBQ2pGLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBQztBQUNqQixFQUFFLE1BQU0sY0FBYyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxJQUFJLEdBQUU7QUFDNUUsRUFBRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQzlCLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSTtBQUNsQixNQUFNLEdBQUcsQ0FBQyxDQUFDLDJDQUEyQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUM7QUFDakYsTUFBTSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLGNBQWMsRUFBQztBQUM1RSxNQUFNLEdBQUcsQ0FBQyxrREFBa0QsRUFBQztBQUM3RCxNQUFNLE9BQU8sYUFBYTtBQUMxQixLQUFLLENBQUM7QUFDTixLQUFLLElBQUksQ0FBQyxNQUFNLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUMsS0FBSyxJQUFJLENBQUMsU0FBUyxJQUFJO0FBQ3ZCLE1BQU0sR0FBRyxDQUFDLHFDQUFxQyxFQUFDO0FBQ2hEO0FBQ0E7QUFDQSxNQUFNLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUN2RCxPQUFPLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxTQUFTLEtBQUs7QUFDdEMsUUFBUSxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDMUMsVUFBVSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFNO0FBQ2xFLFNBQVM7QUFDVCxRQUFRLE9BQU8sT0FBTztBQUN0QixPQUFPLEVBQUUsRUFBRSxFQUFDO0FBQ1o7QUFDQSxNQUFNLE9BQU87QUFDYixRQUFRLFNBQVMsRUFBRSxTQUFTLENBQUMsWUFBWTtBQUN6QyxRQUFRLE9BQU8sRUFBRSxPQUFPO0FBQ3hCLFFBQVEsTUFBTSxFQUFFLFNBQVMsQ0FBQyxVQUFVO0FBQ3BDLE9BQU87QUFDUCxLQUFLLENBQUM7QUFDTjtBQUNBLElBQUksU0FBUyxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDN0QsTUFBTSxNQUFNLEdBQUcsT0FBTTtBQUNyQixNQUFNLE1BQU0sQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTTtBQUMvRCxNQUFNLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFDO0FBQ3pDLE1BQU0sR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNwRSxNQUFNLFVBQVUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBQztBQUNoRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssS0FBSztBQUN0RCxRQUFRLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBQztBQUNoRSxRQUFRLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDO0FBQ2pELFVBQVUsTUFBTTtBQUNoQixVQUFVLFNBQVM7QUFDbkIsVUFBVSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUMvQixTQUFTLEVBQUM7QUFDVixBQUNBLFFBQVEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUU7QUFDbkUsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFDO0FBQy9HLFFBQVEsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUU7QUFDekUsUUFBUSxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUM7QUFDMUQsT0FBTyxFQUFDO0FBQ1IsTUFBTSxPQUFPLE1BQU07QUFDbkIsS0FBSztBQUNMLENBQUM7QUFDRDtBQUNBO0FBQ0EsU0FBUyxpQkFBaUIsRUFBRSxNQUFNLEVBQUU7QUFDcEMsRUFBRSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsV0FBVTtBQUN0QyxFQUFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFDO0FBQzVDO0FBQ0E7QUFDQSxFQUFFLE1BQU0sWUFBWSxHQUFHLEdBQUU7QUFDekIsRUFBRSxHQUFHLENBQUMsQ0FBQyw4Q0FBOEMsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ25GLEVBQUUsVUFBVTtBQUNaLEtBQUssT0FBTyxDQUFDLENBQUMsU0FBUyxLQUFLO0FBQzVCLE1BQU0sWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBQztBQUN6RSxLQUFLLEVBQUM7QUFDTixFQUFFLEdBQUcsQ0FBQyw0Q0FBNEMsRUFBQztBQUNuRCxFQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsYUFBWTtBQUNsQyxFQUFFLEdBQUcsQ0FBQyxzQ0FBc0MsRUFBQztBQUM3QyxFQUFFLE9BQU8sTUFBTTtBQUNmLENBQUM7QUFDRCxTQUFTLGtCQUFrQixFQUFFLGFBQWEsRUFBRTtBQUM1QztBQUNBLEVBQUUsTUFBTSxTQUFTLEdBQUcsR0FBRTtBQUN0QixFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFDO0FBQ3hELEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSTtBQUMxQyxJQUFJLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEtBQUs7QUFDaEU7QUFDQSxRQUFRLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFFO0FBQ2pFLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFDO0FBQ3JFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxHQUFHLEdBQUU7QUFDbkcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRTtBQUNoRyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFFO0FBQzVHLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUU7QUFDaEc7QUFDQSxRQUFRLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUU7QUFDbkMsUUFBUSxJQUFJLE1BQU0sRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUM7QUFDM0QsUUFBUSxJQUFJLEtBQUssRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7QUFDeEQsUUFBUSxJQUFJLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUM7QUFDcEUsUUFBUSxJQUFJLEtBQUssRUFBRSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7QUFDeEQsUUFBUSxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUM7QUFDekQsUUFBUSxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDbEMsT0FBTyxFQUFDO0FBQ1IsR0FBRyxFQUFDO0FBQ0o7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
