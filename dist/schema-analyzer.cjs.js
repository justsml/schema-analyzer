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
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

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
		let enableOverride = null;

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
					return '%';
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
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
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

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

var common = setup;var browser = createCommonjsModule(function (module, exports) {
/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

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
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

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
var browser_1 = browser.formatArgs;
var browser_2 = browser.save;
var browser_3 = browser.load;
var browser_4 = browser.useColors;
var browser_5 = browser.storage;
var browser_6 = browser.destroy;
var browser_7 = browser.colors;
var browser_8 = browser.log;var lodash_isdate = createCommonjsModule(function (module, exports) {
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

/**
 * @param {string | any[]} value
 */
function isBoolish (value, _fieldName = null) {
  if (value == null) return false
  value = String(value).trim();
  return value.length <= 6 && boolishPattern.test(String(value))
}

/**
 * @param {string | any[]} value
 */
function isUuid (value, _fieldName = null) {
  if (value == null) return false
  value = String(value).trim();
  return value.length < 40 && uuidPattern.test(value)
}
/**
 * @param {string | any[]=} value
 */
function isObjectId (value, _fieldName = null) {
  if (value == null) return false
  value = String(value).trim();
  return value.length < 40 && objectIdPattern.test(value)
}

/**
 * @param {string | any[]} value
 */
function isDateString (value, _fieldName = null) {
  // not bullet-proof, meant to sniff intention in the data
  if (value == null) return false
  if (lodash_isdate(value)) return true
  value = String(value).trim();
  return value.length < 30 && dateStringPattern.test(value)
}

/**
 * @param {string} value
 */
function isTimestamp (value) {
  if (value == null) return false
  value = String(value).trim();
  return timestampPattern.test(value)
}

/**
 * @param {string} value
 */
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

/**
 * @param {string | any[]} [value] - raw input to validate
 */
function isNumeric (value, _fieldName = null) {
  // if (value == null) return false
  value = String(value).trim();
  return value.length < 30 && numberishPattern.test(value)
}

/**
 * @param {unknown} value
 */
function isFloatish (value) {
  return !!(isNumeric(String(value)) && floatPattern.test(String(value)) && !Number.isInteger(value))
}

/**
 * @param {string | string[]} value
 */
function isEmailShaped (value) {
  if (value == null) return false
  value = String(value).trim();
  if (value.includes(' ') || !value.includes('@')) return false
  return value.length >= 5 && value.length < 80 && emailPattern.test(value)
}

/**
 * @param {any} value
 */
function isNullish (value) {
  return value === null || nullishPattern.test(String(value).trim())
}// eslint-disable-next-line no-unused-vars

const hasLeadingZero = /^0+/;

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
  return !strictMatching
    ? matchedTypes
    : matchedTypes.filter((type) => excludedTypes.indexOf(type) === -1)
}

/**
 * MetaChecks are used to analyze the intermediate results, after the Basic (discreet) type checks are complete.
 * They have access to all the data points before it is finally processed.
 */
const MetaChecks = {
  /**
   * @param {any} typeInfo
   */
  TYPE_ENUM: {
    type: 'enum',
    matchBasicTypes: ['String', 'Number'],
    check: (
      typeInfo,
      { rowCount, uniques },
      { enumAbsoluteLimit, enumPercentThreshold }
    ) => {
      if (!uniques || uniques.length === 0) return typeInfo
      // TODO: calculate uniqueness using ALL uniques combined from ALL types, this only sees consistently typed data
      // const uniqueness = rowCount / uniques.length
      const relativeEnumLimit = Math.min(
        parseInt(String(rowCount * enumPercentThreshold), 10),
        enumAbsoluteLimit
      );
      if (uniques.length > relativeEnumLimit) return typeInfo
      // const enumLimit = uniqueness < enumAbsoluteLimit && relativeEnumLimit < enumAbsoluteLimit
      //   ? enumAbsoluteLimit
      //   : relativeEnumLimit

      return { enum: uniques, ...typeInfo }
      // TODO: calculate entropy using a sum of all non-null detected types, not just typeCount
    }
  },
  /**
   * @param {TypeAnalysis} typeInfo
   */
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
    /**
    * @param {TypeAnalysis} typeInfo
    */
    check: (typeInfo, { rowCount, uniques }, { uniqueRowsThreshold }) => {
      if (!uniques || uniques.length === 0) return typeInfo
      // const uniqueness = rowCount / uniques.length
      const isUnique = uniques.length === rowCount * uniqueRowsThreshold;
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
  /**
   * @param {string} value
   */
  check: (value) => value === undefined || value === 'undefined',
  type: 'Unknown'
};
const TYPE_OBJECT_ID = {
  check: isObjectId,
  type: 'ObjectId',
  supercedes: ['String']
};
const TYPE_UUID = {
  check: isUuid,
  type: 'UUID',
  supercedes: ['String']
};
const TYPE_BOOLEAN = {
  check: isBoolish,
  type: 'Boolean',
  supercedes: ['String']
};
const TYPE_DATE = {
  check: isDateString,
  type: 'Date',
  supercedes: ['String']
};
const TYPE_TIMESTAMP = {
  check: isTimestamp,
  supercedes: ['String', 'Number'],
  type: 'Timestamp'
};
const TYPE_CURRENCY = {
  check: isCurrency,
  type: 'Currency',
  supercedes: ['String', 'Number']
};
const TYPE_FLOAT = {
  check: isFloatish,
  type: 'Float',
  supercedes: ['String', 'Number']
};
const TYPE_NUMBER =
  /**
   * @param {unknown} value
   */
  {
    check: (value) => {
      if (hasLeadingZero.test(String(value))) return false
      return !!(
        value !== null &&
        !Array.isArray(value) &&
        (Number.isInteger(value) || isNumeric(value))
      )
    },
    type: 'Number'
  };
const TYPE_EMAIL = {
  check: isEmailShaped,
  type: 'Email',
  supercedes: ['String']
};
const TYPE_STRING =
  /**
   * @param {any} value
   */
  {
    type: 'String',
    check: (value) => typeof value === 'string' // && value.length >= 1
  };
const TYPE_ARRAY =
  /**
   * @param {any} value
   */
  {
    check: (value) => Array.isArray(value),
    type: 'Array'
  };
const TYPE_OBJECT =
  /**
   * @param {any} value
   */
  {
    check: (value) =>
      !Array.isArray(value) && value != null && typeof value === 'object',
    type: 'Object'
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

/**
 * @param {string | number | Date | undefined | any} date
 * @returns {Date | false}
 */
function isValidDate (date) {
  date = date instanceof Date ? date : new Date(date);
  return isNaN(date.getFullYear()) ? false : date
}

/**
 * @param {string | number | boolean | Date} date
 */
const parseDate = (date) => {
  date = isValidDate(date);
  return date && date.toISOString && date.toISOString()
};

/**
 * @typedef CondenseFieldDataArgs
 * @type {{
 *   fieldsData: IntermediateTypeMeasurements[],
 *   uniques: Object.<string, any[]>,
 *   totalRows: number
 * }}
 */

/**
 * Analysis results.
 * @typedef TypeSummary
 * @type {{
  *  fields: Object.<string, FieldInfo>,
  *  totalRows: number;
  * }}
  */

/**
 * Analysis results.
 * @typedef IntermediateTypeSummary
 * @type {{
  *  fields: Object.<string, FieldInfo>,
  *  totalRows?: number;
  *  uniques?: any[];
  * }}
  */

/**
 * Analysis results.
 * @export
 * @typedef TypeAnalysis
 * @type {{
 *    Array?: FieldTypeStats,
 *    Boolean?: FieldTypeStats,
 *    Currency?: FieldTypeStats,
 *    Date?: FieldTypeStats,
 *    Email?: FieldTypeStats,
 *    Float?: FieldTypeStats,
 *    Null?: FieldTypeStats,
 *    Number?: FieldTypeStats,
 *    Object?: FieldTypeStats,
 *    ObjectId?: FieldTypeStats,
 *    String?: FieldTypeStats,
 *    Timestamp?: FieldTypeStats,
 *    Unknown?: FieldTypeStats,
 *    UUID?: FieldTypeStats,
 *  }}
 */

/**
 * Analysis tracking state.
 * @export
 * @typedef IntermediateTypeAnalysis
 * @type {{
 *    Array?: FieldTypeData,
 *    Boolean?: FieldTypeData,
 *    Currency?: FieldTypeData,
 *    Date?: FieldTypeData,
 *    Email?: FieldTypeData,
 *    Float?: FieldTypeData,
 *    Null?: FieldTypeData,
 *    Number?: FieldTypeData,
 *    Object?: FieldTypeData,
 *    ObjectId?: FieldTypeData,
 *    String?: FieldTypeData,
 *    Timestamp?: FieldTypeData,
 *    Unknown?: FieldTypeData,
 *    UUID?: FieldTypeData,
 *  }}
 */

/**
 * Analysis tracking state.
 * @export
 * @typedef IntermediateTypeMeasurements
 * @type {{
  *    Array?: any,
  *    Boolean?: any,
  *    Currency?: any,
  *    Date?: any,
  *    Email?: any,
  *    Float?: any,
  *    Null?: any,
  *    Number?: any,
  *    Object?: any,
  *    ObjectId?: any,
  *    String?: any,
  *    Timestamp?: any,
  *    Unknown?: any,
  *    UUID?: any,
  *  }}
  */

/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldTypeStats` type it will become.
 * @private
 * @typedef FieldTypeData
 * @type {Object}
 * @property {number[]} [value] - array of values, pre processing into an AggregateSummary
 * @property {number[]} [length] - array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {number[]} [precision] - only applies to Float types. Array of sizes of the value both before and after the decimal.
 * @property {number[]} [scale] - only applies to Float types. Array of sizes of the value after the decimal.
 * @property {number} [count] - number of times the type was matched
 * @property {number} [rank] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 *
 * @typedef FieldTypeStats
 * @type {Object}
 * @property {AggregateSummary} [value] - summary of array of values, pre processing into an AggregateSummary
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} [count=0] - number of times the type was matched
 * @property {number} [rank=0] - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 * @typedef FieldInfo
 * @type {object}
 * @property {TypeAnalysis | IntermediateTypeAnalysis} types - field stats organized by type
 * @property {boolean} nullable - is the field nullable
 * @property {boolean} unique - is the field unique
 * @property {string[]|number[]} [enum] - enumeration detected, the values are listed on this property.
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
 * schemaBuilder is the main function and where all the analysis & processing happens.
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{ onProgress?: progressCallback, enumMinimumRowCount?: number, enumAbsoluteLimit?: number, enumPercentThreshold?: number, nullableRowsThreshold?: number, uniqueRowsThreshold?: number, strictMatching?: boolean }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
function schemaBuilder (
  input,
  {
    onProgress = ({ totalRows, currentRow }) => {},
    strictMatching = true,
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = {
    onProgress: ({ totalRows, currentRow }) => {},
    strictMatching: true,
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
  const isEnumEnabled = input.length >= enumMinimumRowCount;

  log('Starting');
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    /** @type {FieldSummary} */
    .then((schema) => {
      log('Built summary from Field Type data.');
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
          // /** @type {TypeAnalysis} */
          /** @type {FieldInfo} */
          const types = schema.fields[fieldName];
          fieldInfo[fieldName] = {
            types
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

          const isIdentity = (types.Number || types.UUID) && fieldInfo[fieldName].unique && /id$/i.test(fieldName);
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
        totalRows: schema.totalRows
        // uniques: uniques,
        // fields: schema.fields
      }
    })

  /**
   * @param {object[]} docs
   * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData; }; }} schema
   */
  function pivotRowsGroupedByType (docs) {
    const detectedSchema = { uniques: isEnumEnabled ? {} : null, fieldsData: {}, totalRows: null };
    log(`  About to examine every row & cell. Found ${docs.length} records...`);
    const pivotedSchema = docs.reduce(evaluateSchemaLevel, detectedSchema);
    log('  Extracted data points from Field Type analysis');
    return pivotedSchema
  }

  /**
   * @param {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData[]; }; }} schema
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
      const typeFingerprint = getFieldMetadata({
        value: row[fieldName],
        strictMatching
      });
      const typeNames = Object.keys(typeFingerprint);
      const isEnumType = typeNames.includes('Number') || typeNames.includes('String');

      if (isEnumEnabled && isEnumType) {
        schema.uniques[fieldName] = schema.uniques[fieldName] || [];
        if (!schema.uniques[fieldName].includes(row[fieldName])) schema.uniques[fieldName].push(row[fieldName]);
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
 *
 * @param {CondenseFieldDataArgs} schema
 * @returns {{fields: Object.<string, IntermediateTypeMeasurements>, uniques: Object.<string, any[]>, totalRows: number}}
 */
function condenseFieldData (schema) {
  const { fieldsData } = schema;
  const fieldNames = Object.keys(fieldsData);

  /** @type {Object.<string, IntermediateTypeMeasurements>} */
  const fieldSummary = {};
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`);
  fieldNames
    .forEach((fieldName) => {
      const fldData = fieldsData[fieldName];
      /** @type {IntermediateTypeAnalysis} */
      const pivotedData = pivotFieldDataByType(fldData);
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData);
    });
  log('Post-condenseFieldSizes(fields[fieldName])');
  log('Replaced fieldData with fieldSummary');
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

// /**
//  * @param {Object.<string, { typeName: string, count: number, value?: any[], length?: any[], scale?: any[], precision?: any[], invalid?: any }>[]} typeSizeData - An object containing the
//  * @returns {Object.<string, FieldTypeData>}
//  */
/**
 * @param {IntermediateTypeMeasurements[]} typeSizeData
 * @returns {IntermediateTypeAnalysis}
 */
function pivotFieldDataByType (typeSizeData) {
  // const blankTypeSums = () => ({ length: 0, scale: 0, precision: 0 })
  log(`Processing ${typeSizeData.length} type guesses`);
  /**
   * @param {{ [x: string]: any; }} pivotedData
   * @param {{ [s: string]: any; } | ArrayLike<any>} currentTypeGuesses
   */
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
 * @param {Object.<string, FieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
 * @returns {Object.<string, FieldTypeStats>} - The final output, with histograms of significant points
 */
function condenseFieldSizes (pivotedDataByType) {
  /** @type {Object.<string, FieldTypeStats>} */
  const aggregateSummary = {};
  log('Starting condenseFieldSizes()');
  Object.keys(pivotedDataByType)
    .map((typeName) => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName],
        count: pivotedDataByType[typeName].count
      };
      if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value);
      if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length, true);
      if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale, true);
      if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision, true);

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
  /**
   * @param {{ [x: string]: any; }} analysis
   * @param {string} typeGuess
   * @param {number} rank
   */
  return typeGuesses.reduce((analysis, typeGuess, rank) => {
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
    if (typeGuess === 'Array') {
      length = value.length;
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
 * @param {{ min: any; max: any; mean: any; p25: any; p33: any; p50: any; p66: any; p75: any; p99: any; }} stats
 * @param {{ (date: any): any; (arg0: any): any; }} formatter
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
}exports.getNumberRangeStats=getNumberRangeStats;exports.isValidDate=isValidDate;exports.pivotFieldDataByType=pivotFieldDataByType;exports.schemaBuilder=schemaBuilder;//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLmNqcy5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdXRpbHMvdHlwZS1oZWxwZXJzLmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cdGNyZWF0ZURlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG5cdE9iamVjdC5rZXlzKGVudikuZm9yRWFjaChrZXkgPT4ge1xuXHRcdGNyZWF0ZURlYnVnW2tleV0gPSBlbnZba2V5XTtcblx0fSk7XG5cblx0LyoqXG5cdCogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG5cdCovXG5cblx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0Y3JlYXRlRGVidWcuc2tpcHMgPSBbXTtcblxuXHQvKipcblx0KiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG5cdCpcblx0KiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmZvcm1hdHRlcnMgPSB7fTtcblxuXHQvKipcblx0KiBTZWxlY3RzIGEgY29sb3IgZm9yIGEgZGVidWcgbmFtZXNwYWNlXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHN0cmluZyBmb3IgdGhlIGZvciB0aGUgZGVidWcgaW5zdGFuY2UgdG8gYmUgY29sb3JlZFxuXHQqIEByZXR1cm4ge051bWJlcnxTdHJpbmd9IEFuIEFOU0kgY29sb3IgY29kZSBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZVxuXHQqIEBhcGkgcHJpdmF0ZVxuXHQqL1xuXHRmdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcblx0XHRsZXQgaGFzaCA9IDA7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzcGFjZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0aGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuXHRcdH1cblxuXHRcdHJldHVybiBjcmVhdGVEZWJ1Zy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBjcmVhdGVEZWJ1Zy5jb2xvcnMubGVuZ3RoXTtcblx0fVxuXHRjcmVhdGVEZWJ1Zy5zZWxlY3RDb2xvciA9IHNlbGVjdENvbG9yO1xuXG5cdC8qKlxuXHQqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuXHQqIEByZXR1cm4ge0Z1bmN0aW9ufVxuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXHRcdGxldCBwcmV2VGltZTtcblx0XHRsZXQgZW5hYmxlT3ZlcnJpZGUgPSBudWxsO1xuXG5cdFx0ZnVuY3Rpb24gZGVidWcoLi4uYXJncykge1xuXHRcdFx0Ly8gRGlzYWJsZWQ/XG5cdFx0XHRpZiAoIWRlYnVnLmVuYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzZWxmID0gZGVidWc7XG5cblx0XHRcdC8vIFNldCBgZGlmZmAgdGltZXN0YW1wXG5cdFx0XHRjb25zdCBjdXJyID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuXHRcdFx0Y29uc3QgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuXHRcdFx0c2VsZi5kaWZmID0gbXM7XG5cdFx0XHRzZWxmLnByZXYgPSBwcmV2VGltZTtcblx0XHRcdHNlbGYuY3VyciA9IGN1cnI7XG5cdFx0XHRwcmV2VGltZSA9IGN1cnI7XG5cblx0XHRcdGFyZ3NbMF0gPSBjcmVhdGVEZWJ1Zy5jb2VyY2UoYXJnc1swXSk7XG5cblx0XHRcdGlmICh0eXBlb2YgYXJnc1swXSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Ly8gQW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJU9cblx0XHRcdFx0YXJncy51bnNoaWZ0KCclTycpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuXHRcdFx0bGV0IGluZGV4ID0gMDtcblx0XHRcdGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCAobWF0Y2gsIGZvcm1hdCkgPT4ge1xuXHRcdFx0XHQvLyBJZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG5cdFx0XHRcdGlmIChtYXRjaCA9PT0gJyUlJykge1xuXHRcdFx0XHRcdHJldHVybiAnJSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0aW5kZXgrKztcblx0XHRcdFx0Y29uc3QgZm9ybWF0dGVyID0gY3JlYXRlRGVidWcuZm9ybWF0dGVyc1tmb3JtYXRdO1xuXHRcdFx0XHRpZiAodHlwZW9mIGZvcm1hdHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNvbnN0IHZhbCA9IGFyZ3NbaW5kZXhdO1xuXHRcdFx0XHRcdG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuXHRcdFx0XHRcdC8vIE5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcblx0XHRcdFx0XHRhcmdzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdFx0aW5kZXgtLTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcblx0XHRcdGNyZWF0ZURlYnVnLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuXHRcdFx0Y29uc3QgbG9nRm4gPSBzZWxmLmxvZyB8fCBjcmVhdGVEZWJ1Zy5sb2c7XG5cdFx0XHRsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcblx0XHR9XG5cblx0XHRkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBjcmVhdGVEZWJ1Zy5zZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHRkZWJ1Zy5kZXN0cm95ID0gY3JlYXRlRGVidWcuZGVzdHJveTsgLy8gWFhYIFRlbXBvcmFyeS4gV2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHJlbGVhc2UuXG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZGVidWcsICdlbmFibGVkJywge1xuXHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcblx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0XHRnZXQ6ICgpID0+IGVuYWJsZU92ZXJyaWRlID09PSBudWxsID8gY3JlYXRlRGVidWcuZW5hYmxlZChuYW1lc3BhY2UpIDogZW5hYmxlT3ZlcnJpZGUsXG5cdFx0XHRzZXQ6IHYgPT4ge1xuXHRcdFx0XHRlbmFibGVPdmVycmlkZSA9IHY7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBFbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG5hbWVzcGFjZSwgZGVsaW1pdGVyKSB7XG5cdFx0Y29uc3QgbmV3RGVidWcgPSBjcmVhdGVEZWJ1Zyh0aGlzLm5hbWVzcGFjZSArICh0eXBlb2YgZGVsaW1pdGVyID09PSAndW5kZWZpbmVkJyA/ICc6JyA6IGRlbGltaXRlcikgKyBuYW1lc3BhY2UpO1xuXHRcdG5ld0RlYnVnLmxvZyA9IHRoaXMubG9nO1xuXHRcdHJldHVybiBuZXdEZWJ1Zztcblx0fVxuXG5cdC8qKlxuXHQqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcblx0KiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuXHRcdGNyZWF0ZURlYnVnLnNhdmUobmFtZXNwYWNlcyk7XG5cblx0XHRjcmVhdGVEZWJ1Zy5uYW1lcyA9IFtdO1xuXHRcdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0XHRsZXQgaTtcblx0XHRjb25zdCBzcGxpdCA9ICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycgPyBuYW1lc3BhY2VzIDogJycpLnNwbGl0KC9bXFxzLF0rLyk7XG5cdFx0Y29uc3QgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoIXNwbGl0W2ldKSB7XG5cdFx0XHRcdC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcblxuXHRcdFx0aWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNyZWF0ZURlYnVnLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG5cdCpcblx0KiBAcmV0dXJuIHtTdHJpbmd9IG5hbWVzcGFjZXNcblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBkaXNhYmxlKCkge1xuXHRcdGNvbnN0IG5hbWVzcGFjZXMgPSBbXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5uYW1lcy5tYXAodG9OYW1lc3BhY2UpLFxuXHRcdFx0Li4uY3JlYXRlRGVidWcuc2tpcHMubWFwKHRvTmFtZXNwYWNlKS5tYXAobmFtZXNwYWNlID0+ICctJyArIG5hbWVzcGFjZSlcblx0XHRdLmpvaW4oJywnKTtcblx0XHRjcmVhdGVEZWJ1Zy5lbmFibGUoJycpO1xuXHRcdHJldHVybiBuYW1lc3BhY2VzO1xuXHR9XG5cblx0LyoqXG5cdCogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQqXG5cdCogQHBhcmFtIHtTdHJpbmd9IG5hbWVcblx0KiBAcmV0dXJuIHtCb29sZWFufVxuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuXHRcdGlmIChuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICcqJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0bGV0IGk7XG5cdFx0bGV0IGxlbjtcblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGNyZWF0ZURlYnVnLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoY3JlYXRlRGVidWcuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQqIENvbnZlcnQgcmVnZXhwIHRvIG5hbWVzcGFjZVxuXHQqXG5cdCogQHBhcmFtIHtSZWdFeHB9IHJlZ3hlcFxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlXG5cdCogQGFwaSBwcml2YXRlXG5cdCovXG5cdGZ1bmN0aW9uIHRvTmFtZXNwYWNlKHJlZ2V4cCkge1xuXHRcdHJldHVybiByZWdleHAudG9TdHJpbmcoKVxuXHRcdFx0LnN1YnN0cmluZygyLCByZWdleHAudG9TdHJpbmcoKS5sZW5ndGggLSAyKVxuXHRcdFx0LnJlcGxhY2UoL1xcLlxcKlxcPyQvLCAnKicpO1xuXHR9XG5cblx0LyoqXG5cdCogQ29lcmNlIGB2YWxgLlxuXHQqXG5cdCogQHBhcmFtIHtNaXhlZH0gdmFsXG5cdCogQHJldHVybiB7TWl4ZWR9XG5cdCogQGFwaSBwcml2YXRlXG5cdCovXG5cdGZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcblx0XHRpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHRcdHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG5cdFx0fVxuXHRcdHJldHVybiB2YWw7XG5cdH1cblxuXHQvKipcblx0KiBYWFggRE8gTk9UIFVTRS4gVGhpcyBpcyBhIHRlbXBvcmFyeSBzdHViIGZ1bmN0aW9uLlxuXHQqIFhYWCBJdCBXSUxMIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgcmVsZWFzZS5cblx0Ki9cblx0ZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0XHRjb25zb2xlLndhcm4oJ0luc3RhbmNlIG1ldGhvZCBgZGVidWcuZGVzdHJveSgpYCBpcyBkZXByZWNhdGVkIGFuZCBubyBsb25nZXIgZG9lcyBhbnl0aGluZy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHZlcnNpb24gb2YgYGRlYnVnYC4nKTtcblx0fVxuXG5cdGNyZWF0ZURlYnVnLmVuYWJsZShjcmVhdGVEZWJ1Zy5sb2FkKCkpO1xuXG5cdHJldHVybiBjcmVhdGVEZWJ1Zztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cDtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcbmV4cG9ydHMuc3RvcmFnZSA9IGxvY2Fsc3RvcmFnZSgpO1xuZXhwb3J0cy5kZXN0cm95ID0gKCgpID0+IHtcblx0bGV0IHdhcm5lZCA9IGZhbHNlO1xuXG5cdHJldHVybiAoKSA9PiB7XG5cdFx0aWYgKCF3YXJuZWQpIHtcblx0XHRcdHdhcm5lZCA9IHRydWU7XG5cdFx0XHRjb25zb2xlLndhcm4oJ0luc3RhbmNlIG1ldGhvZCBgZGVidWcuZGVzdHJveSgpYCBpcyBkZXByZWNhdGVkIGFuZCBubyBsb25nZXIgZG9lcyBhbnl0aGluZy4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHZlcnNpb24gb2YgYGRlYnVnYC4nKTtcblx0XHR9XG5cdH07XG59KSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcblx0JyMwMDAwQ0MnLFxuXHQnIzAwMDBGRicsXG5cdCcjMDAzM0NDJyxcblx0JyMwMDMzRkYnLFxuXHQnIzAwNjZDQycsXG5cdCcjMDA2NkZGJyxcblx0JyMwMDk5Q0MnLFxuXHQnIzAwOTlGRicsXG5cdCcjMDBDQzAwJyxcblx0JyMwMENDMzMnLFxuXHQnIzAwQ0M2NicsXG5cdCcjMDBDQzk5Jyxcblx0JyMwMENDQ0MnLFxuXHQnIzAwQ0NGRicsXG5cdCcjMzMwMENDJyxcblx0JyMzMzAwRkYnLFxuXHQnIzMzMzNDQycsXG5cdCcjMzMzM0ZGJyxcblx0JyMzMzY2Q0MnLFxuXHQnIzMzNjZGRicsXG5cdCcjMzM5OUNDJyxcblx0JyMzMzk5RkYnLFxuXHQnIzMzQ0MwMCcsXG5cdCcjMzNDQzMzJyxcblx0JyMzM0NDNjYnLFxuXHQnIzMzQ0M5OScsXG5cdCcjMzNDQ0NDJyxcblx0JyMzM0NDRkYnLFxuXHQnIzY2MDBDQycsXG5cdCcjNjYwMEZGJyxcblx0JyM2NjMzQ0MnLFxuXHQnIzY2MzNGRicsXG5cdCcjNjZDQzAwJyxcblx0JyM2NkNDMzMnLFxuXHQnIzk5MDBDQycsXG5cdCcjOTkwMEZGJyxcblx0JyM5OTMzQ0MnLFxuXHQnIzk5MzNGRicsXG5cdCcjOTlDQzAwJyxcblx0JyM5OUNDMzMnLFxuXHQnI0NDMDAwMCcsXG5cdCcjQ0MwMDMzJyxcblx0JyNDQzAwNjYnLFxuXHQnI0NDMDA5OScsXG5cdCcjQ0MwMENDJyxcblx0JyNDQzAwRkYnLFxuXHQnI0NDMzMwMCcsXG5cdCcjQ0MzMzMzJyxcblx0JyNDQzMzNjYnLFxuXHQnI0NDMzM5OScsXG5cdCcjQ0MzM0NDJyxcblx0JyNDQzMzRkYnLFxuXHQnI0NDNjYwMCcsXG5cdCcjQ0M2NjMzJyxcblx0JyNDQzk5MDAnLFxuXHQnI0NDOTkzMycsXG5cdCcjQ0NDQzAwJyxcblx0JyNDQ0NDMzMnLFxuXHQnI0ZGMDAwMCcsXG5cdCcjRkYwMDMzJyxcblx0JyNGRjAwNjYnLFxuXHQnI0ZGMDA5OScsXG5cdCcjRkYwMENDJyxcblx0JyNGRjAwRkYnLFxuXHQnI0ZGMzMwMCcsXG5cdCcjRkYzMzMzJyxcblx0JyNGRjMzNjYnLFxuXHQnI0ZGMzM5OScsXG5cdCcjRkYzM0NDJyxcblx0JyNGRjMzRkYnLFxuXHQnI0ZGNjYwMCcsXG5cdCcjRkY2NjMzJyxcblx0JyNGRjk5MDAnLFxuXHQnI0ZGOTkzMycsXG5cdCcjRkZDQzAwJyxcblx0JyNGRkNDMzMnXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG5cdC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcblx0Ly8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2Vcblx0Ly8gZXhwbGljaXRseVxuXHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgKHdpbmRvdy5wcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicgfHwgd2luZG93LnByb2Nlc3MuX19ud2pzKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0Ly8gSW50ZXJuZXQgRXhwbG9yZXIgYW5kIEVkZ2UgZG8gbm90IHN1cHBvcnQgY29sb3JzLlxuXHRpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goLyhlZGdlfHRyaWRlbnQpXFwvKFxcZCspLykpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBJcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuXHQvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuXHRyZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcblx0XHQvLyBJcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG5cdFx0KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcblx0XHQvLyBJcyBmaXJlZm94ID49IHYzMT9cblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcblx0XHQvLyBEb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG5cdFx0KHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcblx0YXJnc1swXSA9ICh0aGlzLnVzZUNvbG9ycyA/ICclYycgOiAnJykgK1xuXHRcdHRoaXMubmFtZXNwYWNlICtcblx0XHQodGhpcy51c2VDb2xvcnMgPyAnICVjJyA6ICcgJykgK1xuXHRcdGFyZ3NbMF0gK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICclYyAnIDogJyAnKSArXG5cdFx0JysnICsgbW9kdWxlLmV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuXHRpZiAoIXRoaXMudXNlQ29sb3JzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG5cdGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpO1xuXG5cdC8vIFRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG5cdC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cblx0Ly8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG5cdGxldCBpbmRleCA9IDA7XG5cdGxldCBsYXN0QyA9IDA7XG5cdGFyZ3NbMF0ucmVwbGFjZSgvJVthLXpBLVolXS9nLCBtYXRjaCA9PiB7XG5cdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGluZGV4Kys7XG5cdFx0aWYgKG1hdGNoID09PSAnJWMnKSB7XG5cdFx0XHQvLyBXZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcblx0XHRcdC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG5cdFx0XHRsYXN0QyA9IGluZGV4O1xuXHRcdH1cblx0fSk7XG5cblx0YXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUuZGVidWcoKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmRlYnVnYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKiBJZiBgY29uc29sZS5kZWJ1Z2AgaXMgbm90IGF2YWlsYWJsZSwgZmFsbHMgYmFja1xuICogdG8gYGNvbnNvbGUubG9nYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnRzLmxvZyA9IGNvbnNvbGUuZGVidWcgfHwgY29uc29sZS5sb2cgfHwgKCgpID0+IHt9KTtcblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuXHR0cnkge1xuXHRcdGlmIChuYW1lc3BhY2VzKSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2Uuc2V0SXRlbSgnZGVidWcnLCBuYW1lc3BhY2VzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG5cdFx0fVxuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBsb2FkKCkge1xuXHRsZXQgcjtcblx0dHJ5IHtcblx0XHRyID0gZXhwb3J0cy5zdG9yYWdlLmdldEl0ZW0oJ2RlYnVnJyk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG5cblx0Ly8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuXHRpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcblx0XHRyID0gcHJvY2Vzcy5lbnYuREVCVUc7XG5cdH1cblxuXHRyZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKSB7XG5cdHRyeSB7XG5cdFx0Ly8gVFZNTEtpdCAoQXBwbGUgVFYgSlMgUnVudGltZSkgZG9lcyBub3QgaGF2ZSBhIHdpbmRvdyBvYmplY3QsIGp1c3QgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dFxuXHRcdC8vIFRoZSBCcm93c2VyIGFsc28gaGFzIGxvY2FsU3RvcmFnZSBpbiB0aGUgZ2xvYmFsIGNvbnRleHQuXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NvbW1vbicpKGV4cG9ydHMpO1xuXG5jb25zdCB7Zm9ybWF0dGVyc30gPSBtb2R1bGUuZXhwb3J0cztcblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24gKHYpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0cmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVycm9yLm1lc3NhZ2U7XG5cdH1cbn07XG4iLCIvKipcbiAqIGxvZGFzaCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnMgPGh0dHBzOi8vanF1ZXJ5Lm9yZy8+XG4gKiBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKi9cblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGRhdGVUYWcgPSAnW29iamVjdCBEYXRlXSc7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbC5PYmplY3QgPT09IE9iamVjdCAmJiBnbG9iYWw7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG52YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbnZhciBmcmVlTW9kdWxlID0gZnJlZUV4cG9ydHMgJiYgdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cbi8qKiBEZXRlY3QgdGhlIHBvcHVsYXIgQ29tbW9uSlMgZXh0ZW5zaW9uIGBtb2R1bGUuZXhwb3J0c2AuICovXG52YXIgbW9kdWxlRXhwb3J0cyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5leHBvcnRzID09PSBmcmVlRXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBwcm9jZXNzYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZVByb2Nlc3MgPSBtb2R1bGVFeHBvcnRzICYmIGZyZWVHbG9iYWwucHJvY2VzcztcblxuLyoqIFVzZWQgdG8gYWNjZXNzIGZhc3RlciBOb2RlLmpzIGhlbHBlcnMuICovXG52YXIgbm9kZVV0aWwgPSAoZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZyZWVQcm9jZXNzICYmIGZyZWVQcm9jZXNzLmJpbmRpbmcoJ3V0aWwnKTtcbiAgfSBjYXRjaCAoZSkge31cbn0oKSk7XG5cbi8qIE5vZGUuanMgaGVscGVyIHJlZmVyZW5jZXMuICovXG52YXIgbm9kZUlzRGF0ZSA9IG5vZGVVdGlsICYmIG5vZGVVdGlsLmlzRGF0ZTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy51bmFyeWAgd2l0aG91dCBzdXBwb3J0IGZvciBzdG9yaW5nIG1ldGFkYXRhLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjYXAgYXJndW1lbnRzIGZvci5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGNhcHBlZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVVuYXJ5KGZ1bmMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGZ1bmModmFsdWUpO1xuICB9O1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc0RhdGVgIHdpdGhvdXQgTm9kZS5qcyBvcHRpbWl6YXRpb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZGF0ZSBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzRGF0ZSh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBkYXRlVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRGF0ZWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZGF0ZSBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0RhdGUobmV3IERhdGUpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNEYXRlKCdNb24gQXByaWwgMjMgMjAxMicpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzRGF0ZSA9IG5vZGVJc0RhdGUgPyBiYXNlVW5hcnkobm9kZUlzRGF0ZSkgOiBiYXNlSXNEYXRlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0RhdGU7XG4iLCJpbXBvcnQgaXNEYXRlIGZyb20gJ2xvZGFzaC5pc2RhdGUnXG5leHBvcnQge1xuICBpc0Jvb2xpc2gsXG4gIGlzQ3VycmVuY3ksXG4gIGlzRGF0ZVN0cmluZyxcbiAgaXNFbWFpbFNoYXBlZCxcbiAgaXNGbG9hdGlzaCxcbiAgaXNOdWxsaXNoLFxuICBpc051bWVyaWMsXG4gIGlzT2JqZWN0SWQsXG4gIGlzVGltZXN0YW1wLFxuICBpc1V1aWRcbn1cblxuY29uc3QgY3VycmVuY2llcyA9IFtcbiAgJyQnLCAnwqInLCAnwqMnLCAnwqQnLCAnwqUnLCAn1o8nLCAn2IsnLCAn374nLCAn378nLCAn4KeyJywgJ+CnsycsICfgp7snLFxuICAn4KuxJywgJ+CvuScsICfguL8nLCAn4Z+bJywgJ+KCoCcsICfigqEnLCAn4oKiJywgJ+KCoycsICfigqQnLCAn4oKlJywgJ+KCpicsICfigqcnLFxuICAn4oKoJywgJ+KCqScsICfigqonLCAn4oKrJywgJ+KCrCcsICfigq0nLCAn4oKuJywgJ+KCrycsICfigrAnLCAn4oKxJywgJ+KCsicsICfigrMnLFxuICAn4oK0JywgJ+KCtScsICfigrYnLCAn4oK3JywgJ+KCuCcsICfigrknLCAn4oK6JywgJ+KCuycsICfigrwnLCAn4oK9JywgJ+KCvicsICfigr8nLFxuICAn6qC4JywgJ++3vCcsICfvuaknLCAn77yEJywgJ++/oCcsICfvv6EnLCAn77+lJywgJ++/picsXG4gICfwkb+dJywgJ/CRv54nLCAn8JG/nycsICfwkb+gJywgJ/Cei78nLCAn8J6ysCdcbl1cblxuY29uc3QgYm9vbGlzaFBhdHRlcm4gPSAvXihbWU5dfChUUlVFKXwoRkFMU0UpKSQvaVxuY29uc3QgdXVpZFBhdHRlcm4gPSAvXlswLTlhLWZBLUZdezh9LVswLTlhLWZBLUZdezR9LVswLTlhLWZBLUZdezR9LVswLTlhLWZBLUZdezR9LVswLTlhLWZBLUZdezEyfSQvXG5jb25zdCBvYmplY3RJZFBhdHRlcm4gPSAvXlthLWZcXGRdezI0fSQvaVxuY29uc3QgZGF0ZVN0cmluZ1BhdHRlcm4gPSAvXihbKy1dP1xcZHs0fSg/IVxcZHsyfVxcYikpKCgtPykoKDBbMS05XXwxWzAtMl0pKFxcMyhbMTJdXFxkfDBbMS05XXwzWzAxXSkpP3xXKFswLTRdXFxkfDVbMC0yXSkoLT9bMS03XSk/fCgwMFsxLTldfDBbMS05XVxcZHxbMTJdXFxkezJ9fDMoWzAtNV1cXGR8NlsxLTZdKSkpKFtUXFxzXSgoKFswMV1cXGR8MlswLTNdKSgoOj8pWzAtNV1cXGQpP3wyNDo/MDApKFsuLF1cXGQrKD8hOikpPyk/KFxcMTdbMC01XVxcZChbLixdXFxkKyk/KT8oW3paXXwoWystXSkoWzAxXVxcZHwyWzAtM10pOj8oWzAtNV1cXGQpPyk/KT8pPyQvXG5jb25zdCB0aW1lc3RhbXBQYXR0ZXJuID0gL15bMTJdXFxkezEyfSQvXG4vLyBjb25zdCBjdXJyZW5jeVBhdHRlcm5VUyA9IC9eXFxwe1NjfVxccz9bXFxkLC5dKyQvdWlnXG4vLyBjb25zdCBjdXJyZW5jeVBhdHRlcm5FVSA9IC9eW1xcZCwuXStcXHM/XFxwe1NjfSQvdWlnXG5jb25zdCBudW1iZXJpc2hQYXR0ZXJuID0gL14tP1tcXGQuLF0rJC9cbmNvbnN0IGZsb2F0UGF0dGVybiA9IC9cXGRcXC5cXGQvXG4vLyBjb25zdCBlbWFpbFBhdHRlcm4gPSAvXlteQF0rQFteQF17Mix9XFwuW15AXXsyLH1bXi5dJC9cbmNvbnN0IGVtYWlsUGF0dGVybiA9IC9eXFx3KyhbLi1dP1xcdyspKkBcXHcrKFsuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskL1xuY29uc3QgbnVsbGlzaFBhdHRlcm4gPSAvbnVsbC9pXG4vLyBjb25zdCBlbWFpbFBhdHRlcm4gPSAvXlxcdysoW1xcLi1dP1xcdyspKkBcXHcrKFtcXC4tXT9cXHcrKSooXFwuXFx3ezIsM30pKyQvaWdtXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmcgfCBhbnlbXX0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gaXNCb29saXNoICh2YWx1ZSwgX2ZpZWxkTmFtZSA9IG51bGwpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPD0gNiAmJiBib29saXNoUGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkpXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmcgfCBhbnlbXX0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gaXNVdWlkICh2YWx1ZSwgX2ZpZWxkTmFtZSA9IG51bGwpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCA0MCAmJiB1dWlkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZyB8IGFueVtdPX0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RJZCAodmFsdWUsIF9maWVsZE5hbWUgPSBudWxsKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDwgNDAgJiYgb2JqZWN0SWRQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmcgfCBhbnlbXX0gdmFsdWVcbiAqL1xuZnVuY3Rpb24gaXNEYXRlU3RyaW5nICh2YWx1ZSwgX2ZpZWxkTmFtZSA9IG51bGwpIHtcbiAgLy8gbm90IGJ1bGxldC1wcm9vZiwgbWVhbnQgdG8gc25pZmYgaW50ZW50aW9uIGluIHRoZSBkYXRhXG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHJldHVybiB0cnVlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIGRhdGVTdHJpbmdQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGlzVGltZXN0YW1wICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHRpbWVzdGFtcFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqL1xuZnVuY3Rpb24gaXNDdXJyZW5jeSAodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGNvbnN0IHZhbHVlU3ltYm9sID0gY3VycmVuY2llcy5maW5kKChjdXJTeW1ib2wpID0+IHZhbHVlLmluZGV4T2YoY3VyU3ltYm9sKSA+IC0xKVxuICBpZiAoIXZhbHVlU3ltYm9sKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHZhbHVlU3ltYm9sLCAnJylcbiAgcmV0dXJuIGlzTnVtZXJpYyh2YWx1ZSlcbiAgLy8gY29uc29sZS5sb2codmFsdWUsICdjdXJyZW5jeVBhdHRlcm5VUycsIGN1cnJlbmN5UGF0dGVyblVTLnRlc3QodmFsdWUpLCAnY3VycmVuY3lQYXR0ZXJuRVUnLCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKSk7XG4gIC8vIHJldHVybiBjdXJyZW5jeVBhdHRlcm5VUy50ZXN0KHZhbHVlKSB8fCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nIHwgYW55W119IFt2YWx1ZV0gLSByYXcgaW5wdXQgdG8gdmFsaWRhdGVcbiAqL1xuZnVuY3Rpb24gaXNOdW1lcmljICh2YWx1ZSwgX2ZpZWxkTmFtZSA9IG51bGwpIHtcbiAgLy8gaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCAzMCAmJiBudW1iZXJpc2hQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICovXG5mdW5jdGlvbiBpc0Zsb2F0aXNoICh2YWx1ZSkge1xuICByZXR1cm4gISEoaXNOdW1lcmljKFN0cmluZyh2YWx1ZSkpICYmIGZsb2F0UGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkpICYmICFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSlcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZyB8IHN0cmluZ1tdfSB2YWx1ZVxuICovXG5mdW5jdGlvbiBpc0VtYWlsU2hhcGVkICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgaWYgKHZhbHVlLmluY2x1ZGVzKCcgJykgfHwgIXZhbHVlLmluY2x1ZGVzKCdAJykpIHJldHVybiBmYWxzZVxuICByZXR1cm4gdmFsdWUubGVuZ3RoID49IDUgJiYgdmFsdWUubGVuZ3RoIDwgODAgJiYgZW1haWxQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbi8qKlxuICogQHBhcmFtIHthbnl9IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGlzTnVsbGlzaCAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IG51bGxpc2hQYXR0ZXJuLnRlc3QoU3RyaW5nKHZhbHVlKS50cmltKCkpXG59XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmltcG9ydCB7IFR5cGVBbmFseXNpcyB9IGZyb20gJy4uL2luZGV4J1xuaW1wb3J0IHtcbiAgaXNCb29saXNoLFxuICBpc0N1cnJlbmN5LFxuICBpc0RhdGVTdHJpbmcsXG4gIGlzRW1haWxTaGFwZWQsXG4gIGlzRmxvYXRpc2gsXG4gIGlzTnVsbGlzaCxcbiAgaXNOdW1lcmljLFxuICBpc09iamVjdElkLFxuICBpc1RpbWVzdGFtcCxcbiAgaXNVdWlkXG59IGZyb20gJy4vdHlwZS1kZXRlY3RvcnMuanMnXG5cbmNvbnN0IGhhc0xlYWRpbmdaZXJvID0gL14wKy9cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IG9mIFR5cGVOYW1lLlxuICogQHBhcmFtIHthbnl9IHZhbHVlIC0gaW5wdXQgZGF0YVxuICogQHJldHVybnMge3N0cmluZ1tdfVxuICovXG5mdW5jdGlvbiBkZXRlY3RUeXBlcyAodmFsdWUsIHN0cmljdE1hdGNoaW5nID0gdHJ1ZSkge1xuICBjb25zdCBleGNsdWRlZFR5cGVzID0gW11cbiAgY29uc3QgbWF0Y2hlZFR5cGVzID0gcHJpb3JpdGl6ZWRUeXBlcy5yZWR1Y2UoKHR5cGVzLCB0eXBlSGVscGVyKSA9PiB7XG4gICAgaWYgKHR5cGVIZWxwZXIuY2hlY2sodmFsdWUpKSB7XG4gICAgICBpZiAodHlwZUhlbHBlci5zdXBlcmNlZGVzKSBleGNsdWRlZFR5cGVzLnB1c2goLi4udHlwZUhlbHBlci5zdXBlcmNlZGVzKVxuICAgICAgdHlwZXMucHVzaCh0eXBlSGVscGVyLnR5cGUpXG4gICAgfVxuICAgIHJldHVybiB0eXBlc1xuICB9LCBbXSlcbiAgcmV0dXJuICFzdHJpY3RNYXRjaGluZ1xuICAgID8gbWF0Y2hlZFR5cGVzXG4gICAgOiBtYXRjaGVkVHlwZXMuZmlsdGVyKCh0eXBlKSA9PiBleGNsdWRlZFR5cGVzLmluZGV4T2YodHlwZSkgPT09IC0xKVxufVxuXG4vKipcbiAqIE1ldGFDaGVja3MgYXJlIHVzZWQgdG8gYW5hbHl6ZSB0aGUgaW50ZXJtZWRpYXRlIHJlc3VsdHMsIGFmdGVyIHRoZSBCYXNpYyAoZGlzY3JlZXQpIHR5cGUgY2hlY2tzIGFyZSBjb21wbGV0ZS5cbiAqIFRoZXkgaGF2ZSBhY2Nlc3MgdG8gYWxsIHRoZSBkYXRhIHBvaW50cyBiZWZvcmUgaXQgaXMgZmluYWxseSBwcm9jZXNzZWQuXG4gKi9cbmNvbnN0IE1ldGFDaGVja3MgPSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gdHlwZUluZm9cbiAgICovXG4gIFRZUEVfRU5VTToge1xuICAgIHR5cGU6ICdlbnVtJyxcbiAgICBtYXRjaEJhc2ljVHlwZXM6IFsnU3RyaW5nJywgJ051bWJlciddLFxuICAgIGNoZWNrOiAoXG4gICAgICB0eXBlSW5mbyxcbiAgICAgIHsgcm93Q291bnQsIHVuaXF1ZXMgfSxcbiAgICAgIHsgZW51bUFic29sdXRlTGltaXQsIGVudW1QZXJjZW50VGhyZXNob2xkIH1cbiAgICApID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgdW5pcXVlbmVzcyB1c2luZyBBTEwgdW5pcXVlcyBjb21iaW5lZCBmcm9tIEFMTCB0eXBlcywgdGhpcyBvbmx5IHNlZXMgY29uc2lzdGVudGx5IHR5cGVkIGRhdGFcbiAgICAgIC8vIGNvbnN0IHVuaXF1ZW5lc3MgPSByb3dDb3VudCAvIHVuaXF1ZXMubGVuZ3RoXG4gICAgICBjb25zdCByZWxhdGl2ZUVudW1MaW1pdCA9IE1hdGgubWluKFxuICAgICAgICBwYXJzZUludChTdHJpbmcocm93Q291bnQgKiBlbnVtUGVyY2VudFRocmVzaG9sZCksIDEwKSxcbiAgICAgICAgZW51bUFic29sdXRlTGltaXRcbiAgICAgIClcbiAgICAgIGlmICh1bmlxdWVzLmxlbmd0aCA+IHJlbGF0aXZlRW51bUxpbWl0KSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIGNvbnN0IGVudW1MaW1pdCA9IHVuaXF1ZW5lc3MgPCBlbnVtQWJzb2x1dGVMaW1pdCAmJiByZWxhdGl2ZUVudW1MaW1pdCA8IGVudW1BYnNvbHV0ZUxpbWl0XG4gICAgICAvLyAgID8gZW51bUFic29sdXRlTGltaXRcbiAgICAgIC8vICAgOiByZWxhdGl2ZUVudW1MaW1pdFxuXG4gICAgICByZXR1cm4geyBlbnVtOiB1bmlxdWVzLCAuLi50eXBlSW5mbyB9XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfSxcbiAgLyoqXG4gICAqIEBwYXJhbSB7VHlwZUFuYWx5c2lzfSB0eXBlSW5mb1xuICAgKi9cbiAgVFlQRV9OVUxMQUJMRToge1xuICAgIHR5cGU6ICdudWxsYWJsZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgbnVsbGFibGVSb3dzVGhyZXNob2xkIH0pID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICBjb25zdCB7IHR5cGVzIH0gPSB0eXBlSW5mb1xuICAgICAgbGV0IG51bGxpc2hUeXBlQ291bnQgPSAwXG4gICAgICBpZiAodHlwZXMuTnVsbCkge1xuICAgICAgICBudWxsaXNoVHlwZUNvdW50ICs9IHR5cGVzLk51bGwuY291bnRcbiAgICAgIH1cbiAgICAgIC8vIGlmICh0eXBlcy5Vbmtub3duKSB7XG4gICAgICAvLyAgIG51bGxpc2hUeXBlQ291bnQgKz0gdHlwZXMuVW5rbm93bi5jb3VudFxuICAgICAgLy8gfVxuICAgICAgY29uc3QgbnVsbExpbWl0ID0gcm93Q291bnQgKiBudWxsYWJsZVJvd3NUaHJlc2hvbGRcbiAgICAgIGNvbnN0IGlzTm90TnVsbGFibGUgPSBudWxsaXNoVHlwZUNvdW50IDw9IG51bGxMaW1pdFxuICAgICAgLy8gVE9ETzogTG9vayBpbnRvIHNwZWNpZmljYWxseSBjaGVja2luZyAnTnVsbCcgb3IgJ1Vua25vd24nIHR5cGUgc3RhdHNcbiAgICAgIHJldHVybiB7IG51bGxhYmxlOiAhaXNOb3ROdWxsYWJsZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH0sXG4gIFRZUEVfVU5JUVVFOiB7XG4gICAgdHlwZTogJ3VuaXF1ZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICAvKipcbiAgICAqIEBwYXJhbSB7VHlwZUFuYWx5c2lzfSB0eXBlSW5mb1xuICAgICovXG4gICAgY2hlY2s6ICh0eXBlSW5mbywgeyByb3dDb3VudCwgdW5pcXVlcyB9LCB7IHVuaXF1ZVJvd3NUaHJlc2hvbGQgfSkgPT4ge1xuICAgICAgaWYgKCF1bmlxdWVzIHx8IHVuaXF1ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIGNvbnN0IHVuaXF1ZW5lc3MgPSByb3dDb3VudCAvIHVuaXF1ZXMubGVuZ3RoXG4gICAgICBjb25zdCBpc1VuaXF1ZSA9IHVuaXF1ZXMubGVuZ3RoID09PSByb3dDb3VudCAqIHVuaXF1ZVJvd3NUaHJlc2hvbGRcbiAgICAgIC8vIFRPRE86IExvb2sgaW50byBzcGVjaWZpY2FsbHkgY2hlY2tpbmcgJ051bGwnIG9yICdVbmtub3duJyB0eXBlIHN0YXRzXG4gICAgICByZXR1cm4geyB1bmlxdWU6IGlzVW5pcXVlLCAuLi50eXBlSW5mbyB9XG4gICAgICAvLyByZXR1cm4ge3VuaXF1ZTogdW5pcXVlbmVzcyA+PSB1bmlxdWVSb3dzVGhyZXNob2xkLCAuLi50eXBlSW5mb31cbiAgICAgIC8vIFRPRE86IGNhbGN1bGF0ZSBlbnRyb3B5IHVzaW5nIGEgc3VtIG9mIGFsbCBub24tbnVsbCBkZXRlY3RlZCB0eXBlcywgbm90IGp1c3QgdHlwZUNvdW50XG4gICAgfVxuICB9XG59XG5cbi8vIEJhc2ljIFR5cGUgRmlsdGVycyAtIHJ1ZGltZW50YXJ5IGRhdGEgc25pZmZpbmcgdXNlZCB0byB0YWxseSB1cCBcInZvdGVzXCIgZm9yIGEgZ2l2ZW4gZmllbGRcbi8qKlxuICogRGV0ZWN0IGFtYmlndW91cyBmaWVsZCB0eXBlLlxuICogV2lsbCBub3QgYWZmZWN0IHdlaWdodGVkIGZpZWxkIGFuYWx5c2lzLlxuICovXG5jb25zdCBUWVBFX1VOS05PV04gPSB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICovXG4gIGNoZWNrOiAodmFsdWUpID0+IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICd1bmRlZmluZWQnLFxuICB0eXBlOiAnVW5rbm93bidcbn1cbmNvbnN0IFRZUEVfT0JKRUNUX0lEID0ge1xuICBjaGVjazogaXNPYmplY3RJZCxcbiAgdHlwZTogJ09iamVjdElkJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXVxufVxuY29uc3QgVFlQRV9VVUlEID0ge1xuICBjaGVjazogaXNVdWlkLFxuICB0eXBlOiAnVVVJRCcsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ11cbn1cbmNvbnN0IFRZUEVfQk9PTEVBTiA9IHtcbiAgY2hlY2s6IGlzQm9vbGlzaCxcbiAgdHlwZTogJ0Jvb2xlYW4nLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZyddXG59XG5jb25zdCBUWVBFX0RBVEUgPSB7XG4gIGNoZWNrOiBpc0RhdGVTdHJpbmcsXG4gIHR5cGU6ICdEYXRlJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXVxufVxuY29uc3QgVFlQRV9USU1FU1RBTVAgPSB7XG4gIGNoZWNrOiBpc1RpbWVzdGFtcCxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIHR5cGU6ICdUaW1lc3RhbXAnXG59XG5jb25zdCBUWVBFX0NVUlJFTkNZID0ge1xuICBjaGVjazogaXNDdXJyZW5jeSxcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ11cbn1cbmNvbnN0IFRZUEVfRkxPQVQgPSB7XG4gIGNoZWNrOiBpc0Zsb2F0aXNoLFxuICB0eXBlOiAnRmxvYXQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZycsICdOdW1iZXInXVxufVxuY29uc3QgVFlQRV9OVU1CRVIgPVxuICAvKipcbiAgICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICAgKi9cbiAge1xuICAgIGNoZWNrOiAodmFsdWUpID0+IHtcbiAgICAgIGlmIChoYXNMZWFkaW5nWmVyby50ZXN0KFN0cmluZyh2YWx1ZSkpKSByZXR1cm4gZmFsc2VcbiAgICAgIHJldHVybiAhIShcbiAgICAgICAgdmFsdWUgIT09IG51bGwgJiZcbiAgICAgICAgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmXG4gICAgICAgIChOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBpc051bWVyaWModmFsdWUpKVxuICAgICAgKVxuICAgIH0sXG4gICAgdHlwZTogJ051bWJlcidcbiAgfVxuY29uc3QgVFlQRV9FTUFJTCA9IHtcbiAgY2hlY2s6IGlzRW1haWxTaGFwZWQsXG4gIHR5cGU6ICdFbWFpbCcsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ11cbn1cbmNvbnN0IFRZUEVfU1RSSU5HID1cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICAgKi9cbiAge1xuICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgIGNoZWNrOiAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgLy8gJiYgdmFsdWUubGVuZ3RoID49IDFcbiAgfVxuY29uc3QgVFlQRV9BUlJBWSA9XG4gIC8qKlxuICAgKiBAcGFyYW0ge2FueX0gdmFsdWVcbiAgICovXG4gIHtcbiAgICBjaGVjazogKHZhbHVlKSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSxcbiAgICB0eXBlOiAnQXJyYXknXG4gIH1cbmNvbnN0IFRZUEVfT0JKRUNUID1cbiAgLyoqXG4gICAqIEBwYXJhbSB7YW55fSB2YWx1ZVxuICAgKi9cbiAge1xuICAgIGNoZWNrOiAodmFsdWUpID0+XG4gICAgICAhQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnLFxuICAgIHR5cGU6ICdPYmplY3QnXG4gIH1cbmNvbnN0IFRZUEVfTlVMTCA9IHtcbiAgdHlwZTogJ051bGwnLFxuICBjaGVjazogaXNOdWxsaXNoXG59XG5cbmNvbnN0IHByaW9yaXRpemVkVHlwZXMgPSBbXG4gIFRZUEVfVU5LTk9XTixcbiAgVFlQRV9PQkpFQ1RfSUQsXG4gIFRZUEVfVVVJRCxcbiAgVFlQRV9CT09MRUFOLFxuICBUWVBFX0RBVEUsXG4gIFRZUEVfVElNRVNUQU1QLFxuICBUWVBFX0NVUlJFTkNZLFxuICBUWVBFX0ZMT0FULFxuICBUWVBFX05VTUJFUixcbiAgVFlQRV9OVUxMLFxuICBUWVBFX0VNQUlMLFxuICBUWVBFX1NUUklORyxcbiAgVFlQRV9BUlJBWSxcbiAgVFlQRV9PQkpFQ1Rcbl1cblxuLyoqXG4gKiBUeXBlIFJhbmsgTWFwOiBVc2UgdG8gc29ydCBMb3dlc3QgdG8gSGlnaGVzdFxuICovXG5jb25zdCB0eXBlUmFua2luZ3MgPSB7XG4gIFtUWVBFX1VOS05PV04udHlwZV06IC0xLFxuICBbVFlQRV9PQkpFQ1RfSUQudHlwZV06IDEsXG4gIFtUWVBFX1VVSUQudHlwZV06IDIsXG4gIFtUWVBFX0JPT0xFQU4udHlwZV06IDMsXG4gIFtUWVBFX0RBVEUudHlwZV06IDQsXG4gIFtUWVBFX1RJTUVTVEFNUC50eXBlXTogNSxcbiAgW1RZUEVfQ1VSUkVOQ1kudHlwZV06IDYsXG4gIFtUWVBFX0ZMT0FULnR5cGVdOiA3LFxuICBbVFlQRV9OVU1CRVIudHlwZV06IDgsXG4gIFtUWVBFX05VTEwudHlwZV06IDEwLFxuICBbVFlQRV9FTUFJTC50eXBlXTogMTEsXG4gIFtUWVBFX1NUUklORy50eXBlXTogMTIsXG4gIFtUWVBFX0FSUkFZLnR5cGVdOiAxMyxcbiAgW1RZUEVfT0JKRUNULnR5cGVdOiAxNFxufVxuXG5leHBvcnQge1xuICB0eXBlUmFua2luZ3MsXG4gIHByaW9yaXRpemVkVHlwZXMsXG4gIGRldGVjdFR5cGVzLFxuICBNZXRhQ2hlY2tzLFxuICBUWVBFX1VOS05PV04sXG4gIFRZUEVfT0JKRUNUX0lELFxuICBUWVBFX1VVSUQsXG4gIFRZUEVfQk9PTEVBTixcbiAgVFlQRV9EQVRFLFxuICBUWVBFX1RJTUVTVEFNUCxcbiAgVFlQRV9DVVJSRU5DWSxcbiAgVFlQRV9GTE9BVCxcbiAgVFlQRV9OVU1CRVIsXG4gIFRZUEVfTlVMTCxcbiAgVFlQRV9FTUFJTCxcbiAgVFlQRV9TVFJJTkcsXG4gIFRZUEVfQVJSQVksXG4gIFRZUEVfT0JKRUNUXG59XG4vLyBjb25zdCBUWVBFX0VOVU0gPSB7XG4vLyAgIHR5cGU6IFwiU3RyaW5nXCIsXG4vLyAgIGNoZWNrOiAodmFsdWUsIGZpZWxkSW5mbywgc2NoZW1hSW5mbykgPT4ge1xuLy8gICAgIC8vIFRocmVzaG9sZCBzZXQgdG8gNSUgLSA1IChvciBmZXdlcikgb3V0IG9mIDEwMCB1bmlxdWUgc3RyaW5ncyBzaG91bGQgZW5hYmxlICdlbnVtJyBtb2RlXG4vLyAgICAgaWYgKHNjaGVtYUluZm8uaW5wdXRSb3dDb3VudCA8IDEwMCkgcmV0dXJuIGZhbHNlOyAvLyBkaXNhYmxlZCBpZiBzZXQgdG9vIHNtYWxsXG4vLyAgIH1cbi8vIH07XG4iLCJpbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnXG5pbXBvcnQgeyBkZXRlY3RUeXBlcywgTWV0YUNoZWNrcywgdHlwZVJhbmtpbmdzIH0gZnJvbSAnLi91dGlscy90eXBlLWhlbHBlcnMuanMnXG5jb25zdCBsb2cgPSBkZWJ1Zygnc2NoZW1hLWJ1aWxkZXI6aW5kZXgnKVxuLy8gY29uc3QgY2FjaGUgPSBuZXcgU3RhdHNNYXAoKTtcbi8vIGNvbnN0IGRldGVjdFR5cGVzQ2FjaGVkID0gbWVtKF9kZXRlY3RUeXBlcywgeyBjYWNoZSwgbWF4QWdlOiAxMDAwICogNjAwIH0pIC8vIGtlZXAgY2FjaGUgdXAgdG8gMTAgbWludXRlc1xuXG5leHBvcnQgeyBzY2hlbWFCdWlsZGVyLCBwaXZvdEZpZWxkRGF0YUJ5VHlwZSwgZ2V0TnVtYmVyUmFuZ2VTdGF0cywgaXNWYWxpZERhdGUgfVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nIHwgbnVtYmVyIHwgRGF0ZSB8IHVuZGVmaW5lZCB8IGFueX0gZGF0ZVxuICogQHJldHVybnMge0RhdGUgfCBmYWxzZX1cbiAqL1xuZnVuY3Rpb24gaXNWYWxpZERhdGUgKGRhdGUpIHtcbiAgZGF0ZSA9IGRhdGUgaW5zdGFuY2VvZiBEYXRlID8gZGF0ZSA6IG5ldyBEYXRlKGRhdGUpXG4gIHJldHVybiBpc05hTihkYXRlLmdldEZ1bGxZZWFyKCkpID8gZmFsc2UgOiBkYXRlXG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgRGF0ZX0gZGF0ZVxuICovXG5jb25zdCBwYXJzZURhdGUgPSAoZGF0ZSkgPT4ge1xuICBkYXRlID0gaXNWYWxpZERhdGUoZGF0ZSlcbiAgcmV0dXJuIGRhdGUgJiYgZGF0ZS50b0lTT1N0cmluZyAmJiBkYXRlLnRvSVNPU3RyaW5nKClcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiBDb25kZW5zZUZpZWxkRGF0YUFyZ3NcbiAqIEB0eXBlIHt7XG4gKiAgIGZpZWxkc0RhdGE6IEludGVybWVkaWF0ZVR5cGVNZWFzdXJlbWVudHNbXSxcbiAqICAgdW5pcXVlczogT2JqZWN0LjxzdHJpbmcsIGFueVtdPixcbiAqICAgdG90YWxSb3dzOiBudW1iZXJcbiAqIH19XG4gKi9cblxuLyoqXG4gKiBBbmFseXNpcyByZXN1bHRzLlxuICogQHR5cGVkZWYgVHlwZVN1bW1hcnlcbiAqIEB0eXBlIHt7XG4gICogIGZpZWxkczogT2JqZWN0LjxzdHJpbmcsIEZpZWxkSW5mbz4sXG4gICogIHRvdGFsUm93czogbnVtYmVyO1xuICAqIH19XG4gICovXG5cbi8qKlxuICogQW5hbHlzaXMgcmVzdWx0cy5cbiAqIEB0eXBlZGVmIEludGVybWVkaWF0ZVR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7e1xuICAqICBmaWVsZHM6IE9iamVjdC48c3RyaW5nLCBGaWVsZEluZm8+LFxuICAqICB0b3RhbFJvd3M/OiBudW1iZXI7XG4gICogIHVuaXF1ZXM/OiBhbnlbXTtcbiAgKiB9fVxuICAqL1xuXG4vKipcbiAqIEFuYWx5c2lzIHJlc3VsdHMuXG4gKiBAZXhwb3J0XG4gKiBAdHlwZWRlZiBUeXBlQW5hbHlzaXNcbiAqIEB0eXBlIHt7XG4gKiAgICBBcnJheT86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgQm9vbGVhbj86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgQ3VycmVuY3k/OiBGaWVsZFR5cGVTdGF0cyxcbiAqICAgIERhdGU/OiBGaWVsZFR5cGVTdGF0cyxcbiAqICAgIEVtYWlsPzogRmllbGRUeXBlU3RhdHMsXG4gKiAgICBGbG9hdD86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgTnVsbD86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgTnVtYmVyPzogRmllbGRUeXBlU3RhdHMsXG4gKiAgICBPYmplY3Q/OiBGaWVsZFR5cGVTdGF0cyxcbiAqICAgIE9iamVjdElkPzogRmllbGRUeXBlU3RhdHMsXG4gKiAgICBTdHJpbmc/OiBGaWVsZFR5cGVTdGF0cyxcbiAqICAgIFRpbWVzdGFtcD86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgVW5rbm93bj86IEZpZWxkVHlwZVN0YXRzLFxuICogICAgVVVJRD86IEZpZWxkVHlwZVN0YXRzLFxuICogIH19XG4gKi9cblxuLyoqXG4gKiBBbmFseXNpcyB0cmFja2luZyBzdGF0ZS5cbiAqIEBleHBvcnRcbiAqIEB0eXBlZGVmIEludGVybWVkaWF0ZVR5cGVBbmFseXNpc1xuICogQHR5cGUge3tcbiAqICAgIEFycmF5PzogRmllbGRUeXBlRGF0YSxcbiAqICAgIEJvb2xlYW4/OiBGaWVsZFR5cGVEYXRhLFxuICogICAgQ3VycmVuY3k/OiBGaWVsZFR5cGVEYXRhLFxuICogICAgRGF0ZT86IEZpZWxkVHlwZURhdGEsXG4gKiAgICBFbWFpbD86IEZpZWxkVHlwZURhdGEsXG4gKiAgICBGbG9hdD86IEZpZWxkVHlwZURhdGEsXG4gKiAgICBOdWxsPzogRmllbGRUeXBlRGF0YSxcbiAqICAgIE51bWJlcj86IEZpZWxkVHlwZURhdGEsXG4gKiAgICBPYmplY3Q/OiBGaWVsZFR5cGVEYXRhLFxuICogICAgT2JqZWN0SWQ/OiBGaWVsZFR5cGVEYXRhLFxuICogICAgU3RyaW5nPzogRmllbGRUeXBlRGF0YSxcbiAqICAgIFRpbWVzdGFtcD86IEZpZWxkVHlwZURhdGEsXG4gKiAgICBVbmtub3duPzogRmllbGRUeXBlRGF0YSxcbiAqICAgIFVVSUQ/OiBGaWVsZFR5cGVEYXRhLFxuICogIH19XG4gKi9cblxuLyoqXG4gKiBBbmFseXNpcyB0cmFja2luZyBzdGF0ZS5cbiAqIEBleHBvcnRcbiAqIEB0eXBlZGVmIEludGVybWVkaWF0ZVR5cGVNZWFzdXJlbWVudHNcbiAqIEB0eXBlIHt7XG4gICogICAgQXJyYXk/OiBhbnksXG4gICogICAgQm9vbGVhbj86IGFueSxcbiAgKiAgICBDdXJyZW5jeT86IGFueSxcbiAgKiAgICBEYXRlPzogYW55LFxuICAqICAgIEVtYWlsPzogYW55LFxuICAqICAgIEZsb2F0PzogYW55LFxuICAqICAgIE51bGw/OiBhbnksXG4gICogICAgTnVtYmVyPzogYW55LFxuICAqICAgIE9iamVjdD86IGFueSxcbiAgKiAgICBPYmplY3RJZD86IGFueSxcbiAgKiAgICBTdHJpbmc/OiBhbnksXG4gICogICAgVGltZXN0YW1wPzogYW55LFxuICAqICAgIFVua25vd24/OiBhbnksXG4gICogICAgVVVJRD86IGFueSxcbiAgKiAgfX1cbiAgKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGludGVybmFsIGludGVybWVkaWF0ZSBzdHJ1Y3R1cmUuXG4gKiBJdCBtaXJyb3JzIHRoZSBgRmllbGRUeXBlU3RhdHNgIHR5cGUgaXQgd2lsbCBiZWNvbWUuXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYgRmllbGRUeXBlRGF0YVxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFt2YWx1ZV0gLSBhcnJheSBvZiB2YWx1ZXMsIHByZSBwcm9jZXNzaW5nIGludG8gYW4gQWdncmVnYXRlU3VtbWFyeVxuICogQHByb3BlcnR5IHtudW1iZXJbXX0gW2xlbmd0aF0gLSBhcnJheSBvZiBzdHJpbmcgKG9yIGRlY2ltYWwpIHNpemVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtwcmVjaXNpb25dIC0gb25seSBhcHBsaWVzIHRvIEZsb2F0IHR5cGVzLiBBcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYm90aCBiZWZvcmUgYW5kIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtudW1iZXJbXX0gW3NjYWxlXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gQXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtjb3VudF0gLSBudW1iZXIgb2YgdGltZXMgdGhlIHR5cGUgd2FzIG1hdGNoZWRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbcmFua10gLSBhYnNvbHV0ZSBwcmlvcml0eSBvZiB0aGUgZGV0ZWN0ZWQgVHlwZU5hbWUsIGRlZmluZWQgaW4gdGhlIG9iamVjdCBgdHlwZVJhbmtpbmdzYFxuICpcbiAqL1xuXG4vKipcbiAqXG4gKiBAdHlwZWRlZiBGaWVsZFR5cGVTdGF0c1xuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3ZhbHVlXSAtIHN1bW1hcnkgb2YgYXJyYXkgb2YgdmFsdWVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW2xlbmd0aF0gLSBzdW1tYXJ5IG9mIGFycmF5IG9mIHN0cmluZyAob3IgZGVjaW1hbCkgc2l6ZXMsIHByZSBwcm9jZXNzaW5nIGludG8gYW4gQWdncmVnYXRlU3VtbWFyeVxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbcHJlY2lzaW9uXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gU3VtbWFyeSBvZiBhcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYm90aCBiZWZvcmUgYW5kIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbc2NhbGVdIC0gb25seSBhcHBsaWVzIHRvIEZsb2F0IHR5cGVzLiBTdW1tYXJ5IG9mIGFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW118bnVtYmVyW119IFtlbnVtXSAtIGlmIGVudW0gcnVsZXMgd2VyZSB0cmlnZ2VyZWQgd2lsbCBjb250YWluIHRoZSBkZXRlY3RlZCB1bmlxdWUgdmFsdWVzLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtjb3VudD0wXSAtIG51bWJlciBvZiB0aW1lcyB0aGUgdHlwZSB3YXMgbWF0Y2hlZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtyYW5rPTBdIC0gYWJzb2x1dGUgcHJpb3JpdHkgb2YgdGhlIGRldGVjdGVkIFR5cGVOYW1lLCBkZWZpbmVkIGluIHRoZSBvYmplY3QgYHR5cGVSYW5raW5nc2BcbiAqXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBGaWVsZEluZm9cbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge1R5cGVBbmFseXNpcyB8IEludGVybWVkaWF0ZVR5cGVBbmFseXNpc30gdHlwZXMgLSBmaWVsZCBzdGF0cyBvcmdhbml6ZWQgYnkgdHlwZVxuICogQHByb3BlcnR5IHtib29sZWFufSBudWxsYWJsZSAtIGlzIHRoZSBmaWVsZCBudWxsYWJsZVxuICogQHByb3BlcnR5IHtib29sZWFufSB1bmlxdWUgLSBpcyB0aGUgZmllbGQgdW5pcXVlXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfG51bWJlcltdfSBbZW51bV0gLSBlbnVtZXJhdGlvbiBkZXRlY3RlZCwgdGhlIHZhbHVlcyBhcmUgbGlzdGVkIG9uIHRoaXMgcHJvcGVydHkuXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIHJlcHJlc2VudCBhIG51bWJlciBzZXJpZXMgb2YgYW55IHNpemUuXG4gKiBJbmNsdWRlcyB0aGUgbG93ZXN0IChgbWluYCksIGhpZ2hlc3QgKGBtYXhgKSwgbWVhbi9hdmVyYWdlIChgbWVhbmApIGFuZCBtZWFzdXJlbWVudHMgYXQgY2VydGFpbiBgcGVyY2VudGlsZXNgLlxuICogQHR5cGVkZWYgQWdncmVnYXRlU3VtbWFyeVxuICogQHR5cGUge3ttaW46IG51bWJlciwgbWF4OiBudW1iZXIsIG1lYW46IG51bWJlciwgcDI1OiBudW1iZXIsIHAzMzogbnVtYmVyLCBwNTA6IG51bWJlciwgcDY2OiBudW1iZXIsIHA3NTogbnVtYmVyLCBwOTk6IG51bWJlcn19XG4gKi9cblxuLyoqXG4gKiBUaGlzIGNhbGxiYWNrIGlzIGRpc3BsYXllZCBhcyBhIGdsb2JhbCBtZW1iZXIuXG4gKiBAY2FsbGJhY2sgcHJvZ3Jlc3NDYWxsYmFja1xuICogQHBhcmFtIHt7dG90YWxSb3dzOiBudW1iZXIsIGN1cnJlbnRSb3c6IG51bWJlcn19IHByb2dyZXNzIC0gVGhlIGN1cnJlbnQgcHJvZ3Jlc3Mgb2YgcHJvY2Vzc2luZy5cbiAqL1xuXG4vKipcbiAqIHNjaGVtYUJ1aWxkZXIgaXMgdGhlIG1haW4gZnVuY3Rpb24gYW5kIHdoZXJlIGFsbCB0aGUgYW5hbHlzaXMgJiBwcm9jZXNzaW5nIGhhcHBlbnMuXG4gKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGlucHV0IC0gVGhlIGlucHV0IGRhdGEgdG8gYW5hbHl6ZS4gTXVzdCBiZSBhbiBhcnJheSBvZiBvYmplY3RzLlxuICogQHBhcmFtIHt7IG9uUHJvZ3Jlc3M/OiBwcm9ncmVzc0NhbGxiYWNrLCBlbnVtTWluaW11bVJvd0NvdW50PzogbnVtYmVyLCBlbnVtQWJzb2x1dGVMaW1pdD86IG51bWJlciwgZW51bVBlcmNlbnRUaHJlc2hvbGQ/OiBudW1iZXIsIG51bGxhYmxlUm93c1RocmVzaG9sZD86IG51bWJlciwgdW5pcXVlUm93c1RocmVzaG9sZD86IG51bWJlciwgc3RyaWN0TWF0Y2hpbmc/OiBib29sZWFuIH19IFtvcHRpb25zXSAtIE9wdGlvbmFsIHBhcmFtZXRlcnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPFR5cGVTdW1tYXJ5Pn0gUmV0dXJucyBhbmRcbiAqL1xuZnVuY3Rpb24gc2NoZW1hQnVpbGRlciAoXG4gIGlucHV0LFxuICB7XG4gICAgb25Qcm9ncmVzcyA9ICh7IHRvdGFsUm93cywgY3VycmVudFJvdyB9KSA9PiB7fSxcbiAgICBzdHJpY3RNYXRjaGluZyA9IHRydWUsXG4gICAgZW51bU1pbmltdW1Sb3dDb3VudCA9IDEwMCwgZW51bUFic29sdXRlTGltaXQgPSAxMCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgPSAwLjAxLFxuICAgIG51bGxhYmxlUm93c1RocmVzaG9sZCA9IDAuMDIsXG4gICAgdW5pcXVlUm93c1RocmVzaG9sZCA9IDEuMFxuICB9ID0ge1xuICAgIG9uUHJvZ3Jlc3M6ICh7IHRvdGFsUm93cywgY3VycmVudFJvdyB9KSA9PiB7fSxcbiAgICBzdHJpY3RNYXRjaGluZzogdHJ1ZSxcbiAgICBlbnVtTWluaW11bVJvd0NvdW50OiAxMDAsXG4gICAgZW51bUFic29sdXRlTGltaXQ6IDEwLFxuICAgIGVudW1QZXJjZW50VGhyZXNob2xkOiAwLjAxLFxuICAgIG51bGxhYmxlUm93c1RocmVzaG9sZDogMC4wMixcbiAgICB1bmlxdWVSb3dzVGhyZXNob2xkOiAxLjBcbiAgfVxuKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgdHlwZW9mIGlucHV0ICE9PSAnb2JqZWN0JykgdGhyb3cgRXJyb3IoJ0lucHV0IERhdGEgbXVzdCBiZSBhbiBBcnJheSBvZiBPYmplY3RzJylcbiAgaWYgKHR5cGVvZiBpbnB1dFswXSAhPT0gJ29iamVjdCcpIHRocm93IEVycm9yKCdJbnB1dCBEYXRhIG11c3QgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cycpXG4gIGlmIChpbnB1dC5sZW5ndGggPCA1KSB0aHJvdyBFcnJvcignQW5hbHlzaXMgcmVxdWlyZXMgYXQgbGVhc3QgNSByZWNvcmRzLiAoVXNlIDIwMCsgZm9yIGdyZWF0IHJlc3VsdHMuKScpXG4gIGNvbnN0IGlzRW51bUVuYWJsZWQgPSBpbnB1dC5sZW5ndGggPj0gZW51bU1pbmltdW1Sb3dDb3VudFxuXG4gIGxvZygnU3RhcnRpbmcnKVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGlucHV0KVxuICAgIC50aGVuKHBpdm90Um93c0dyb3VwZWRCeVR5cGUpXG4gICAgLnRoZW4oY29uZGVuc2VGaWVsZERhdGEpXG4gICAgLyoqIEB0eXBlIHtGaWVsZFN1bW1hcnl9ICovXG4gICAgLnRoZW4oKHNjaGVtYSkgPT4ge1xuICAgICAgbG9nKCdCdWlsdCBzdW1tYXJ5IGZyb20gRmllbGQgVHlwZSBkYXRhLicpXG4gICAgICAvLyBjb25zb2xlLmxvZygnZ2VuU2NoZW1hJywgSlNPTi5zdHJpbmdpZnkoZ2VuU2NoZW1hLCBudWxsLCAyKSlcblxuICAgICAgY29uc3QgZmllbGRzID0gT2JqZWN0LmtleXMoc2NoZW1hLmZpZWxkcylcbiAgICAgICAgLnJlZHVjZSgoZmllbGRJbmZvLCBmaWVsZE5hbWUpID0+IHtcbiAgICAgICAgICAvLyAvKiogQHR5cGUge1R5cGVBbmFseXNpc30gKi9cbiAgICAgICAgICAvKiogQHR5cGUge0ZpZWxkSW5mb30gKi9cbiAgICAgICAgICBjb25zdCB0eXBlcyA9IHNjaGVtYS5maWVsZHNbZmllbGROYW1lXVxuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0ge1xuICAgICAgICAgICAgdHlwZXNcbiAgICAgICAgICB9XG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfRU5VTS5jaGVjayhmaWVsZEluZm9bZmllbGROYW1lXSxcbiAgICAgICAgICAgIHsgcm93Q291bnQ6IGlucHV0Lmxlbmd0aCwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMgJiYgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB9LFxuICAgICAgICAgICAgeyBlbnVtQWJzb2x1dGVMaW1pdCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgfSlcbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IE1ldGFDaGVja3MuVFlQRV9OVUxMQUJMRS5jaGVjayhmaWVsZEluZm9bZmllbGROYW1lXSxcbiAgICAgICAgICAgIHsgcm93Q291bnQ6IGlucHV0Lmxlbmd0aCwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMgJiYgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB9LFxuICAgICAgICAgICAgeyBudWxsYWJsZVJvd3NUaHJlc2hvbGQgfSlcbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IE1ldGFDaGVja3MuVFlQRV9VTklRVUUuY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgdW5pcXVlUm93c1RocmVzaG9sZCB9KVxuXG4gICAgICAgICAgY29uc3QgaXNJZGVudGl0eSA9ICh0eXBlcy5OdW1iZXIgfHwgdHlwZXMuVVVJRCkgJiYgZmllbGRJbmZvW2ZpZWxkTmFtZV0udW5pcXVlICYmIC9pZCQvaS50ZXN0KGZpZWxkTmFtZSlcbiAgICAgICAgICBpZiAoaXNJZGVudGl0eSkge1xuICAgICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0uaWRlbnRpdHkgPSB0cnVlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0pIHtcbiAgICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdLnVuaXF1ZUNvdW50ID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5sZW5ndGhcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpZWxkSW5mb1xuICAgICAgICB9LCB7fSlcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICB0b3RhbFJvd3M6IHNjaGVtYS50b3RhbFJvd3NcbiAgICAgICAgLy8gdW5pcXVlczogdW5pcXVlcyxcbiAgICAgICAgLy8gZmllbGRzOiBzY2hlbWEuZmllbGRzXG4gICAgICB9XG4gICAgfSlcblxuICAvKipcbiAgICogQHBhcmFtIHtvYmplY3RbXX0gZG9jc1xuICAgKiBAcmV0dXJucyB7eyB0b3RhbFJvd3M6IG51bWJlcjsgdW5pcXVlczogeyBbeDogc3RyaW5nXTogYW55W107IH07IGZpZWxkc0RhdGE6IHsgW3g6IHN0cmluZ106IEZpZWxkVHlwZURhdGE7IH07IH19IHNjaGVtYVxuICAgKi9cbiAgZnVuY3Rpb24gcGl2b3RSb3dzR3JvdXBlZEJ5VHlwZSAoZG9jcykge1xuICAgIGNvbnN0IGRldGVjdGVkU2NoZW1hID0geyB1bmlxdWVzOiBpc0VudW1FbmFibGVkID8ge30gOiBudWxsLCBmaWVsZHNEYXRhOiB7fSwgdG90YWxSb3dzOiBudWxsIH1cbiAgICBsb2coYCAgQWJvdXQgdG8gZXhhbWluZSBldmVyeSByb3cgJiBjZWxsLiBGb3VuZCAke2RvY3MubGVuZ3RofSByZWNvcmRzLi4uYClcbiAgICBjb25zdCBwaXZvdGVkU2NoZW1hID0gZG9jcy5yZWR1Y2UoZXZhbHVhdGVTY2hlbWFMZXZlbCwgZGV0ZWN0ZWRTY2hlbWEpXG4gICAgbG9nKCcgIEV4dHJhY3RlZCBkYXRhIHBvaW50cyBmcm9tIEZpZWxkIFR5cGUgYW5hbHlzaXMnKVxuICAgIHJldHVybiBwaXZvdGVkU2NoZW1hXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7IHRvdGFsUm93czogbnVtYmVyOyB1bmlxdWVzOiB7IFt4OiBzdHJpbmddOiBhbnlbXTsgfTsgZmllbGRzRGF0YTogeyBbeDogc3RyaW5nXTogRmllbGRUeXBlRGF0YVtdOyB9OyB9fSBzY2hlbWFcbiAgICogQHBhcmFtIHt7IFt4OiBzdHJpbmddOiBhbnk7IH19IHJvd1xuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHBhcmFtIHthbnlbXX0gYXJyYXlcbiAgICovXG4gICAgZnVuY3Rpb24gZXZhbHVhdGVTY2hlbWFMZXZlbCAoc2NoZW1hLCByb3csIGluZGV4LCBhcnJheSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgc2NoZW1hLnRvdGFsUm93cyA9IHNjaGVtYS50b3RhbFJvd3MgfHwgYXJyYXkubGVuZ3RoXG4gICAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHJvdylcbiAgICBsb2coYFByb2Nlc3NpbmcgUm93ICMgJHtpbmRleCArIDF9LyR7c2NoZW1hLnRvdGFsUm93c30uLi5gKVxuICAgIGZpZWxkTmFtZXMuZm9yRWFjaCgoZmllbGROYW1lLCBpbmRleCwgYXJyYXkpID0+IHtcbiAgICAgIGlmIChpbmRleCA9PT0gMCkgbG9nKGBGb3VuZCAke2FycmF5Lmxlbmd0aH0gQ29sdW1uKHMpIWApXG4gICAgICBjb25zdCB0eXBlRmluZ2VycHJpbnQgPSBnZXRGaWVsZE1ldGFkYXRhKHtcbiAgICAgICAgdmFsdWU6IHJvd1tmaWVsZE5hbWVdLFxuICAgICAgICBzdHJpY3RNYXRjaGluZ1xuICAgICAgfSlcbiAgICAgIGNvbnN0IHR5cGVOYW1lcyA9IE9iamVjdC5rZXlzKHR5cGVGaW5nZXJwcmludClcbiAgICAgIGNvbnN0IGlzRW51bVR5cGUgPSB0eXBlTmFtZXMuaW5jbHVkZXMoJ051bWJlcicpIHx8IHR5cGVOYW1lcy5pbmNsdWRlcygnU3RyaW5nJylcblxuICAgICAgaWYgKGlzRW51bUVuYWJsZWQgJiYgaXNFbnVtVHlwZSkge1xuICAgICAgICBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB8fCBbXVxuICAgICAgICBpZiAoIXNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0uaW5jbHVkZXMocm93W2ZpZWxkTmFtZV0pKSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdLnB1c2gocm93W2ZpZWxkTmFtZV0pXG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSA9IG51bGxcbiAgICAgIH1cbiAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gPSBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdIHx8IFtdXG4gICAgICBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdLnB1c2godHlwZUZpbmdlcnByaW50KVxuICAgIH0pXG4gICAgb25Qcm9ncmVzcyh7IHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cywgY3VycmVudFJvdzogaW5kZXggKyAxIH0pXG4gICAgcmV0dXJuIHNjaGVtYVxuICB9XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7Q29uZGVuc2VGaWVsZERhdGFBcmdzfSBzY2hlbWFcbiAqIEByZXR1cm5zIHt7ZmllbGRzOiBPYmplY3QuPHN0cmluZywgSW50ZXJtZWRpYXRlVHlwZU1lYXN1cmVtZW50cz4sIHVuaXF1ZXM6IE9iamVjdC48c3RyaW5nLCBhbnlbXT4sIHRvdGFsUm93czogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZERhdGEgKHNjaGVtYSkge1xuICBjb25zdCB7IGZpZWxkc0RhdGEgfSA9IHNjaGVtYVxuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoZmllbGRzRGF0YSlcblxuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBJbnRlcm1lZGlhdGVUeXBlTWVhc3VyZW1lbnRzPn0gKi9cbiAgY29uc3QgZmllbGRTdW1tYXJ5ID0ge31cbiAgbG9nKGBQcmUtY29uZGVuc2VGaWVsZFNpemVzKGZpZWxkc1tmaWVsZE5hbWVdKSBmb3IgJHtmaWVsZE5hbWVzLmxlbmd0aH0gY29sdW1uc2ApXG4gIGZpZWxkTmFtZXNcbiAgICAuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICBjb25zdCBmbGREYXRhID0gZmllbGRzRGF0YVtmaWVsZE5hbWVdXG4gICAgICAvKiogQHR5cGUge0ludGVybWVkaWF0ZVR5cGVBbmFseXNpc30gKi9cbiAgICAgIGNvbnN0IHBpdm90ZWREYXRhID0gcGl2b3RGaWVsZERhdGFCeVR5cGUoZmxkRGF0YSlcbiAgICAgIGZpZWxkU3VtbWFyeVtmaWVsZE5hbWVdID0gY29uZGVuc2VGaWVsZFNpemVzKHBpdm90ZWREYXRhKVxuICAgIH0pXG4gIGxvZygnUG9zdC1jb25kZW5zZUZpZWxkU2l6ZXMoZmllbGRzW2ZpZWxkTmFtZV0pJylcbiAgbG9nKCdSZXBsYWNlZCBmaWVsZERhdGEgd2l0aCBmaWVsZFN1bW1hcnknKVxuICByZXR1cm4geyBmaWVsZHM6IGZpZWxkU3VtbWFyeSwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMsIHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cyB9XG59XG5cbi8vIC8qKlxuLy8gICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgeyB0eXBlTmFtZTogc3RyaW5nLCBjb3VudDogbnVtYmVyLCB2YWx1ZT86IGFueVtdLCBsZW5ndGg/OiBhbnlbXSwgc2NhbGU/OiBhbnlbXSwgcHJlY2lzaW9uPzogYW55W10sIGludmFsaWQ/OiBhbnkgfT5bXX0gdHlwZVNpemVEYXRhIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlXG4vLyAgKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZURhdGE+fVxuLy8gICovXG4vKipcbiAqIEBwYXJhbSB7SW50ZXJtZWRpYXRlVHlwZU1lYXN1cmVtZW50c1tdfSB0eXBlU2l6ZURhdGFcbiAqIEByZXR1cm5zIHtJbnRlcm1lZGlhdGVUeXBlQW5hbHlzaXN9XG4gKi9cbmZ1bmN0aW9uIHBpdm90RmllbGREYXRhQnlUeXBlICh0eXBlU2l6ZURhdGEpIHtcbiAgLy8gY29uc3QgYmxhbmtUeXBlU3VtcyA9ICgpID0+ICh7IGxlbmd0aDogMCwgc2NhbGU6IDAsIHByZWNpc2lvbjogMCB9KVxuICBsb2coYFByb2Nlc3NpbmcgJHt0eXBlU2l6ZURhdGEubGVuZ3RofSB0eXBlIGd1ZXNzZXNgKVxuICAvKipcbiAgICogQHBhcmFtIHt7IFt4OiBzdHJpbmddOiBhbnk7IH19IHBpdm90ZWREYXRhXG4gICAqIEBwYXJhbSB7eyBbczogc3RyaW5nXTogYW55OyB9IHwgQXJyYXlMaWtlPGFueT59IGN1cnJlbnRUeXBlR3Vlc3Nlc1xuICAgKi9cbiAgcmV0dXJuIHR5cGVTaXplRGF0YS5yZWR1Y2UoKHBpdm90ZWREYXRhLCBjdXJyZW50VHlwZUd1ZXNzZXMpID0+IHtcbiAgICBPYmplY3QuZW50cmllcyhjdXJyZW50VHlwZUd1ZXNzZXMpXG4gICAgICAubWFwKChbdHlwZU5hbWUsIHsgdmFsdWUsIGxlbmd0aCwgc2NhbGUsIHByZWNpc2lvbiB9XSkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2codHlwZU5hbWUsIEpTT04uc3RyaW5naWZ5KHsgbGVuZ3RoLCBzY2FsZSwgcHJlY2lzaW9uIH0pKVxuICAgICAgICBwaXZvdGVkRGF0YVt0eXBlTmFtZV0gPSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0gfHwgeyB0eXBlTmFtZSwgY291bnQ6IDAgfVxuICAgICAgICAvLyBpZiAoIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmNvdW50ID0gMFxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxlbmd0aCkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGgpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGggPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHNjYWxlKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uc2NhbGUgPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHByZWNpc2lvbikgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24pIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24gPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0udmFsdWUgPSBbXVxuXG4gICAgICAgIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCsrXG4gICAgICAgIC8vIGlmIChpbnZhbGlkICE9IG51bGwpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5pbnZhbGlkKytcbiAgICAgICAgaWYgKGxlbmd0aCkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmxlbmd0aC5wdXNoKGxlbmd0aClcbiAgICAgICAgaWYgKHNjYWxlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uc2NhbGUucHVzaChzY2FsZSlcbiAgICAgICAgaWYgKHByZWNpc2lvbikgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnByZWNpc2lvbi5wdXNoKHByZWNpc2lvbilcbiAgICAgICAgaWYgKHZhbHVlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0udmFsdWUucHVzaCh2YWx1ZSlcbiAgICAgICAgLy8gcGl2b3RlZERhdGFbdHlwZU5hbWVdLnJhbmsgPSB0eXBlUmFua2luZ3NbdHlwZU5hbWVdXG4gICAgICAgIHJldHVybiBwaXZvdGVkRGF0YVt0eXBlTmFtZV1cbiAgICAgIH0pXG4gICAgcmV0dXJuIHBpdm90ZWREYXRhXG4gIH0sIHt9KVxuICAvKlxuICA+IEV4YW1wbGUgb2Ygc3VtQ291bnRzIGF0IHRoaXMgcG9pbnRcbiAge1xuICAgIEZsb2F0OiB7IGNvdW50OiA0LCBzY2FsZTogWyA1LCA1LCA1LCA1IF0sIHByZWNpc2lvbjogWyAyLCAyLCAyLCAyIF0gfSxcbiAgICBTdHJpbmc6IHsgY291bnQ6IDMsIGxlbmd0aDogWyAyLCAzLCA2IF0gfSxcbiAgICBOdW1iZXI6IHsgY291bnQ6IDEsIGxlbmd0aDogWyA2IF0gfVxuICB9XG4qL1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIHdoaWNoIGFuYWx5emVzIGFuZCBzdW1tYXJpemVzIGVhY2ggY29sdW1ucyBkYXRhIGJ5IHR5cGUuIFNvcnQgb2YgYSBoaXN0b2dyYW0gb2Ygc2lnbmlmaWNhbnQgcG9pbnRzLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZURhdGE+fSBwaXZvdGVkRGF0YUJ5VHlwZSAtIGEgbWFwIG9yZ2FuaXplZCBieSBUeXBlIGtleXMgKGBUeXBlTmFtZWApLCBjb250YWluaW5nIGV4dHJhY3RlZCBkYXRhIGZvciB0aGUgcmV0dXJuZWQgYEZpZWxkU3VtbWFyeWAuXG4gKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN0YXRzPn0gLSBUaGUgZmluYWwgb3V0cHV0LCB3aXRoIGhpc3RvZ3JhbXMgb2Ygc2lnbmlmaWNhbnQgcG9pbnRzXG4gKi9cbmZ1bmN0aW9uIGNvbmRlbnNlRmllbGRTaXplcyAocGl2b3RlZERhdGFCeVR5cGUpIHtcbiAgLyoqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3RhdHM+fSAqL1xuICBjb25zdCBhZ2dyZWdhdGVTdW1tYXJ5ID0ge31cbiAgbG9nKCdTdGFydGluZyBjb25kZW5zZUZpZWxkU2l6ZXMoKScpXG4gIE9iamVjdC5rZXlzKHBpdm90ZWREYXRhQnlUeXBlKVxuICAgIC5tYXAoKHR5cGVOYW1lKSA9PiB7XG4gICAgICBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXSA9IHtcbiAgICAgICAgLy8gdHlwZU5hbWUsXG4gICAgICAgIHJhbms6IHR5cGVSYW5raW5nc1t0eXBlTmFtZV0sXG4gICAgICAgIGNvdW50OiBwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0uY291bnRcbiAgICAgIH1cbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpXG4gICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmxlbmd0aCkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0ubGVuZ3RoID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ubGVuZ3RoLCB0cnVlKVxuICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uc2NhbGUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSwgdHJ1ZSlcbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ucHJlY2lzaW9uKSBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5wcmVjaXNpb24gPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5wcmVjaXNpb24sIHRydWUpXG5cbiAgICAgIC8vIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0uaW52YWxpZCkgeyBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5pbnZhbGlkID0gcGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmludmFsaWQgfVxuXG4gICAgICBpZiAoWydUaW1lc3RhbXAnLCAnRGF0ZSddLmluZGV4T2YodHlwZU5hbWUpID4gLTEpIHtcbiAgICAgICAgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0udmFsdWUgPSBmb3JtYXRSYW5nZVN0YXRzKGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlLCBwYXJzZURhdGUpXG4gICAgICB9XG4gICAgfSlcbiAgbG9nKCdEb25lIGNvbmRlbnNlRmllbGRTaXplcygpLi4uJylcbiAgcmV0dXJuIGFnZ3JlZ2F0ZVN1bW1hcnlcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGRNZXRhZGF0YSAoe1xuICB2YWx1ZSxcbiAgc3RyaWN0TWF0Y2hpbmdcbn0pIHtcbiAgLy8gR2V0IGluaXRpYWwgcGFzcyBhdCB0aGUgZGF0YSB3aXRoIHRoZSBUWVBFXyogYC5jaGVjaygpYCBtZXRob2RzLlxuICBjb25zdCB0eXBlR3Vlc3NlcyA9IGRldGVjdFR5cGVzKHZhbHVlLCBzdHJpY3RNYXRjaGluZylcblxuICAvLyBBc3NpZ24gaW5pdGlhbCBtZXRhZGF0YSBmb3IgZWFjaCBtYXRjaGVkIHR5cGUgYmVsb3dcbiAgLyoqXG4gICAqIEBwYXJhbSB7eyBbeDogc3RyaW5nXTogYW55OyB9fSBhbmFseXNpc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZUd1ZXNzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByYW5rXG4gICAqL1xuICByZXR1cm4gdHlwZUd1ZXNzZXMucmVkdWNlKChhbmFseXNpcywgdHlwZUd1ZXNzLCByYW5rKSA9PiB7XG4gICAgbGV0IGxlbmd0aFxuICAgIGxldCBwcmVjaXNpb25cbiAgICBsZXQgc2NhbGVcblxuICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IHJhbms6IHJhbmsgKyAxIH1cblxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdGbG9hdCcpIHtcbiAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSlcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHZhbHVlIH1cbiAgICAgIGNvbnN0IHNpZ25pZmljYW5kQW5kTWFudGlzc2EgPSBTdHJpbmcodmFsdWUpLnNwbGl0KCcuJylcbiAgICAgIGlmIChzaWduaWZpY2FuZEFuZE1hbnRpc3NhLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBwcmVjaXNpb24gPSBzaWduaWZpY2FuZEFuZE1hbnRpc3NhLmpvaW4oJycpLmxlbmd0aCAvLyB0b3RhbCAjIG9mIG51bWVyaWMgcG9zaXRpb25zIGJlZm9yZSAmIGFmdGVyIGRlY2ltYWxcbiAgICAgICAgc2NhbGUgPSBzaWduaWZpY2FuZEFuZE1hbnRpc3NhWzFdLmxlbmd0aFxuICAgICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBwcmVjaXNpb24sIHNjYWxlIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ051bWJlcicpIHtcbiAgICAgIHZhbHVlID0gTnVtYmVyKHZhbHVlKVxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgdmFsdWUgfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnRGF0ZScgfHwgdHlwZUd1ZXNzID09PSAnVGltZXN0YW1wJykge1xuICAgICAgY29uc3QgY2hlY2tlZERhdGUgPSBpc1ZhbGlkRGF0ZSh2YWx1ZSlcbiAgICAgIGlmIChjaGVja2VkRGF0ZSkge1xuICAgICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZTogY2hlY2tlZERhdGUuZ2V0VGltZSgpIH1cbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIGludmFsaWQ6IHRydWUsIHZhbHVlOiB2YWx1ZSB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdTdHJpbmcnIHx8IHR5cGVHdWVzcyA9PT0gJ0VtYWlsJykge1xuICAgICAgbGVuZ3RoID0gU3RyaW5nKHZhbHVlKS5sZW5ndGhcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIGxlbmd0aCB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdBcnJheScpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aFxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgbGVuZ3RoIH1cbiAgICB9XG4gICAgcmV0dXJuIGFuYWx5c2lzXG4gIH0sIHt9KVxufVxuXG4vKipcbiAqIEFjY2VwdHMgYW4gYXJyYXkgb2YgbnVtYmVycyBhbmQgcmV0dXJucyBzdW1tYXJ5IGRhdGEgYWJvdXRcbiAqICB0aGUgcmFuZ2UgJiBzcHJlYWQgb2YgcG9pbnRzIGluIHRoZSBzZXQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJbXX0gbnVtYmVycyAtIHNlcXVlbmNlIG9mIHVuc29ydGVkIGRhdGEgcG9pbnRzXG4gKiBAcmV0dXJucyB7QWdncmVnYXRlU3VtbWFyeX1cbiAqL1xuZnVuY3Rpb24gZ2V0TnVtYmVyUmFuZ2VTdGF0cyAobnVtYmVycywgdXNlU29ydGVkRGF0YUZvclBlcmNlbnRpbGVzID0gZmFsc2UpIHtcbiAgaWYgKCFudW1iZXJzIHx8IG51bWJlcnMubGVuZ3RoIDwgMSkgcmV0dXJuIHVuZGVmaW5lZFxuICBjb25zdCBzb3J0ZWROdW1iZXJzID0gbnVtYmVycy5zbGljZSgpLnNvcnQoKGEsIGIpID0+IGEgPCBiID8gLTEgOiBhID09PSBiID8gMCA6IDEpXG4gIGNvbnN0IHN1bSA9IG51bWJlcnMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMClcbiAgaWYgKHVzZVNvcnRlZERhdGFGb3JQZXJjZW50aWxlcykgbnVtYmVycyA9IHNvcnRlZE51bWJlcnNcbiAgcmV0dXJuIHtcbiAgICAvLyBzaXplOiBudW1iZXJzLmxlbmd0aCxcbiAgICBtaW46IHNvcnRlZE51bWJlcnNbMF0sXG4gICAgbWVhbjogc3VtIC8gbnVtYmVycy5sZW5ndGgsXG4gICAgbWF4OiBzb3J0ZWROdW1iZXJzW251bWJlcnMubGVuZ3RoIC0gMV0sXG4gICAgcDI1OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuMjUpLCAxMCldLFxuICAgIHAzMzogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjMzKSwgMTApXSxcbiAgICBwNTA6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC41MCksIDEwKV0sXG4gICAgcDY2OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuNjYpLCAxMCldLFxuICAgIHA3NTogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjc1KSwgMTApXSxcbiAgICBwOTk6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC45OSksIDEwKV1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7eyBtaW46IGFueTsgbWF4OiBhbnk7IG1lYW46IGFueTsgcDI1OiBhbnk7IHAzMzogYW55OyBwNTA6IGFueTsgcDY2OiBhbnk7IHA3NTogYW55OyBwOTk6IGFueTsgfX0gc3RhdHNcbiAqIEBwYXJhbSB7eyAoZGF0ZTogYW55KTogYW55OyAoYXJnMDogYW55KTogYW55OyB9fSBmb3JtYXR0ZXJcbiAqL1xuZnVuY3Rpb24gZm9ybWF0UmFuZ2VTdGF0cyAoc3RhdHMsIGZvcm1hdHRlcikge1xuICAvLyBpZiAoIXN0YXRzIHx8ICFmb3JtYXR0ZXIpIHJldHVybiB1bmRlZmluZWRcbiAgcmV0dXJuIHtcbiAgICAvLyBzaXplOiBzdGF0cy5zaXplLFxuICAgIG1pbjogZm9ybWF0dGVyKHN0YXRzLm1pbiksXG4gICAgbWVhbjogZm9ybWF0dGVyKHN0YXRzLm1lYW4pLFxuICAgIG1heDogZm9ybWF0dGVyKHN0YXRzLm1heCksXG4gICAgcDI1OiBmb3JtYXR0ZXIoc3RhdHMucDI1KSxcbiAgICBwMzM6IGZvcm1hdHRlcihzdGF0cy5wMzMpLFxuICAgIHA1MDogZm9ybWF0dGVyKHN0YXRzLnA1MCksXG4gICAgcDY2OiBmb3JtYXR0ZXIoc3RhdHMucDY2KSxcbiAgICBwNzU6IGZvcm1hdHRlcihzdGF0cy5wNzUpLFxuICAgIHA5OTogZm9ybWF0dGVyKHN0YXRzLnA5OSlcbiAgfVxufVxuIl0sIm5hbWVzIjpbInJlcXVpcmUkJDAiLCJnbG9iYWwiLCJpc0RhdGUiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7OztDQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBYyxHQUFHLFNBQVMsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUN4QyxFQUFFLE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQzFCLEVBQUUsSUFBSSxJQUFJLEdBQUcsT0FBTyxHQUFHLENBQUM7QUFDeEIsRUFBRSxJQUFJLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDM0MsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixHQUFHLE1BQU0sSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNqRCxJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcs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QUFFLENBQUMsQ0FBQztBQUMzQixFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLEdBQUc7QUFDSCxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQztBQUNuQixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ3JCLEVBQUUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLEdBQUc7QUFDSCxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtBQUNsQixJQUFJLE9BQU8sTUFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hDLEdBQUc7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QUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLFNBQVM7QUFDVixDQUFDLENBQUM7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsU0FBUyxHQUFHO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBLENBQUMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxVQUFVLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2SCxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsRUFBRTtBQUNGO0FBQ0E7QUFDQSxDQUFDLElBQUksT0FBTyxTQUFT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LFVBQVUsQ0FBQztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBRTtBQUM3QixFQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLENBQUM7QUFDN0MsQ0FBQztBQUNEO0FBQ0EsY0FBYyxHQUFHLE1BQU07R0N4R3ZCLE1BQU0sVUFBVSxHQUFHO0FBQ25CLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQzVELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7QUFDeEMsRUFBRSxJQUFJLEVBQUUsSUFB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QUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELElBQUksR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDN0QsR0FBRztBQUNILENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQzdDO0FBQ0EsRUFBRSxPQUFPO0FBQ1Q7QUFDQSxJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztBQUMvQixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixJQUFJLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUM3QixHQUFHO0FBQ0gsQ0FBQyJ9
