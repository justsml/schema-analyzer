var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

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
 * Includes the results of input analysis.
 * @typedef TypeSummary
 * @type {{ fields: Object.<string, FieldTypeSummary>; totalRows: number; }}
 */

/**
 * This is an internal intermediate structure.
 * It mirrors the `FieldSummary` type it will become.
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
 * @typedef FieldTypeSummary
 * @type {Object}
 * @property {AggregateSummary} [value] - summary of array of values, pre processing into an AggregateSummary
 * @property {AggregateSummary} [length] - summary of array of string (or decimal) sizes, pre processing into an AggregateSummary
 * @property {AggregateSummary} [precision] - only applies to Float types. Summary of array of sizes of the value both before and after the decimal.
 * @property {AggregateSummary} [scale] - only applies to Float types. Summary of array of sizes of the value after the decimal.
 * @property {string[]|number[]} [enum] - if enum rules were triggered will contain the detected unique values.
 * @property {number} count - number of times the type was matched
 * @property {number} rank - absolute priority of the detected TypeName, defined in the object `typeRankings`
 *
 */

/**
 * @typedef FieldInfo
 * @type {object}
 * @property {Object.<string, FieldTypeSummary>} types - field stats organized by type
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
    .then((schema) => {
      log('Built summary from Field Type data.');
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
          const types = schema.fields[fieldName];
          /** @type {FieldInfo} */
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
   * @returns {{ totalRows: number; uniques: { [x: string]: any[]; }; fieldsData: { [x: string]: FieldTypeData[]; }; }} schema
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
 * @param {{ fieldsData: Object.<string, FieldTypeData[]>, uniques: Object.<string, any[]>, totalRows: number}} schema
 * @returns {{fields: Object.<string, FieldTypeSummary>, uniques: Object.<string, any[]>, totalRows: number}}
 */
function condenseFieldData (schema) {
  const { fieldsData } = schema;
  const fieldNames = Object.keys(fieldsData);

  /** @type {Object.<string, FieldTypeSummary>} */
  const fieldSummary = {};
  log(`Pre-condenseFieldSizes(fields[fieldName]) for ${fieldNames.length} columns`);
  fieldNames
    .forEach((fieldName) => {
      /** @type {Object.<string, FieldTypeData>} */
      const pivotedData = pivotFieldDataByType(fieldsData[fieldName]);
      fieldSummary[fieldName] = condenseFieldSizes(pivotedData);
    });
  log('Post-condenseFieldSizes(fields[fieldName])');
  log('Replaced fieldData with fieldSummary');
  return { fields: fieldSummary, uniques: schema.uniques, totalRows: schema.totalRows }
}

/**
 * @param {Object.<string, { value?, length?, scale?, precision?, invalid? }>[]} typeSizeData - An object containing the
 * @returns {Object.<string, FieldTypeData>}
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
 * @param {Object.<string, FieldTypeData>} pivotedDataByType - a map organized by Type keys (`TypeName`), containing extracted data for the returned `FieldSummary`.
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
}export{getNumberRangeStats,isValidDate,pivotFieldDataByType,schemaBuilder};//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLmVzbS5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdHlwZS1oZWxwZXJzLmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBBY3RpdmUgYGRlYnVnYCBpbnN0YW5jZXMuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmluc3RhbmNlcyA9IFtdO1xuXG5cdC8qKlxuXHQqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuXHQqL1xuXG5cdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0LyoqXG5cdCogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuXHQqXG5cdCogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuXHQqL1xuXHRjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzID0ge307XG5cblx0LyoqXG5cdCogU2VsZWN0cyBhIGNvbG9yIGZvciBhIGRlYnVnIG5hbWVzcGFjZVxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBzdHJpbmcgZm9yIHRoZSBmb3IgdGhlIGRlYnVnIGluc3RhbmNlIHRvIGJlIGNvbG9yZWRcblx0KiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBBbiBBTlNJIGNvbG9yIGNvZGUgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG5cdFx0bGV0IGhhc2ggPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0aGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcblx0XHR9XG5cblx0XHRyZXR1cm4gY3JlYXRlRGVidWcuY29sb3JzW01hdGguYWJzKGhhc2gpICUgY3JlYXRlRGVidWcuY29sb3JzLmxlbmd0aF07XG5cdH1cblx0Y3JlYXRlRGVidWcuc2VsZWN0Q29sb3IgPSBzZWxlY3RDb2xvcjtcblxuXHQvKipcblx0KiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAcmV0dXJuIHtGdW5jdGlvbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblx0XHRsZXQgcHJldlRpbWU7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHRcdGNvbnN0IGZvcm1hdHRlciA9IGNyZWF0ZURlYnVnLmZvcm1hdHRlcnNbZm9ybWF0XTtcblx0XHRcdFx0aWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCB2YWwgPSBhcmdzW2luZGV4XTtcblx0XHRcdFx0XHRtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cblx0XHRcdFx0XHQvLyBOb3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG5cdFx0XHRcdFx0YXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG5cdFx0XHRjcmVhdGVEZWJ1Zy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cblx0XHRcdGNvbnN0IGxvZ0ZuID0gc2VsZi5sb2cgfHwgY3JlYXRlRGVidWcubG9nO1xuXHRcdFx0bG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0ZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXHRcdGRlYnVnLmVuYWJsZWQgPSBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHQvLyBEZWJ1Zy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcblx0XHQvLyBkZWJ1Zy5yYXdMb2cgPSByYXdMb2c7XG5cblx0XHQvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0XHRjb25zdCBpbmRleCA9IGNyZWF0ZURlYnVnLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuXHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdGNyZWF0ZURlYnVnLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChuYW1lc3BhY2UsIGRlbGltaXRlcikge1xuXHRcdGNvbnN0IG5ld0RlYnVnID0gY3JlYXRlRGVidWcodGhpcy5uYW1lc3BhY2UgKyAodHlwZW9mIGRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnOicgOiBkZWxpbWl0ZXIpICsgbmFtZXNwYWNlKTtcblx0XHRuZXdEZWJ1Zy5sb2cgPSB0aGlzLmxvZztcblx0XHRyZXR1cm4gbmV3RGVidWc7XG5cdH1cblxuXHQvKipcblx0KiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG5cdCogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcblx0XHRjcmVhdGVEZWJ1Zy5zYXZlKG5hbWVzcGFjZXMpO1xuXG5cdFx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0XHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdFx0bGV0IGk7XG5cdFx0Y29uc3Qgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuXHRcdGNvbnN0IGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKCFzcGxpdFtpXSkge1xuXHRcdFx0XHQvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0bmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG5cblx0XHRcdGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBjcmVhdGVEZWJ1Zy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGluc3RhbmNlID0gY3JlYXRlRGVidWcuaW5zdGFuY2VzW2ldO1xuXHRcdFx0aW5zdGFuY2UuZW5hYmxlZCA9IGNyZWF0ZURlYnVnLmVuYWJsZWQoaW5zdGFuY2UubmFtZXNwYWNlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdGNyZWF0ZURlYnVnLmVuYWJsZShjcmVhdGVEZWJ1Zy5sb2FkKCkpO1xuXG5cdHJldHVybiBjcmVhdGVEZWJ1Zztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cDtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG5cdC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG5cdC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG5cdHJldHVybiB0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcgJiZcblx0XHRjb25zb2xlLmxvZyAmJlxuXHRcdGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHByb2Nlc3NgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlUHJvY2VzcyA9IG1vZHVsZUV4cG9ydHMgJiYgZnJlZUdsb2JhbC5wcm9jZXNzO1xuXG4vKiogVXNlZCB0byBhY2Nlc3MgZmFzdGVyIE5vZGUuanMgaGVscGVycy4gKi9cbnZhciBub2RlVXRpbCA9IChmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZnJlZVByb2Nlc3MgJiYgZnJlZVByb2Nlc3MuYmluZGluZygndXRpbCcpO1xuICB9IGNhdGNoIChlKSB7fVxufSgpKTtcblxuLyogTm9kZS5qcyBoZWxwZXIgcmVmZXJlbmNlcy4gKi9cbnZhciBub2RlSXNEYXRlID0gbm9kZVV0aWwgJiYgbm9kZVV0aWwuaXNEYXRlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2FwcGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRGF0ZWAgd2l0aG91dCBOb2RlLmpzIG9wdGltaXphdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNEYXRlKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGRhdGVUYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBEYXRlYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRGF0ZShuZXcgRGF0ZSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0RhdGUoJ01vbiBBcHJpbCAyMyAyMDEyJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNEYXRlID0gbm9kZUlzRGF0ZSA/IGJhc2VVbmFyeShub2RlSXNEYXRlKSA6IGJhc2VJc0RhdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRGF0ZTtcbiIsImltcG9ydCBpc0RhdGUgZnJvbSAnbG9kYXNoLmlzZGF0ZSdcbmV4cG9ydCB7XG4gIGlzQm9vbGlzaCxcbiAgaXNDdXJyZW5jeSxcbiAgaXNEYXRlU3RyaW5nLFxuICBpc0VtYWlsU2hhcGVkLFxuICBpc0Zsb2F0aXNoLFxuICBpc051bGxpc2gsXG4gIGlzTnVtZXJpYyxcbiAgaXNPYmplY3RJZCxcbiAgaXNUaW1lc3RhbXAsXG4gIGlzVXVpZFxufVxuXG5jb25zdCBjdXJyZW5jaWVzID0gW1xuICAnJCcsICfCoicsICfCoycsICfCpCcsICfCpScsICfWjycsICfYiycsICffvicsICffvycsICfgp7InLCAn4KezJywgJ+CnuycsXG4gICfgq7EnLCAn4K+5JywgJ+C4vycsICfhn5snLCAn4oKgJywgJ+KCoScsICfigqInLCAn4oKjJywgJ+KCpCcsICfigqUnLCAn4oKmJywgJ+KCpycsXG4gICfigqgnLCAn4oKpJywgJ+KCqicsICfigqsnLCAn4oKsJywgJ+KCrScsICfigq4nLCAn4oKvJywgJ+KCsCcsICfigrEnLCAn4oKyJywgJ+KCsycsXG4gICfigrQnLCAn4oK1JywgJ+KCticsICfigrcnLCAn4oK4JywgJ+KCuScsICfigronLCAn4oK7JywgJ+KCvCcsICfigr0nLCAn4oK+JywgJ+KCvycsXG4gICfqoLgnLCAn77e8JywgJ++5qScsICfvvIQnLCAn77+gJywgJ++/oScsICfvv6UnLCAn77+mJyxcbiAgJ/CRv50nLCAn8JG/nicsICfwkb+fJywgJ/CRv6AnLCAn8J6LvycsICfwnrKwJ1xuXVxuXG5jb25zdCBib29saXNoUGF0dGVybiA9IC9eKFtZTl18KFRSVUUpfChGQUxTRSkpJC9pXG5jb25zdCB1dWlkUGF0dGVybiA9IC9eWzAtOWEtZkEtRl17OH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17MTJ9JC9cbmNvbnN0IG9iamVjdElkUGF0dGVybiA9IC9eW2EtZlxcZF17MjR9JC9pXG5jb25zdCBkYXRlU3RyaW5nUGF0dGVybiA9IC9eKFsrLV0/XFxkezR9KD8hXFxkezJ9XFxiKSkoKC0/KSgoMFsxLTldfDFbMC0yXSkoXFwzKFsxMl1cXGR8MFsxLTldfDNbMDFdKSk/fFcoWzAtNF1cXGR8NVswLTJdKSgtP1sxLTddKT98KDAwWzEtOV18MFsxLTldXFxkfFsxMl1cXGR7Mn18MyhbMC01XVxcZHw2WzEtNl0pKSkoW1RcXHNdKCgoWzAxXVxcZHwyWzAtM10pKCg6PylbMC01XVxcZCk/fDI0Oj8wMCkoWy4sXVxcZCsoPyE6KSk/KT8oXFwxN1swLTVdXFxkKFsuLF1cXGQrKT8pPyhbelpdfChbKy1dKShbMDFdXFxkfDJbMC0zXSk6PyhbMC01XVxcZCk/KT8pPyk/JC9cbmNvbnN0IHRpbWVzdGFtcFBhdHRlcm4gPSAvXlsxMl1cXGR7MTJ9JC9cbi8vIGNvbnN0IGN1cnJlbmN5UGF0dGVyblVTID0gL15cXHB7U2N9XFxzP1tcXGQsLl0rJC91aWdcbi8vIGNvbnN0IGN1cnJlbmN5UGF0dGVybkVVID0gL15bXFxkLC5dK1xccz9cXHB7U2N9JC91aWdcbmNvbnN0IG51bWJlcmlzaFBhdHRlcm4gPSAvXi0/W1xcZC4sXSskL1xuY29uc3QgZmxvYXRQYXR0ZXJuID0gL1xcZFxcLlxcZC9cbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eW15AXStAW15AXXsyLH1cXC5bXkBdezIsfVteLl0kL1xuY29uc3QgZW1haWxQYXR0ZXJuID0gL15cXHcrKFsuLV0/XFx3KykqQFxcdysoWy4tXT9cXHcrKSooXFwuXFx3ezIsM30pKyQvXG5jb25zdCBudWxsaXNoUGF0dGVybiA9IC9udWxsL2lcbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC9pZ21cblxuZnVuY3Rpb24gaXNCb29saXNoICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDw9IDYgJiYgYm9vbGlzaFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc1V1aWQgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCA0MCAmJiB1dWlkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuZnVuY3Rpb24gaXNPYmplY3RJZCAodmFsdWUsIGZpZWxkTmFtZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDQwICYmIG9iamVjdElkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0RhdGVTdHJpbmcgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gbm90IGJ1bGxldC1wcm9vZiwgbWVhbnQgdG8gc25pZmYgaW50ZW50aW9uIGluIHRoZSBkYXRhXG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHJldHVybiB0cnVlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIGRhdGVTdHJpbmdQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzVGltZXN0YW1wICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHRpbWVzdGFtcFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNDdXJyZW5jeSAodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGNvbnN0IHZhbHVlU3ltYm9sID0gY3VycmVuY2llcy5maW5kKChjdXJTeW1ib2wpID0+IHZhbHVlLmluZGV4T2YoY3VyU3ltYm9sKSA+IC0xKVxuICBpZiAoIXZhbHVlU3ltYm9sKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKHZhbHVlU3ltYm9sLCAnJylcbiAgcmV0dXJuIGlzTnVtZXJpYyh2YWx1ZSlcbiAgLy8gY29uc29sZS5sb2codmFsdWUsICdjdXJyZW5jeVBhdHRlcm5VUycsIGN1cnJlbmN5UGF0dGVyblVTLnRlc3QodmFsdWUpLCAnY3VycmVuY3lQYXR0ZXJuRVUnLCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKSk7XG4gIC8vIHJldHVybiBjdXJyZW5jeVBhdHRlcm5VUy50ZXN0KHZhbHVlKSB8fCBjdXJyZW5jeVBhdHRlcm5FVS50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc051bWVyaWMgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCAzMCAmJiBudW1iZXJpc2hQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzRmxvYXRpc2ggKHZhbHVlKSB7XG4gIHJldHVybiAhIShpc051bWVyaWMoU3RyaW5nKHZhbHVlKSkgJiYgZmxvYXRQYXR0ZXJuLnRlc3QoU3RyaW5nKHZhbHVlKSkgJiYgIU51bWJlci5pc0ludGVnZXIodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc0VtYWlsU2hhcGVkICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgaWYgKHZhbHVlLmluY2x1ZGVzKCcgJykgfHwgIXZhbHVlLmluY2x1ZGVzKCdAJykpIHJldHVybiBmYWxzZVxuICByZXR1cm4gdmFsdWUubGVuZ3RoID49IDUgJiYgdmFsdWUubGVuZ3RoIDwgODAgJiYgZW1haWxQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzTnVsbGlzaCAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IG51bGxpc2hQYXR0ZXJuLnRlc3QoU3RyaW5nKHZhbHVlKS50cmltKCkpXG59XG4iLCJpbXBvcnQge1xuICBpc0Jvb2xpc2gsXG4gIGlzQ3VycmVuY3ksXG4gIGlzRGF0ZVN0cmluZyxcbiAgaXNFbWFpbFNoYXBlZCxcbiAgaXNGbG9hdGlzaCxcbiAgaXNOdWxsaXNoLFxuICBpc051bWVyaWMsXG4gIGlzT2JqZWN0SWQsXG4gIGlzVGltZXN0YW1wLFxuICBpc1V1aWRcbn0gZnJvbSAnLi91dGlscy90eXBlLWRldGVjdG9ycy5qcydcblxuY29uc3QgaGFzTGVhZGluZ1plcm8gPSAvXjArL1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgVHlwZU5hbWUuXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgLSBpbnB1dCBkYXRhXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmZ1bmN0aW9uIGRldGVjdFR5cGVzICh2YWx1ZSwgc3RyaWN0TWF0Y2hpbmcgPSB0cnVlKSB7XG4gIGNvbnN0IGV4Y2x1ZGVkVHlwZXMgPSBbXVxuICBjb25zdCBtYXRjaGVkVHlwZXMgPSBwcmlvcml0aXplZFR5cGVzLnJlZHVjZSgodHlwZXMsIHR5cGVIZWxwZXIpID0+IHtcbiAgICBpZiAodHlwZUhlbHBlci5jaGVjayh2YWx1ZSkpIHtcbiAgICAgIGlmICh0eXBlSGVscGVyLnN1cGVyY2VkZXMpIGV4Y2x1ZGVkVHlwZXMucHVzaCguLi50eXBlSGVscGVyLnN1cGVyY2VkZXMpXG4gICAgICB0eXBlcy5wdXNoKHR5cGVIZWxwZXIudHlwZSlcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVzXG4gIH0sIFtdKVxuICByZXR1cm4gIXN0cmljdE1hdGNoaW5nID8gbWF0Y2hlZFR5cGVzIDogbWF0Y2hlZFR5cGVzLmZpbHRlcigodHlwZSkgPT4gZXhjbHVkZWRUeXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSlcbn1cblxuLyoqXG4gKiBNZXRhQ2hlY2tzIGFyZSB1c2VkIHRvIGFuYWx5emUgdGhlIGludGVybWVkaWF0ZSByZXN1bHRzLCBhZnRlciB0aGUgQmFzaWMgKGRpc2NyZWV0KSB0eXBlIGNoZWNrcyBhcmUgY29tcGxldGUuXG4gKiBUaGV5IGhhdmUgYWNjZXNzIHRvIGFsbCB0aGUgZGF0YSBwb2ludHMgYmVmb3JlIGl0IGlzIGZpbmFsbHkgcHJvY2Vzc2VkLlxuICovXG5jb25zdCBNZXRhQ2hlY2tzID0ge1xuICBUWVBFX0VOVU06IHtcbiAgICB0eXBlOiAnZW51bScsXG4gICAgbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgZW51bUFic29sdXRlTGltaXQsIGVudW1QZXJjZW50VGhyZXNob2xkIH0pID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgdW5pcXVlbmVzcyB1c2luZyBBTEwgdW5pcXVlcyBjb21iaW5lZCBmcm9tIEFMTCB0eXBlcywgdGhpcyBvbmx5IHNlZXMgY29uc2lzdGVudGx5IHR5cGVkIGRhdGFcbiAgICAgIC8vIGNvbnN0IHVuaXF1ZW5lc3MgPSByb3dDb3VudCAvIHVuaXF1ZXMubGVuZ3RoXG4gICAgICBjb25zdCByZWxhdGl2ZUVudW1MaW1pdCA9IE1hdGgubWluKHBhcnNlSW50KFN0cmluZyhyb3dDb3VudCAqIGVudW1QZXJjZW50VGhyZXNob2xkKSwgMTApLCBlbnVtQWJzb2x1dGVMaW1pdClcbiAgICAgIGlmICh1bmlxdWVzLmxlbmd0aCA+IHJlbGF0aXZlRW51bUxpbWl0KSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIGNvbnN0IGVudW1MaW1pdCA9IHVuaXF1ZW5lc3MgPCBlbnVtQWJzb2x1dGVMaW1pdCAmJiByZWxhdGl2ZUVudW1MaW1pdCA8IGVudW1BYnNvbHV0ZUxpbWl0XG4gICAgICAvLyAgID8gZW51bUFic29sdXRlTGltaXRcbiAgICAgIC8vICAgOiByZWxhdGl2ZUVudW1MaW1pdFxuXG4gICAgICByZXR1cm4geyBlbnVtOiB1bmlxdWVzLCAuLi50eXBlSW5mbyB9XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfSxcbiAgVFlQRV9OVUxMQUJMRToge1xuICAgIHR5cGU6ICdudWxsYWJsZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgbnVsbGFibGVSb3dzVGhyZXNob2xkIH0pID0+IHtcbiAgICAgIGlmICghdW5pcXVlcyB8fCB1bmlxdWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICBjb25zdCB7IHR5cGVzIH0gPSB0eXBlSW5mb1xuICAgICAgbGV0IG51bGxpc2hUeXBlQ291bnQgPSAwXG4gICAgICBpZiAodHlwZXMuTnVsbCkge1xuICAgICAgICBudWxsaXNoVHlwZUNvdW50ICs9IHR5cGVzLk51bGwuY291bnRcbiAgICAgIH1cbiAgICAgIC8vIGlmICh0eXBlcy5Vbmtub3duKSB7XG4gICAgICAvLyAgIG51bGxpc2hUeXBlQ291bnQgKz0gdHlwZXMuVW5rbm93bi5jb3VudFxuICAgICAgLy8gfVxuICAgICAgY29uc3QgbnVsbExpbWl0ID0gcm93Q291bnQgKiBudWxsYWJsZVJvd3NUaHJlc2hvbGRcbiAgICAgIGNvbnN0IGlzTm90TnVsbGFibGUgPSBudWxsaXNoVHlwZUNvdW50IDw9IG51bGxMaW1pdFxuICAgICAgLy8gVE9ETzogTG9vayBpbnRvIHNwZWNpZmljYWxseSBjaGVja2luZyAnTnVsbCcgb3IgJ1Vua25vd24nIHR5cGUgc3RhdHNcbiAgICAgIHJldHVybiB7IG51bGxhYmxlOiAhaXNOb3ROdWxsYWJsZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH0sXG4gIFRZUEVfVU5JUVVFOiB7XG4gICAgdHlwZTogJ3VuaXF1ZScsXG4gICAgLy8gbWF0Y2hCYXNpY1R5cGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgICBjaGVjazogKHR5cGVJbmZvLCB7IHJvd0NvdW50LCB1bmlxdWVzIH0sIHsgdW5pcXVlUm93c1RocmVzaG9sZCB9KSA9PiB7XG4gICAgICBpZiAoIXVuaXF1ZXMgfHwgdW5pcXVlcy5sZW5ndGggPT09IDApIHJldHVybiB0eXBlSW5mb1xuICAgICAgLy8gY29uc3QgdW5pcXVlbmVzcyA9IHJvd0NvdW50IC8gdW5pcXVlcy5sZW5ndGhcbiAgICAgIGNvbnN0IGlzVW5pcXVlID0gdW5pcXVlcy5sZW5ndGggPT09IChyb3dDb3VudCAqIHVuaXF1ZVJvd3NUaHJlc2hvbGQpXG4gICAgICAvLyBUT0RPOiBMb29rIGludG8gc3BlY2lmaWNhbGx5IGNoZWNraW5nICdOdWxsJyBvciAnVW5rbm93bicgdHlwZSBzdGF0c1xuICAgICAgcmV0dXJuIHsgdW5pcXVlOiBpc1VuaXF1ZSwgLi4udHlwZUluZm8gfVxuICAgICAgLy8gcmV0dXJuIHt1bmlxdWU6IHVuaXF1ZW5lc3MgPj0gdW5pcXVlUm93c1RocmVzaG9sZCwgLi4udHlwZUluZm99XG4gICAgICAvLyBUT0RPOiBjYWxjdWxhdGUgZW50cm9weSB1c2luZyBhIHN1bSBvZiBhbGwgbm9uLW51bGwgZGV0ZWN0ZWQgdHlwZXMsIG5vdCBqdXN0IHR5cGVDb3VudFxuICAgIH1cbiAgfVxufVxuXG4vLyBCYXNpYyBUeXBlIEZpbHRlcnMgLSBydWRpbWVudGFyeSBkYXRhIHNuaWZmaW5nIHVzZWQgdG8gdGFsbHkgdXAgXCJ2b3Rlc1wiIGZvciBhIGdpdmVuIGZpZWxkXG4vKipcbiAqIERldGVjdCBhbWJpZ3VvdXMgZmllbGQgdHlwZS5cbiAqIFdpbGwgbm90IGFmZmVjdCB3ZWlnaHRlZCBmaWVsZCBhbmFseXNpcy5cbiAqL1xuY29uc3QgVFlQRV9VTktOT1dOID0ge1xuICB0eXBlOiAnVW5rbm93bicsXG4gIGNoZWNrOiAodmFsdWUpID0+IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICd1bmRlZmluZWQnXG59XG5jb25zdCBUWVBFX09CSkVDVF9JRCA9IHtcbiAgdHlwZTogJ09iamVjdElkJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzT2JqZWN0SWRcbn1cbmNvbnN0IFRZUEVfVVVJRCA9IHtcbiAgdHlwZTogJ1VVSUQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZyddLFxuICBjaGVjazogaXNVdWlkXG59XG5jb25zdCBUWVBFX0JPT0xFQU4gPSB7XG4gIHR5cGU6ICdCb29sZWFuJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzQm9vbGlzaFxufVxuY29uc3QgVFlQRV9EQVRFID0ge1xuICB0eXBlOiAnRGF0ZScsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ10sXG4gIGNoZWNrOiBpc0RhdGVTdHJpbmdcbn1cbmNvbnN0IFRZUEVfVElNRVNUQU1QID0ge1xuICB0eXBlOiAnVGltZXN0YW1wJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc1RpbWVzdGFtcFxufVxuY29uc3QgVFlQRV9DVVJSRU5DWSA9IHtcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc0N1cnJlbmN5XG59XG5jb25zdCBUWVBFX0ZMT0FUID0ge1xuICB0eXBlOiAnRmxvYXQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgY2hlY2s6IGlzRmxvYXRpc2hcbn1cbmNvbnN0IFRZUEVfTlVNQkVSID0ge1xuICB0eXBlOiAnTnVtYmVyJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIGlmIChoYXNMZWFkaW5nWmVyby50ZXN0KFN0cmluZyh2YWx1ZSkpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gISEodmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIChOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBpc051bWVyaWModmFsdWUpKSlcbiAgfVxufVxuY29uc3QgVFlQRV9FTUFJTCA9IHtcbiAgdHlwZTogJ0VtYWlsJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzRW1haWxTaGFwZWRcbn1cbmNvbnN0IFRZUEVfU1RSSU5HID0ge1xuICB0eXBlOiAnU3RyaW5nJyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAvLyAmJiB2YWx1ZS5sZW5ndGggPj0gMVxufVxuY29uc3QgVFlQRV9BUlJBWSA9IHtcbiAgdHlwZTogJ0FycmF5JyxcbiAgY2hlY2s6ICh2YWx1ZSkgPT4ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKVxuICB9XG59XG5jb25zdCBUWVBFX09CSkVDVCA9IHtcbiAgdHlwZTogJ09iamVjdCcsXG4gIGNoZWNrOiAodmFsdWUpID0+IHtcbiAgICByZXR1cm4gIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuICB9XG59XG5jb25zdCBUWVBFX05VTEwgPSB7XG4gIHR5cGU6ICdOdWxsJyxcbiAgY2hlY2s6IGlzTnVsbGlzaFxufVxuXG5jb25zdCBwcmlvcml0aXplZFR5cGVzID0gW1xuICBUWVBFX1VOS05PV04sXG4gIFRZUEVfT0JKRUNUX0lELFxuICBUWVBFX1VVSUQsXG4gIFRZUEVfQk9PTEVBTixcbiAgVFlQRV9EQVRFLFxuICBUWVBFX1RJTUVTVEFNUCxcbiAgVFlQRV9DVVJSRU5DWSxcbiAgVFlQRV9GTE9BVCxcbiAgVFlQRV9OVU1CRVIsXG4gIFRZUEVfTlVMTCxcbiAgVFlQRV9FTUFJTCxcbiAgVFlQRV9TVFJJTkcsXG4gIFRZUEVfQVJSQVksXG4gIFRZUEVfT0JKRUNUXG5dXG5cbi8qKlxuICogVHlwZSBSYW5rIE1hcDogVXNlIHRvIHNvcnQgTG93ZXN0IHRvIEhpZ2hlc3RcbiAqL1xuY29uc3QgdHlwZVJhbmtpbmdzID0ge1xuICBbVFlQRV9VTktOT1dOLnR5cGVdOiAtMSxcbiAgW1RZUEVfT0JKRUNUX0lELnR5cGVdOiAxLFxuICBbVFlQRV9VVUlELnR5cGVdOiAyLFxuICBbVFlQRV9CT09MRUFOLnR5cGVdOiAzLFxuICBbVFlQRV9EQVRFLnR5cGVdOiA0LFxuICBbVFlQRV9USU1FU1RBTVAudHlwZV06IDUsXG4gIFtUWVBFX0NVUlJFTkNZLnR5cGVdOiA2LFxuICBbVFlQRV9GTE9BVC50eXBlXTogNyxcbiAgW1RZUEVfTlVNQkVSLnR5cGVdOiA4LFxuICBbVFlQRV9OVUxMLnR5cGVdOiAxMCxcbiAgW1RZUEVfRU1BSUwudHlwZV06IDExLFxuICBbVFlQRV9TVFJJTkcudHlwZV06IDEyLFxuICBbVFlQRV9BUlJBWS50eXBlXTogMTMsXG4gIFtUWVBFX09CSkVDVC50eXBlXTogMTRcbn1cblxuZXhwb3J0IHtcbiAgdHlwZVJhbmtpbmdzLFxuICBwcmlvcml0aXplZFR5cGVzLFxuICBkZXRlY3RUeXBlcyxcbiAgTWV0YUNoZWNrcyxcbiAgVFlQRV9VTktOT1dOLFxuICBUWVBFX09CSkVDVF9JRCxcbiAgVFlQRV9VVUlELFxuICBUWVBFX0JPT0xFQU4sXG4gIFRZUEVfREFURSxcbiAgVFlQRV9USU1FU1RBTVAsXG4gIFRZUEVfQ1VSUkVOQ1ksXG4gIFRZUEVfRkxPQVQsXG4gIFRZUEVfTlVNQkVSLFxuICBUWVBFX05VTEwsXG4gIFRZUEVfRU1BSUwsXG4gIFRZUEVfU1RSSU5HLFxuICBUWVBFX0FSUkFZLFxuICBUWVBFX09CSkVDVFxufVxuLy8gY29uc3QgVFlQRV9FTlVNID0ge1xuLy8gICB0eXBlOiBcIlN0cmluZ1wiLFxuLy8gICBjaGVjazogKHZhbHVlLCBmaWVsZEluZm8sIHNjaGVtYUluZm8pID0+IHtcbi8vICAgICAvLyBUaHJlc2hvbGQgc2V0IHRvIDUlIC0gNSAob3IgZmV3ZXIpIG91dCBvZiAxMDAgdW5pcXVlIHN0cmluZ3Mgc2hvdWxkIGVuYWJsZSAnZW51bScgbW9kZVxuLy8gICAgIGlmIChzY2hlbWFJbmZvLmlucHV0Um93Q291bnQgPCAxMDApIHJldHVybiBmYWxzZTsgLy8gZGlzYWJsZWQgaWYgc2V0IHRvbyBzbWFsbFxuLy8gICB9XG4vLyB9O1xuIiwiaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuLy8gaW1wb3J0IEZQIGZyb20gJ2Z1bmN0aW9uYWwtcHJvbWlzZXMnO1xuLy8gaW1wb3J0IHsgZGV0ZWN0VHlwZXMgfSBmcm9tICcuL3R5cGUtaGVscGVycy5qcydcbi8vIGltcG9ydCBTdGF0c01hcCBmcm9tICdzdGF0cy1tYXAnO1xuLy8gaW1wb3J0IG1lbSBmcm9tICdtZW0nO1xuaW1wb3J0IHsgZGV0ZWN0VHlwZXMsIE1ldGFDaGVja3MsIHR5cGVSYW5raW5ncyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzLmpzJ1xuY29uc3QgbG9nID0gZGVidWcoJ3NjaGVtYS1idWlsZGVyOmluZGV4Jylcbi8vIGNvbnN0IGNhY2hlID0gbmV3IFN0YXRzTWFwKCk7XG4vLyBjb25zdCBkZXRlY3RUeXBlc0NhY2hlZCA9IG1lbShfZGV0ZWN0VHlwZXMsIHsgY2FjaGUsIG1heEFnZTogMTAwMCAqIDYwMCB9KSAvLyBrZWVwIGNhY2hlIHVwIHRvIDEwIG1pbnV0ZXNcblxuZXhwb3J0IHsgc2NoZW1hQnVpbGRlciwgcGl2b3RGaWVsZERhdGFCeVR5cGUsIGdldE51bWJlclJhbmdlU3RhdHMsIGlzVmFsaWREYXRlIH1cblxuZnVuY3Rpb24gaXNWYWxpZERhdGUgKGRhdGUpIHtcbiAgZGF0ZSA9IGRhdGUgaW5zdGFuY2VvZiBEYXRlID8gZGF0ZSA6IG5ldyBEYXRlKGRhdGUpXG4gIHJldHVybiBpc05hTihkYXRlLmdldEZ1bGxZZWFyKCkpID8gZmFsc2UgOiBkYXRlXG59XG5cbmNvbnN0IHBhcnNlRGF0ZSA9IChkYXRlKSA9PiB7XG4gIGRhdGUgPSBpc1ZhbGlkRGF0ZShkYXRlKVxuICByZXR1cm4gZGF0ZSAmJiBkYXRlLnRvSVNPU3RyaW5nICYmIGRhdGUudG9JU09TdHJpbmcoKVxufVxuLyoqXG4gKiBJbmNsdWRlcyB0aGUgcmVzdWx0cyBvZiBpbnB1dCBhbmFseXNpcy5cbiAqIEB0eXBlZGVmIFR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7eyBmaWVsZHM6IE9iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5PjsgdG90YWxSb3dzOiBudW1iZXI7IH19XG4gKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGludGVybmFsIGludGVybWVkaWF0ZSBzdHJ1Y3R1cmUuXG4gKiBJdCBtaXJyb3JzIHRoZSBgRmllbGRTdW1tYXJ5YCB0eXBlIGl0IHdpbGwgYmVjb21lLlxuICogQHByaXZhdGVcbiAqIEB0eXBlZGVmIEZpZWxkVHlwZURhdGFcbiAqIEB0eXBlIHtPYmplY3R9XG4gKiBAcHJvcGVydHkge251bWJlcltdfSBbdmFsdWVdIC0gYXJyYXkgb2YgdmFsdWVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtsZW5ndGhdIC0gYXJyYXkgb2Ygc3RyaW5nIChvciBkZWNpbWFsKSBzaXplcywgcHJlIHByb2Nlc3NpbmcgaW50byBhbiBBZ2dyZWdhdGVTdW1tYXJ5XG4gKiBAcHJvcGVydHkge251bWJlcltdfSBbcHJlY2lzaW9uXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gQXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGJvdGggYmVmb3JlIGFuZCBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtzY2FsZV0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIEFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbY291bnRdIC0gbnVtYmVyIG9mIHRpbWVzIHRoZSB0eXBlIHdhcyBtYXRjaGVkXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3JhbmtdIC0gYWJzb2x1dGUgcHJpb3JpdHkgb2YgdGhlIGRldGVjdGVkIFR5cGVOYW1lLCBkZWZpbmVkIGluIHRoZSBvYmplY3QgYHR5cGVSYW5raW5nc2BcbiAqXG4gKi9cblxuLyoqXG4gKlxuICogQHR5cGVkZWYgRmllbGRUeXBlU3VtbWFyeVxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW3ZhbHVlXSAtIHN1bW1hcnkgb2YgYXJyYXkgb2YgdmFsdWVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7QWdncmVnYXRlU3VtbWFyeX0gW2xlbmd0aF0gLSBzdW1tYXJ5IG9mIGFycmF5IG9mIHN0cmluZyAob3IgZGVjaW1hbCkgc2l6ZXMsIHByZSBwcm9jZXNzaW5nIGludG8gYW4gQWdncmVnYXRlU3VtbWFyeVxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbcHJlY2lzaW9uXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gU3VtbWFyeSBvZiBhcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYm90aCBiZWZvcmUgYW5kIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbc2NhbGVdIC0gb25seSBhcHBsaWVzIHRvIEZsb2F0IHR5cGVzLiBTdW1tYXJ5IG9mIGFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBhZnRlciB0aGUgZGVjaW1hbC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW118bnVtYmVyW119IFtlbnVtXSAtIGlmIGVudW0gcnVsZXMgd2VyZSB0cmlnZ2VyZWQgd2lsbCBjb250YWluIHRoZSBkZXRlY3RlZCB1bmlxdWUgdmFsdWVzLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IGNvdW50IC0gbnVtYmVyIG9mIHRpbWVzIHRoZSB0eXBlIHdhcyBtYXRjaGVkXG4gKiBAcHJvcGVydHkge251bWJlcn0gcmFuayAtIGFic29sdXRlIHByaW9yaXR5IG9mIHRoZSBkZXRlY3RlZCBUeXBlTmFtZSwgZGVmaW5lZCBpbiB0aGUgb2JqZWN0IGB0eXBlUmFua2luZ3NgXG4gKlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYgRmllbGRJbmZvXG4gKiBAdHlwZSB7b2JqZWN0fVxuICogQHByb3BlcnR5IHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT59IHR5cGVzIC0gZmllbGQgc3RhdHMgb3JnYW5pemVkIGJ5IHR5cGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gbnVsbGFibGUgLSBpcyB0aGUgZmllbGQgbnVsbGFibGVcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gdW5pcXVlIC0gaXMgdGhlIGZpZWxkIHVuaXF1ZVxuICogQHByb3BlcnR5IHtzdHJpbmdbXXxudW1iZXJbXX0gW2VudW1dIC0gZW51bWVyYXRpb24gZGV0ZWN0ZWQsIHRoZSB2YWx1ZXMgYXJlIGxpc3RlZCBvbiB0aGlzIHByb3BlcnR5LlxuICovXG5cbi8qKlxuICogVXNlZCB0byByZXByZXNlbnQgYSBudW1iZXIgc2VyaWVzIG9mIGFueSBzaXplLlxuICogSW5jbHVkZXMgdGhlIGxvd2VzdCAoYG1pbmApLCBoaWdoZXN0IChgbWF4YCksIG1lYW4vYXZlcmFnZSAoYG1lYW5gKSBhbmQgbWVhc3VyZW1lbnRzIGF0IGNlcnRhaW4gYHBlcmNlbnRpbGVzYC5cbiAqIEB0eXBlZGVmIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEB0eXBlIHt7bWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBtZWFuOiBudW1iZXIsIHAyNTogbnVtYmVyLCBwMzM6IG51bWJlciwgcDUwOiBudW1iZXIsIHA2NjogbnVtYmVyLCBwNzU6IG51bWJlciwgcDk5OiBudW1iZXJ9fVxuICovXG5cbi8qKlxuICogVGhpcyBjYWxsYmFjayBpcyBkaXNwbGF5ZWQgYXMgYSBnbG9iYWwgbWVtYmVyLlxuICogQGNhbGxiYWNrIHByb2dyZXNzQ2FsbGJhY2tcbiAqIEBwYXJhbSB7e3RvdGFsUm93czogbnVtYmVyLCBjdXJyZW50Um93OiBudW1iZXJ9fSBwcm9ncmVzcyAtIFRoZSBjdXJyZW50IHByb2dyZXNzIG9mIHByb2Nlc3NpbmcuXG4gKi9cblxuLyoqXG4gKiBzY2hlbWFCdWlsZGVyIGlzIHRoZSBtYWluIGZ1bmN0aW9uIGFuZCB3aGVyZSBhbGwgdGhlIGFuYWx5c2lzICYgcHJvY2Vzc2luZyBoYXBwZW5zLlxuICogQHBhcmFtIHtBcnJheTxPYmplY3Q+fSBpbnB1dCAtIFRoZSBpbnB1dCBkYXRhIHRvIGFuYWx5emUuIE11c3QgYmUgYW4gYXJyYXkgb2Ygb2JqZWN0cy5cbiAqIEBwYXJhbSB7eyBvblByb2dyZXNzPzogcHJvZ3Jlc3NDYWxsYmFjaywgZW51bU1pbmltdW1Sb3dDb3VudD86IG51bWJlciwgZW51bUFic29sdXRlTGltaXQ/OiBudW1iZXIsIGVudW1QZXJjZW50VGhyZXNob2xkPzogbnVtYmVyLCBudWxsYWJsZVJvd3NUaHJlc2hvbGQ/OiBudW1iZXIsIHVuaXF1ZVJvd3NUaHJlc2hvbGQ/OiBudW1iZXIsIHN0cmljdE1hdGNoaW5nPzogYm9vbGVhbiB9fSBbb3B0aW9uc10gLSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxUeXBlU3VtbWFyeT59IFJldHVybnMgYW5kXG4gKi9cbmZ1bmN0aW9uIHNjaGVtYUJ1aWxkZXIgKFxuICBpbnB1dCxcbiAge1xuICAgIG9uUHJvZ3Jlc3MgPSAoeyB0b3RhbFJvd3MsIGN1cnJlbnRSb3cgfSkgPT4ge30sXG4gICAgc3RyaWN0TWF0Y2hpbmcgPSB0cnVlLFxuICAgIGVudW1NaW5pbXVtUm93Q291bnQgPSAxMDAsIGVudW1BYnNvbHV0ZUxpbWl0ID0gMTAsIGVudW1QZXJjZW50VGhyZXNob2xkID0gMC4wMSxcbiAgICBudWxsYWJsZVJvd3NUaHJlc2hvbGQgPSAwLjAyLFxuICAgIHVuaXF1ZVJvd3NUaHJlc2hvbGQgPSAxLjBcbiAgfSA9IHtcbiAgICBvblByb2dyZXNzOiAoeyB0b3RhbFJvd3MsIGN1cnJlbnRSb3cgfSkgPT4ge30sXG4gICAgc3RyaWN0TWF0Y2hpbmc6IHRydWUsXG4gICAgZW51bU1pbmltdW1Sb3dDb3VudDogMTAwLFxuICAgIGVudW1BYnNvbHV0ZUxpbWl0OiAxMCxcbiAgICBlbnVtUGVyY2VudFRocmVzaG9sZDogMC4wMSxcbiAgICBudWxsYWJsZVJvd3NUaHJlc2hvbGQ6IDAuMDIsXG4gICAgdW5pcXVlUm93c1RocmVzaG9sZDogMS4wXG4gIH1cbikge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcpIHRocm93IEVycm9yKCdJbnB1dCBEYXRhIG11c3QgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cycpXG4gIGlmICh0eXBlb2YgaW5wdXRbMF0gIT09ICdvYmplY3QnKSB0aHJvdyBFcnJvcignSW5wdXQgRGF0YSBtdXN0IGJlIGFuIEFycmF5IG9mIE9iamVjdHMnKVxuICBpZiAoaW5wdXQubGVuZ3RoIDwgNSkgdGhyb3cgRXJyb3IoJ0FuYWx5c2lzIHJlcXVpcmVzIGF0IGxlYXN0IDUgcmVjb3Jkcy4gKFVzZSAyMDArIGZvciBncmVhdCByZXN1bHRzLiknKVxuICBjb25zdCBpc0VudW1FbmFibGVkID0gaW5wdXQubGVuZ3RoID49IGVudW1NaW5pbXVtUm93Q291bnRcblxuICBsb2coJ1N0YXJ0aW5nJylcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbnB1dClcbiAgICAudGhlbihwaXZvdFJvd3NHcm91cGVkQnlUeXBlKVxuICAgIC50aGVuKGNvbmRlbnNlRmllbGREYXRhKVxuICAgIC50aGVuKChzY2hlbWEpID0+IHtcbiAgICAgIGxvZygnQnVpbHQgc3VtbWFyeSBmcm9tIEZpZWxkIFR5cGUgZGF0YS4nKVxuICAgICAgLy8gY29uc29sZS5sb2coJ2dlblNjaGVtYScsIEpTT04uc3RyaW5naWZ5KGdlblNjaGVtYSwgbnVsbCwgMikpXG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5rZXlzKHNjaGVtYS5maWVsZHMpXG4gICAgICAgIC5yZWR1Y2UoKGZpZWxkSW5mbywgZmllbGROYW1lKSA9PiB7XG4gICAgICAgICAgY29uc3QgdHlwZXMgPSBzY2hlbWEuZmllbGRzW2ZpZWxkTmFtZV1cbiAgICAgICAgICAvKiogQHR5cGUge0ZpZWxkSW5mb30gKi9cbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IHtcbiAgICAgICAgICAgIHR5cGVzXG4gICAgICAgICAgfVxuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0gTWV0YUNoZWNrcy5UWVBFX0VOVU0uY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgZW51bUFic29sdXRlTGltaXQsIGVudW1QZXJjZW50VGhyZXNob2xkIH0pXG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfTlVMTEFCTEUuY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgbnVsbGFibGVSb3dzVGhyZXNob2xkIH0pXG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfVU5JUVVFLmNoZWNrKGZpZWxkSW5mb1tmaWVsZE5hbWVdLFxuICAgICAgICAgICAgeyByb3dDb3VudDogaW5wdXQubGVuZ3RoLCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdIH0sXG4gICAgICAgICAgICB7IHVuaXF1ZVJvd3NUaHJlc2hvbGQgfSlcblxuICAgICAgICAgIGNvbnN0IGlzSWRlbnRpdHkgPSAodHlwZXMuTnVtYmVyIHx8IHR5cGVzLlVVSUQpICYmIGZpZWxkSW5mb1tmaWVsZE5hbWVdLnVuaXF1ZSAmJiAvaWQkL2kudGVzdChmaWVsZE5hbWUpXG4gICAgICAgICAgaWYgKGlzSWRlbnRpdHkpIHtcbiAgICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdLmlkZW50aXR5ID0gdHJ1ZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzY2hlbWEudW5pcXVlcyAmJiBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdKSB7XG4gICAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXS51bmlxdWVDb3VudCA9IHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0ubGVuZ3RoXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmaWVsZEluZm9cbiAgICAgICAgfSwge30pXG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkcyxcbiAgICAgICAgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzXG4gICAgICAgIC8vIHVuaXF1ZXM6IHVuaXF1ZXMsXG4gICAgICAgIC8vIGZpZWxkczogc2NoZW1hLmZpZWxkc1xuICAgICAgfVxuICAgIH0pXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7b2JqZWN0W119IGRvY3NcbiAgICogQHJldHVybnMge3sgdG90YWxSb3dzOiBudW1iZXI7IHVuaXF1ZXM6IHsgW3g6IHN0cmluZ106IGFueVtdOyB9OyBmaWVsZHNEYXRhOiB7IFt4OiBzdHJpbmddOiBGaWVsZFR5cGVEYXRhW107IH07IH19IHNjaGVtYVxuICAgKi9cbiAgZnVuY3Rpb24gcGl2b3RSb3dzR3JvdXBlZEJ5VHlwZSAoZG9jcykge1xuICAgIGNvbnN0IGRldGVjdGVkU2NoZW1hID0geyB1bmlxdWVzOiBpc0VudW1FbmFibGVkID8ge30gOiBudWxsLCBmaWVsZHNEYXRhOiB7fSwgdG90YWxSb3dzOiBudWxsIH1cbiAgICBsb2coYCAgQWJvdXQgdG8gZXhhbWluZSBldmVyeSByb3cgJiBjZWxsLiBGb3VuZCAke2RvY3MubGVuZ3RofSByZWNvcmRzLi4uYClcbiAgICBjb25zdCBwaXZvdGVkU2NoZW1hID0gZG9jcy5yZWR1Y2UoZXZhbHVhdGVTY2hlbWFMZXZlbCwgZGV0ZWN0ZWRTY2hlbWEpXG4gICAgbG9nKCcgIEV4dHJhY3RlZCBkYXRhIHBvaW50cyBmcm9tIEZpZWxkIFR5cGUgYW5hbHlzaXMnKVxuICAgIHJldHVybiBwaXZvdGVkU2NoZW1hXG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7IHRvdGFsUm93czogbnVtYmVyOyB1bmlxdWVzOiB7IFt4OiBzdHJpbmddOiBhbnlbXTsgfTsgZmllbGRzRGF0YTogeyBbeDogc3RyaW5nXTogRmllbGRUeXBlRGF0YVtdOyB9OyB9fSBzY2hlbWFcbiAgICogQHBhcmFtIHt7IFt4OiBzdHJpbmddOiBhbnk7IH19IHJvd1xuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICogQHBhcmFtIHthbnlbXX0gYXJyYXlcbiAgICovXG4gICAgZnVuY3Rpb24gZXZhbHVhdGVTY2hlbWFMZXZlbCAoc2NoZW1hLCByb3csIGluZGV4LCBhcnJheSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgc2NoZW1hLnRvdGFsUm93cyA9IHNjaGVtYS50b3RhbFJvd3MgfHwgYXJyYXkubGVuZ3RoXG4gICAgY29uc3QgZmllbGROYW1lcyA9IE9iamVjdC5rZXlzKHJvdylcbiAgICBsb2coYFByb2Nlc3NpbmcgUm93ICMgJHtpbmRleCArIDF9LyR7c2NoZW1hLnRvdGFsUm93c30uLi5gKVxuICAgIGZpZWxkTmFtZXMuZm9yRWFjaCgoZmllbGROYW1lLCBpbmRleCwgYXJyYXkpID0+IHtcbiAgICAgIGlmIChpbmRleCA9PT0gMCkgbG9nKGBGb3VuZCAke2FycmF5Lmxlbmd0aH0gQ29sdW1uKHMpIWApXG4gICAgICBjb25zdCB0eXBlRmluZ2VycHJpbnQgPSBnZXRGaWVsZE1ldGFkYXRhKHtcbiAgICAgICAgdmFsdWU6IHJvd1tmaWVsZE5hbWVdLFxuICAgICAgICBzdHJpY3RNYXRjaGluZ1xuICAgICAgfSlcbiAgICAgIGNvbnN0IHR5cGVOYW1lcyA9IE9iamVjdC5rZXlzKHR5cGVGaW5nZXJwcmludClcbiAgICAgIGNvbnN0IGlzRW51bVR5cGUgPSB0eXBlTmFtZXMuaW5jbHVkZXMoJ051bWJlcicpIHx8IHR5cGVOYW1lcy5pbmNsdWRlcygnU3RyaW5nJylcblxuICAgICAgaWYgKGlzRW51bUVuYWJsZWQgJiYgaXNFbnVtVHlwZSkge1xuICAgICAgICBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB8fCBbXVxuICAgICAgICBpZiAoIXNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0uaW5jbHVkZXMocm93W2ZpZWxkTmFtZV0pKSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdLnB1c2gocm93W2ZpZWxkTmFtZV0pXG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSA9IG51bGxcbiAgICAgIH1cbiAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gPSBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdIHx8IFtdXG4gICAgICBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdLnB1c2godHlwZUZpbmdlcnByaW50KVxuICAgIH0pXG4gICAgb25Qcm9ncmVzcyh7IHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cywgY3VycmVudFJvdzogaW5kZXggKyAxIH0pXG4gICAgcmV0dXJuIHNjaGVtYVxuICB9XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7eyBmaWVsZHNEYXRhOiBPYmplY3QuPHN0cmluZywgRmllbGRUeXBlRGF0YVtdPiwgdW5pcXVlczogT2JqZWN0LjxzdHJpbmcsIGFueVtdPiwgdG90YWxSb3dzOiBudW1iZXJ9fSBzY2hlbWFcbiAqIEByZXR1cm5zIHt7ZmllbGRzOiBPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT4sIHVuaXF1ZXM6IE9iamVjdC48c3RyaW5nLCBhbnlbXT4sIHRvdGFsUm93czogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZERhdGEgKHNjaGVtYSkge1xuICBjb25zdCB7IGZpZWxkc0RhdGEgfSA9IHNjaGVtYVxuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoZmllbGRzRGF0YSlcblxuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gKi9cbiAgY29uc3QgZmllbGRTdW1tYXJ5ID0ge31cbiAgbG9nKGBQcmUtY29uZGVuc2VGaWVsZFNpemVzKGZpZWxkc1tmaWVsZE5hbWVdKSBmb3IgJHtmaWVsZE5hbWVzLmxlbmd0aH0gY29sdW1uc2ApXG4gIGZpZWxkTmFtZXNcbiAgICAuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVEYXRhPn0gKi9cbiAgICAgIGNvbnN0IHBpdm90ZWREYXRhID0gcGl2b3RGaWVsZERhdGFCeVR5cGUoZmllbGRzRGF0YVtmaWVsZE5hbWVdKVxuICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0gPSBjb25kZW5zZUZpZWxkU2l6ZXMocGl2b3RlZERhdGEpXG4gICAgfSlcbiAgbG9nKCdQb3N0LWNvbmRlbnNlRmllbGRTaXplcyhmaWVsZHNbZmllbGROYW1lXSknKVxuICBsb2coJ1JlcGxhY2VkIGZpZWxkRGF0YSB3aXRoIGZpZWxkU3VtbWFyeScpXG4gIHJldHVybiB7IGZpZWxkczogZmllbGRTdW1tYXJ5LCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcywgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCB7IHZhbHVlPywgbGVuZ3RoPywgc2NhbGU/LCBwcmVjaXNpb24/LCBpbnZhbGlkPyB9PltdfSB0eXBlU2l6ZURhdGEgLSBBbiBvYmplY3QgY29udGFpbmluZyB0aGVcbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlRGF0YT59XG4gKi9cbmZ1bmN0aW9uIHBpdm90RmllbGREYXRhQnlUeXBlICh0eXBlU2l6ZURhdGEpIHtcbiAgLy8gY29uc3QgYmxhbmtUeXBlU3VtcyA9ICgpID0+ICh7IGxlbmd0aDogMCwgc2NhbGU6IDAsIHByZWNpc2lvbjogMCB9KVxuICBsb2coYFByb2Nlc3NpbmcgJHt0eXBlU2l6ZURhdGEubGVuZ3RofSB0eXBlIGd1ZXNzZXNgKVxuICByZXR1cm4gdHlwZVNpemVEYXRhLnJlZHVjZSgocGl2b3RlZERhdGEsIGN1cnJlbnRUeXBlR3Vlc3NlcykgPT4ge1xuICAgIE9iamVjdC5lbnRyaWVzKGN1cnJlbnRUeXBlR3Vlc3NlcylcbiAgICAgIC5tYXAoKFt0eXBlTmFtZSwgeyB2YWx1ZSwgbGVuZ3RoLCBzY2FsZSwgcHJlY2lzaW9uIH1dKSA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0eXBlTmFtZSwgSlNPTi5zdHJpbmdpZnkoeyBsZW5ndGgsIHNjYWxlLCBwcmVjaXNpb24gfSkpXG4gICAgICAgIHBpdm90ZWREYXRhW3R5cGVOYW1lXSA9IHBpdm90ZWREYXRhW3R5cGVOYW1lXSB8fCB7IHR5cGVOYW1lLCBjb3VudDogMCB9XG4gICAgICAgIC8vIGlmICghcGl2b3RlZERhdGFbdHlwZU5hbWVdLmNvdW50KSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uY291bnQgPSAwXG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUobGVuZ3RoKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLmxlbmd0aCkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmxlbmd0aCA9IFtdXG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoc2NhbGUpICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0uc2NhbGUpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5zY2FsZSA9IFtdXG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocHJlY2lzaW9uKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLnByZWNpc2lvbikgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnByZWNpc2lvbiA9IFtdXG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUodmFsdWUpICYmICFwaXZvdGVkRGF0YVt0eXBlTmFtZV0udmFsdWUpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS52YWx1ZSA9IFtdXG5cbiAgICAgICAgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmNvdW50KytcbiAgICAgICAgLy8gaWYgKGludmFsaWQgIT0gbnVsbCkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmludmFsaWQrK1xuICAgICAgICBpZiAobGVuZ3RoKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ubGVuZ3RoLnB1c2gobGVuZ3RoKVxuICAgICAgICBpZiAoc2NhbGUpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5zY2FsZS5wdXNoKHNjYWxlKVxuICAgICAgICBpZiAocHJlY2lzaW9uKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucHJlY2lzaW9uLnB1c2gocHJlY2lzaW9uKVxuICAgICAgICBpZiAodmFsdWUpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS52YWx1ZS5wdXNoKHZhbHVlKVxuICAgICAgICAvLyBwaXZvdGVkRGF0YVt0eXBlTmFtZV0ucmFuayA9IHR5cGVSYW5raW5nc1t0eXBlTmFtZV1cbiAgICAgICAgcmV0dXJuIHBpdm90ZWREYXRhW3R5cGVOYW1lXVxuICAgICAgfSlcbiAgICByZXR1cm4gcGl2b3RlZERhdGFcbiAgfSwge30pXG4gIC8qXG4gID4gRXhhbXBsZSBvZiBzdW1Db3VudHMgYXQgdGhpcyBwb2ludFxuICB7XG4gICAgRmxvYXQ6IHsgY291bnQ6IDQsIHNjYWxlOiBbIDUsIDUsIDUsIDUgXSwgcHJlY2lzaW9uOiBbIDIsIDIsIDIsIDIgXSB9LFxuICAgIFN0cmluZzogeyBjb3VudDogMywgbGVuZ3RoOiBbIDIsIDMsIDYgXSB9LFxuICAgIE51bWJlcjogeyBjb3VudDogMSwgbGVuZ3RoOiBbIDYgXSB9XG4gIH1cbiovXG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gd2hpY2ggYW5hbHl6ZXMgYW5kIHN1bW1hcml6ZXMgZWFjaCBjb2x1bW5zIGRhdGEgYnkgdHlwZS4gU29ydCBvZiBhIGhpc3RvZ3JhbSBvZiBzaWduaWZpY2FudCBwb2ludHMuXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlRGF0YT59IHBpdm90ZWREYXRhQnlUeXBlIC0gYSBtYXAgb3JnYW5pemVkIGJ5IFR5cGUga2V5cyAoYFR5cGVOYW1lYCksIGNvbnRhaW5pbmcgZXh0cmFjdGVkIGRhdGEgZm9yIHRoZSByZXR1cm5lZCBgRmllbGRTdW1tYXJ5YC5cbiAqIEByZXR1cm5zIHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT59IC0gVGhlIGZpbmFsIG91dHB1dCwgd2l0aCBoaXN0b2dyYW1zIG9mIHNpZ25pZmljYW50IHBvaW50c1xuICovXG5mdW5jdGlvbiBjb25kZW5zZUZpZWxkU2l6ZXMgKHBpdm90ZWREYXRhQnlUeXBlKSB7XG4gIC8qKiBAdHlwZSB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN1bW1hcnk+fSAqL1xuICBjb25zdCBhZ2dyZWdhdGVTdW1tYXJ5ID0ge31cbiAgbG9nKCdTdGFydGluZyBjb25kZW5zZUZpZWxkU2l6ZXMoKScpXG4gIE9iamVjdC5rZXlzKHBpdm90ZWREYXRhQnlUeXBlKVxuICAgIC5tYXAoKHR5cGVOYW1lKSA9PiB7XG4gICAgICBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXSA9IHtcbiAgICAgICAgLy8gdHlwZU5hbWUsXG4gICAgICAgIHJhbms6IHR5cGVSYW5raW5nc1t0eXBlTmFtZV0sXG4gICAgICAgIGNvdW50OiBwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0uY291bnRcbiAgICAgIH1cbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpXG4gICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmxlbmd0aCkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0ubGVuZ3RoID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ubGVuZ3RoLCB0cnVlKVxuICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uc2NhbGUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSwgdHJ1ZSlcbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ucHJlY2lzaW9uKSBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5wcmVjaXNpb24gPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5wcmVjaXNpb24sIHRydWUpXG5cbiAgICAgIC8vIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0uaW52YWxpZCkgeyBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5pbnZhbGlkID0gcGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmludmFsaWQgfVxuXG4gICAgICBpZiAoWydUaW1lc3RhbXAnLCAnRGF0ZSddLmluZGV4T2YodHlwZU5hbWUpID4gLTEpIHtcbiAgICAgICAgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0udmFsdWUgPSBmb3JtYXRSYW5nZVN0YXRzKGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlLCBwYXJzZURhdGUpXG4gICAgICB9XG4gICAgfSlcbiAgbG9nKCdEb25lIGNvbmRlbnNlRmllbGRTaXplcygpLi4uJylcbiAgcmV0dXJuIGFnZ3JlZ2F0ZVN1bW1hcnlcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGRNZXRhZGF0YSAoe1xuICB2YWx1ZSxcbiAgc3RyaWN0TWF0Y2hpbmdcbn0pIHtcbiAgLy8gR2V0IGluaXRpYWwgcGFzcyBhdCB0aGUgZGF0YSB3aXRoIHRoZSBUWVBFXyogYC5jaGVjaygpYCBtZXRob2RzLlxuICBjb25zdCB0eXBlR3Vlc3NlcyA9IGRldGVjdFR5cGVzKHZhbHVlLCBzdHJpY3RNYXRjaGluZylcblxuICAvLyBBc3NpZ24gaW5pdGlhbCBtZXRhZGF0YSBmb3IgZWFjaCBtYXRjaGVkIHR5cGUgYmVsb3dcbiAgcmV0dXJuIHR5cGVHdWVzc2VzLnJlZHVjZSgoYW5hbHlzaXMsIHR5cGVHdWVzcywgcmFuaykgPT4ge1xuICAgIGxldCBsZW5ndGhcbiAgICBsZXQgcHJlY2lzaW9uXG4gICAgbGV0IHNjYWxlXG5cbiAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyByYW5rOiByYW5rICsgMSB9XG5cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnRmxvYXQnKSB7XG4gICAgICB2YWx1ZSA9IHBhcnNlRmxvYXQodmFsdWUpXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZSB9XG4gICAgICBjb25zdCBzaWduaWZpY2FuZEFuZE1hbnRpc3NhID0gU3RyaW5nKHZhbHVlKS5zcGxpdCgnLicpXG4gICAgICBpZiAoc2lnbmlmaWNhbmRBbmRNYW50aXNzYS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcHJlY2lzaW9uID0gc2lnbmlmaWNhbmRBbmRNYW50aXNzYS5qb2luKCcnKS5sZW5ndGggLy8gdG90YWwgIyBvZiBudW1lcmljIHBvc2l0aW9ucyBiZWZvcmUgJiBhZnRlciBkZWNpbWFsXG4gICAgICAgIHNjYWxlID0gc2lnbmlmaWNhbmRBbmRNYW50aXNzYVsxXS5sZW5ndGhcbiAgICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgcHJlY2lzaW9uLCBzY2FsZSB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdOdW1iZXInKSB7XG4gICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSlcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHZhbHVlIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ0RhdGUnIHx8IHR5cGVHdWVzcyA9PT0gJ1RpbWVzdGFtcCcpIHtcbiAgICAgIGNvbnN0IGNoZWNrZWREYXRlID0gaXNWYWxpZERhdGUodmFsdWUpXG4gICAgICBpZiAoY2hlY2tlZERhdGUpIHtcbiAgICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgdmFsdWU6IGNoZWNrZWREYXRlLmdldFRpbWUoKSB9XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBpbnZhbGlkOiB0cnVlLCB2YWx1ZTogdmFsdWUgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnU3RyaW5nJyB8fCB0eXBlR3Vlc3MgPT09ICdFbWFpbCcpIHtcbiAgICAgIGxlbmd0aCA9IFN0cmluZyh2YWx1ZSkubGVuZ3RoXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBsZW5ndGggfVxuICAgIH1cbiAgICBpZiAodHlwZUd1ZXNzID09PSAnQXJyYXknKSB7XG4gICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGhcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIGxlbmd0aCB9XG4gICAgfVxuICAgIHJldHVybiBhbmFseXNpc1xuICB9LCB7fSlcbn1cblxuLyoqXG4gKiBBY2NlcHRzIGFuIGFycmF5IG9mIG51bWJlcnMgYW5kIHJldHVybnMgc3VtbWFyeSBkYXRhIGFib3V0XG4gKiAgdGhlIHJhbmdlICYgc3ByZWFkIG9mIHBvaW50cyBpbiB0aGUgc2V0LlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyW119IG51bWJlcnMgLSBzZXF1ZW5jZSBvZiB1bnNvcnRlZCBkYXRhIHBvaW50c1xuICogQHJldHVybnMge0FnZ3JlZ2F0ZVN1bW1hcnl9XG4gKi9cbmZ1bmN0aW9uIGdldE51bWJlclJhbmdlU3RhdHMgKG51bWJlcnMsIHVzZVNvcnRlZERhdGFGb3JQZXJjZW50aWxlcyA9IGZhbHNlKSB7XG4gIGlmICghbnVtYmVycyB8fCBudW1iZXJzLmxlbmd0aCA8IDEpIHJldHVybiB1bmRlZmluZWRcbiAgY29uc3Qgc29ydGVkTnVtYmVycyA9IG51bWJlcnMuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBhIDwgYiA/IC0xIDogYSA9PT0gYiA/IDAgOiAxKVxuICBjb25zdCBzdW0gPSBudW1iZXJzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApXG4gIGlmICh1c2VTb3J0ZWREYXRhRm9yUGVyY2VudGlsZXMpIG51bWJlcnMgPSBzb3J0ZWROdW1iZXJzXG4gIHJldHVybiB7XG4gICAgLy8gc2l6ZTogbnVtYmVycy5sZW5ndGgsXG4gICAgbWluOiBzb3J0ZWROdW1iZXJzWzBdLFxuICAgIG1lYW46IHN1bSAvIG51bWJlcnMubGVuZ3RoLFxuICAgIG1heDogc29ydGVkTnVtYmVyc1tudW1iZXJzLmxlbmd0aCAtIDFdLFxuICAgIHAyNTogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjI1KSwgMTApXSxcbiAgICBwMzM6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC4zMyksIDEwKV0sXG4gICAgcDUwOiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuNTApLCAxMCldLFxuICAgIHA2NjogbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjY2KSwgMTApXSxcbiAgICBwNzU6IG51bWJlcnNbcGFyc2VJbnQoU3RyaW5nKG51bWJlcnMubGVuZ3RoICogMC43NSksIDEwKV0sXG4gICAgcDk5OiBudW1iZXJzW3BhcnNlSW50KFN0cmluZyhudW1iZXJzLmxlbmd0aCAqIDAuOTkpLCAxMCldXG4gIH1cbn1cblxuLyoqXG4gKlxuICovXG5mdW5jdGlvbiBmb3JtYXRSYW5nZVN0YXRzIChzdGF0cywgZm9ybWF0dGVyKSB7XG4gIC8vIGlmICghc3RhdHMgfHwgIWZvcm1hdHRlcikgcmV0dXJuIHVuZGVmaW5lZFxuICByZXR1cm4ge1xuICAgIC8vIHNpemU6IHN0YXRzLnNpemUsXG4gICAgbWluOiBmb3JtYXR0ZXIoc3RhdHMubWluKSxcbiAgICBtZWFuOiBmb3JtYXR0ZXIoc3RhdHMubWVhbiksXG4gICAgbWF4OiBmb3JtYXR0ZXIoc3RhdHMubWF4KSxcbiAgICBwMjU6IGZvcm1hdHRlcihzdGF0cy5wMjUpLFxuICAgIHAzMzogZm9ybWF0dGVyKHN0YXRzLnAzMyksXG4gICAgcDUwOiBmb3JtYXR0ZXIoc3RhdHMucDUwKSxcbiAgICBwNjY6IGZvcm1hdHRlcihzdGF0cy5wNjYpLFxuICAgIHA3NTogZm9ybWF0dGVyKHN0YXRzLnA3NSksXG4gICAgcDk5OiBmb3JtYXR0ZXIoc3RhdHMucDk5KVxuICB9XG59XG4iXSwibmFtZXMiOlsicmVxdWlyZSQkMCIsImdsb2JhbCIsImlzRGF0ZSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7O0NBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLENBQUMsR0FB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cEMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDcEMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDcEMsR0FBRztBQUNILEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDckIsRUFBRSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdkMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDMUMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDMUMsR0FBRztBQUNILEVB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QUFDcEIsWUFBWSxHQUFHLElBQUksQ0FBQztBQUNwQixpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDOUIsZUFBZSxHQUFHLFlBQVksRUFBRSxDQUFDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLEdBQUc7QUFDakIsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FB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RSxDQUFDLENBQUM7QUFDN0QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxJQUFJLEdBQUcsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdELEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLGdCQUFnQixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDN0M7QUFDQSxFQUFFLE9BQU87QUFDVDtBQUNBLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksSUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQy9CLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQzdCLEdBQUc7QUFDSCxDQUFDIn0=
