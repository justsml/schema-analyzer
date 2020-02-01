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

function isTimestamp (value) {
  if (value == null) return false
  value = String(value).trim();
  return timestampPattern.test(value)
}

function isCurrency (value) {
  if (value == null) return false
  value = String(value).trim();
  const valueSymbol = currencies.find(curSymbol => value.indexOf(curSymbol) > -1);
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
}/**
 * Returns an array of TypeName.
 * @param {any} value - input data
 * @returns {string[]}
 */
function detectTypes (value) {
  const excludedTypes = [];
  const matchedTypes = prioritizedTypes.reduce((types, typeHelper) => {
    if (typeHelper.check(value)) {
      if (typeHelper.supercedes) excludedTypes.push(...typeHelper.supercedes);
      types.push(typeHelper.type);
    }
    return types
  }, []);
  return matchedTypes.filter(type => excludedTypes.indexOf(type) === -1)
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
      if (types.Unknown) {
        nullishTypeCount += types.Unknown.count;
      }
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
  check: value => value === '' || value === undefined || value === 'undefined'
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
  check: value => {
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
 * @type {{min: number, max: number, mean: number, percentiles: number[]}}
 */

/**
 * This callback is displayed as a global member.
 * @callback progressCallback
 * @param {{totalRows: number, currentRow: number}} progress - The current progress of processing.
 */

/**
 * schemaBuilder is the main function and where all the analysis & processing happens.
 * @param {String} name - Name of the resource, Table or collection.
 * @param {Array<Object>} input - The input data to analyze. Must be an array of objects.
 * @param {{ onProgress?: progressCallback, enumMinimumRowCount?: number, enumAbsoluteLimit?: number, enumPercentThreshold?: number, nullableRowsThreshold?: number, uniqueRowsThreshold?: number }} [options] - Optional parameters
 * @returns {Promise<TypeSummary>} Returns and
 */
function schemaBuilder (
  name, input,
  {
    onProgress = ({ totalRows, currentRow }) => {},
    enumMinimumRowCount = 100, enumAbsoluteLimit = 10, enumPercentThreshold = 0.01,
    nullableRowsThreshold = 0.02,
    uniqueRowsThreshold = 1.0
  } = {
    onProgress: ({ totalRows, currentRow }) => {},
    enumMinimumRowCount: 100,
    enumAbsoluteLimit: 10,
    enumPercentThreshold: 0.01,
    nullableRowsThreshold: 0.02,
    uniqueRowsThreshold: 1.0
  }
) {
  if (typeof name !== 'string') throw Error('Argument `name` must be a String')
  if (!Array.isArray(input)) throw Error('Input Data must be an Array of Objects')
  const isEnumEnabled = input.length >= enumMinimumRowCount;

  log('Starting');
  return Promise.resolve(input)
    .then(pivotRowsGroupedByType)
    .then(condenseFieldData)
    .then(schema => {
      log('Built summary from Field Type data.');
      // console.log('genSchema', JSON.stringify(genSchema, null, 2))

      const fields = Object.keys(schema.fields)
        .reduce((fieldInfo, fieldName) => {
        /** @type {FieldInfo} */
          fieldInfo[fieldName] = {
          // nullable: null,
          // unique: null,
            types: schema.fields[fieldName]
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
        schema,
        fieldName,
        value: row[fieldName]
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

  // console.log('condensefieldData', fieldNames)
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
 * @param {Object.<string, { value?, length?, scale?, precision? }>[]} typeSizeData - An object containing the
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
    .map(typeName => {
      aggregateSummary[typeName] = {
        // typeName,
        rank: typeRankings[typeName],
        count: pivotedDataByType[typeName].count
      };
      if (pivotedDataByType[typeName].value) aggregateSummary[typeName].value = getNumberRangeStats(pivotedDataByType[typeName].value);
      if (pivotedDataByType[typeName].length) aggregateSummary[typeName].length = getNumberRangeStats(pivotedDataByType[typeName].length);
      if (pivotedDataByType[typeName].scale) aggregateSummary[typeName].scale = getNumberRangeStats(pivotedDataByType[typeName].scale);
      if (pivotedDataByType[typeName].precision) aggregateSummary[typeName].precision = getNumberRangeStats(pivotedDataByType[typeName].precision);
    });
  log('Done condenseFieldSizes()...');
  return aggregateSummary
}

function getFieldMetadata ({
  value,
  fieldName,
  schema, // eslint-disable-line
  recursive = false
}) {
  // Get initial pass at the data with the TYPE_* `.check()` methods.
  const typeGuesses = detectTypes(value);

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
    if (typeGuess === 'Number' || typeGuess === 'Timestamp') {
      value = Number(value);
      analysis[typeGuess] = { ...analysis[typeGuess], value };
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
function getNumberRangeStats (numbers) {
  if (!numbers || numbers.length < 1) return undefined
  numbers = numbers.slice().sort((a, b) => a < b ? -1 : a === b ? 0 : 1);
  const sum = numbers.reduce((a, b) => a + b, 0);
  return {
    min: numbers[0],
    mean: sum / numbers.length,
    max: numbers[numbers.length - 1],
    percentiles: [
      numbers[parseInt(String(numbers.length * 0.3), 10)],
      numbers[parseInt(String(numbers.length * 0.6), 10)],
      numbers[parseInt(String(numbers.length * 0.9), 10)]
    ]
  }
}export{getNumberRangeStats,pivotFieldDataByType,schemaBuilder};//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLWFuYWx5emVyLmVzbS5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9jb21tb24uanMiLCIuLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZGF0ZS9pbmRleC5qcyIsIi4uL3V0aWxzL3R5cGUtZGV0ZWN0b3JzLmpzIiwiLi4vdHlwZS1oZWxwZXJzLmpzIiwiLi4vaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB3ID0gZCAqIDc7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHZhbCkpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID8gZm10TG9uZyh2YWwpIDogZm10U2hvcnQodmFsKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArXG4gICAgICBKU09OLnN0cmluZ2lmeSh2YWwpXG4gICk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cik7XG4gIGlmIChzdHIubGVuZ3RoID4gMTAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBtYXRjaCA9IC9eKC0/KD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx3ZWVrcz98d3x5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnd2Vla3MnOlxuICAgIGNhc2UgJ3dlZWsnOlxuICAgIGNhc2UgJ3cnOlxuICAgICAgcmV0dXJuIG4gKiB3O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtc0FicyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXNBYnMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgdmFyIG1zQWJzID0gTWF0aC5hYnMobXMpO1xuICBpZiAobXNBYnMgPj0gZCkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBkLCAnZGF5Jyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IGgpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgaCwgJ2hvdXInKTtcbiAgfVxuICBpZiAobXNBYnMgPj0gbSkge1xuICAgIHJldHVybiBwbHVyYWwobXMsIG1zQWJzLCBtLCAnbWludXRlJyk7XG4gIH1cbiAgaWYgKG1zQWJzID49IHMpIHtcbiAgICByZXR1cm4gcGx1cmFsKG1zLCBtc0FicywgcywgJ3NlY29uZCcpO1xuICB9XG4gIHJldHVybiBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbXNBYnMsIG4sIG5hbWUpIHtcbiAgdmFyIGlzUGx1cmFsID0gbXNBYnMgPj0gbiAqIDEuNTtcbiAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBuKSArICcgJyArIG5hbWUgKyAoaXNQbHVyYWwgPyAncycgOiAnJyk7XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5mdW5jdGlvbiBzZXR1cChlbnYpIHtcblx0Y3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Zztcblx0Y3JlYXRlRGVidWcuZGVmYXVsdCA9IGNyZWF0ZURlYnVnO1xuXHRjcmVhdGVEZWJ1Zy5jb2VyY2UgPSBjb2VyY2U7XG5cdGNyZWF0ZURlYnVnLmRpc2FibGUgPSBkaXNhYmxlO1xuXHRjcmVhdGVEZWJ1Zy5lbmFibGUgPSBlbmFibGU7XG5cdGNyZWF0ZURlYnVnLmVuYWJsZWQgPSBlbmFibGVkO1xuXHRjcmVhdGVEZWJ1Zy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cblx0T2JqZWN0LmtleXMoZW52KS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0Y3JlYXRlRGVidWdba2V5XSA9IGVudltrZXldO1xuXHR9KTtcblxuXHQvKipcblx0KiBBY3RpdmUgYGRlYnVnYCBpbnN0YW5jZXMuXG5cdCovXG5cdGNyZWF0ZURlYnVnLmluc3RhbmNlcyA9IFtdO1xuXG5cdC8qKlxuXHQqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuXHQqL1xuXG5cdGNyZWF0ZURlYnVnLm5hbWVzID0gW107XG5cdGNyZWF0ZURlYnVnLnNraXBzID0gW107XG5cblx0LyoqXG5cdCogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuXHQqXG5cdCogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuXHQqL1xuXHRjcmVhdGVEZWJ1Zy5mb3JtYXR0ZXJzID0ge307XG5cblx0LyoqXG5cdCogU2VsZWN0cyBhIGNvbG9yIGZvciBhIGRlYnVnIG5hbWVzcGFjZVxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBzdHJpbmcgZm9yIHRoZSBmb3IgdGhlIGRlYnVnIGluc3RhbmNlIHRvIGJlIGNvbG9yZWRcblx0KiBAcmV0dXJuIHtOdW1iZXJ8U3RyaW5nfSBBbiBBTlNJIGNvbG9yIGNvZGUgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG5cdFx0bGV0IGhhc2ggPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcblx0XHRcdGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0aGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcblx0XHR9XG5cblx0XHRyZXR1cm4gY3JlYXRlRGVidWcuY29sb3JzW01hdGguYWJzKGhhc2gpICUgY3JlYXRlRGVidWcuY29sb3JzLmxlbmd0aF07XG5cdH1cblx0Y3JlYXRlRGVidWcuc2VsZWN0Q29sb3IgPSBzZWxlY3RDb2xvcjtcblxuXHQvKipcblx0KiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAcmV0dXJuIHtGdW5jdGlvbn1cblx0KiBAYXBpIHB1YmxpY1xuXHQqL1xuXHRmdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblx0XHRsZXQgcHJldlRpbWU7XG5cblx0XHRmdW5jdGlvbiBkZWJ1ZyguLi5hcmdzKSB7XG5cdFx0XHQvLyBEaXNhYmxlZD9cblx0XHRcdGlmICghZGVidWcuZW5hYmxlZCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHNlbGYgPSBkZWJ1ZztcblxuXHRcdFx0Ly8gU2V0IGBkaWZmYCB0aW1lc3RhbXBcblx0XHRcdGNvbnN0IGN1cnIgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cdFx0XHRjb25zdCBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG5cdFx0XHRzZWxmLmRpZmYgPSBtcztcblx0XHRcdHNlbGYucHJldiA9IHByZXZUaW1lO1xuXHRcdFx0c2VsZi5jdXJyID0gY3Vycjtcblx0XHRcdHByZXZUaW1lID0gY3VycjtcblxuXHRcdFx0YXJnc1swXSA9IGNyZWF0ZURlYnVnLmNvZXJjZShhcmdzWzBdKTtcblxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuXHRcdFx0XHQvLyBBbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuXHRcdFx0XHRhcmdzLnVuc2hpZnQoJyVPJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG5cdFx0XHRsZXQgaW5kZXggPSAwO1xuXHRcdFx0YXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIChtYXRjaCwgZm9ybWF0KSA9PiB7XG5cdFx0XHRcdC8vIElmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcblx0XHRcdFx0aWYgKG1hdGNoID09PSAnJSUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGluZGV4Kys7XG5cdFx0XHRcdGNvbnN0IGZvcm1hdHRlciA9IGNyZWF0ZURlYnVnLmZvcm1hdHRlcnNbZm9ybWF0XTtcblx0XHRcdFx0aWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCB2YWwgPSBhcmdzW2luZGV4XTtcblx0XHRcdFx0XHRtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cblx0XHRcdFx0XHQvLyBOb3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG5cdFx0XHRcdFx0YXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHRcdGluZGV4LS07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG1hdGNoO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG5cdFx0XHRjcmVhdGVEZWJ1Zy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cblx0XHRcdGNvbnN0IGxvZ0ZuID0gc2VsZi5sb2cgfHwgY3JlYXRlRGVidWcubG9nO1xuXHRcdFx0bG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG5cdFx0fVxuXG5cdFx0ZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXHRcdGRlYnVnLmVuYWJsZWQgPSBjcmVhdGVEZWJ1Zy5lbmFibGVkKG5hbWVzcGFjZSk7XG5cdFx0ZGVidWcudXNlQ29sb3JzID0gY3JlYXRlRGVidWcudXNlQ29sb3JzKCk7XG5cdFx0ZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuXHRcdGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXHRcdGRlYnVnLmV4dGVuZCA9IGV4dGVuZDtcblx0XHQvLyBEZWJ1Zy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcblx0XHQvLyBkZWJ1Zy5yYXdMb2cgPSByYXdMb2c7XG5cblx0XHQvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuXHRcdGlmICh0eXBlb2YgY3JlYXRlRGVidWcuaW5pdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0Y3JlYXRlRGVidWcuaW5pdChkZWJ1Zyk7XG5cdFx0fVxuXG5cdFx0Y3JlYXRlRGVidWcuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG5cdFx0cmV0dXJuIGRlYnVnO1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0XHRjb25zdCBpbmRleCA9IGNyZWF0ZURlYnVnLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuXHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdGNyZWF0ZURlYnVnLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChuYW1lc3BhY2UsIGRlbGltaXRlcikge1xuXHRcdGNvbnN0IG5ld0RlYnVnID0gY3JlYXRlRGVidWcodGhpcy5uYW1lc3BhY2UgKyAodHlwZW9mIGRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnOicgOiBkZWxpbWl0ZXIpICsgbmFtZXNwYWNlKTtcblx0XHRuZXdEZWJ1Zy5sb2cgPSB0aGlzLmxvZztcblx0XHRyZXR1cm4gbmV3RGVidWc7XG5cdH1cblxuXHQvKipcblx0KiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG5cdCogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cblx0KlxuXHQqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcblx0XHRjcmVhdGVEZWJ1Zy5zYXZlKG5hbWVzcGFjZXMpO1xuXG5cdFx0Y3JlYXRlRGVidWcubmFtZXMgPSBbXTtcblx0XHRjcmVhdGVEZWJ1Zy5za2lwcyA9IFtdO1xuXG5cdFx0bGV0IGk7XG5cdFx0Y29uc3Qgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuXHRcdGNvbnN0IGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKCFzcGxpdFtpXSkge1xuXHRcdFx0XHQvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0bmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG5cblx0XHRcdGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcblx0XHRcdFx0Y3JlYXRlRGVidWcuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjcmVhdGVEZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDA7IGkgPCBjcmVhdGVEZWJ1Zy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGluc3RhbmNlID0gY3JlYXRlRGVidWcuaW5zdGFuY2VzW2ldO1xuXHRcdFx0aW5zdGFuY2UuZW5hYmxlZCA9IGNyZWF0ZURlYnVnLmVuYWJsZWQoaW5zdGFuY2UubmFtZXNwYWNlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cblx0KlxuXHQqIEByZXR1cm4ge1N0cmluZ30gbmFtZXNwYWNlc1xuXHQqIEBhcGkgcHVibGljXG5cdCovXG5cdGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgbmFtZXNwYWNlcyA9IFtcblx0XHRcdC4uLmNyZWF0ZURlYnVnLm5hbWVzLm1hcCh0b05hbWVzcGFjZSksXG5cdFx0XHQuLi5jcmVhdGVEZWJ1Zy5za2lwcy5tYXAodG9OYW1lc3BhY2UpLm1hcChuYW1lc3BhY2UgPT4gJy0nICsgbmFtZXNwYWNlKVxuXHRcdF0uam9pbignLCcpO1xuXHRcdGNyZWF0ZURlYnVnLmVuYWJsZSgnJyk7XG5cdFx0cmV0dXJuIG5hbWVzcGFjZXM7XG5cdH1cblxuXHQvKipcblx0KiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG5cdCpcblx0KiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuXHQqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCogQGFwaSBwdWJsaWNcblx0Ki9cblx0ZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG5cdFx0aWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgaTtcblx0XHRsZXQgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gY3JlYXRlRGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChjcmVhdGVEZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBjcmVhdGVEZWJ1Zy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGNyZWF0ZURlYnVnLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCogQ29udmVydCByZWdleHAgdG8gbmFtZXNwYWNlXG5cdCpcblx0KiBAcGFyYW0ge1JlZ0V4cH0gcmVneGVwXG5cdCogQHJldHVybiB7U3RyaW5nfSBuYW1lc3BhY2Vcblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2UocmVnZXhwKSB7XG5cdFx0cmV0dXJuIHJlZ2V4cC50b1N0cmluZygpXG5cdFx0XHQuc3Vic3RyaW5nKDIsIHJlZ2V4cC50b1N0cmluZygpLmxlbmd0aCAtIDIpXG5cdFx0XHQucmVwbGFjZSgvXFwuXFwqXFw/JC8sICcqJyk7XG5cdH1cblxuXHQvKipcblx0KiBDb2VyY2UgYHZhbGAuXG5cdCpcblx0KiBAcGFyYW0ge01peGVkfSB2YWxcblx0KiBAcmV0dXJuIHtNaXhlZH1cblx0KiBAYXBpIHByaXZhdGVcblx0Ki9cblx0ZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuXHRcdGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0cmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcblx0XHR9XG5cdFx0cmV0dXJuIHZhbDtcblx0fVxuXG5cdGNyZWF0ZURlYnVnLmVuYWJsZShjcmVhdGVEZWJ1Zy5sb2FkKCkpO1xuXG5cdHJldHVybiBjcmVhdGVEZWJ1Zztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cDtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqL1xuXG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuXHQnIzAwMDBDQycsXG5cdCcjMDAwMEZGJyxcblx0JyMwMDMzQ0MnLFxuXHQnIzAwMzNGRicsXG5cdCcjMDA2NkNDJyxcblx0JyMwMDY2RkYnLFxuXHQnIzAwOTlDQycsXG5cdCcjMDA5OUZGJyxcblx0JyMwMENDMDAnLFxuXHQnIzAwQ0MzMycsXG5cdCcjMDBDQzY2Jyxcblx0JyMwMENDOTknLFxuXHQnIzAwQ0NDQycsXG5cdCcjMDBDQ0ZGJyxcblx0JyMzMzAwQ0MnLFxuXHQnIzMzMDBGRicsXG5cdCcjMzMzM0NDJyxcblx0JyMzMzMzRkYnLFxuXHQnIzMzNjZDQycsXG5cdCcjMzM2NkZGJyxcblx0JyMzMzk5Q0MnLFxuXHQnIzMzOTlGRicsXG5cdCcjMzNDQzAwJyxcblx0JyMzM0NDMzMnLFxuXHQnIzMzQ0M2NicsXG5cdCcjMzNDQzk5Jyxcblx0JyMzM0NDQ0MnLFxuXHQnIzMzQ0NGRicsXG5cdCcjNjYwMENDJyxcblx0JyM2NjAwRkYnLFxuXHQnIzY2MzNDQycsXG5cdCcjNjYzM0ZGJyxcblx0JyM2NkNDMDAnLFxuXHQnIzY2Q0MzMycsXG5cdCcjOTkwMENDJyxcblx0JyM5OTAwRkYnLFxuXHQnIzk5MzNDQycsXG5cdCcjOTkzM0ZGJyxcblx0JyM5OUNDMDAnLFxuXHQnIzk5Q0MzMycsXG5cdCcjQ0MwMDAwJyxcblx0JyNDQzAwMzMnLFxuXHQnI0NDMDA2NicsXG5cdCcjQ0MwMDk5Jyxcblx0JyNDQzAwQ0MnLFxuXHQnI0NDMDBGRicsXG5cdCcjQ0MzMzAwJyxcblx0JyNDQzMzMzMnLFxuXHQnI0NDMzM2NicsXG5cdCcjQ0MzMzk5Jyxcblx0JyNDQzMzQ0MnLFxuXHQnI0NDMzNGRicsXG5cdCcjQ0M2NjAwJyxcblx0JyNDQzY2MzMnLFxuXHQnI0NDOTkwMCcsXG5cdCcjQ0M5OTMzJyxcblx0JyNDQ0NDMDAnLFxuXHQnI0NDQ0MzMycsXG5cdCcjRkYwMDAwJyxcblx0JyNGRjAwMzMnLFxuXHQnI0ZGMDA2NicsXG5cdCcjRkYwMDk5Jyxcblx0JyNGRjAwQ0MnLFxuXHQnI0ZGMDBGRicsXG5cdCcjRkYzMzAwJyxcblx0JyNGRjMzMzMnLFxuXHQnI0ZGMzM2NicsXG5cdCcjRkYzMzk5Jyxcblx0JyNGRjMzQ0MnLFxuXHQnI0ZGMzNGRicsXG5cdCcjRkY2NjAwJyxcblx0JyNGRjY2MzMnLFxuXHQnI0ZGOTkwMCcsXG5cdCcjRkY5OTMzJyxcblx0JyNGRkNDMDAnLFxuXHQnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcblx0Ly8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuXHQvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuXHQvLyBleHBsaWNpdGx5XG5cdGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiAod2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJyB8fCB3aW5kb3cucHJvY2Vzcy5fX253anMpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIElzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG5cdC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG5cdHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuXHRcdC8vIElzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcblx0XHQodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuXHRcdC8vIElzIGZpcmVmb3ggPj0gdjMxP1xuXHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuXHRcdCh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuXHRcdC8vIERvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcblx0XHQodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuXHRhcmdzWzBdID0gKHRoaXMudXNlQ29sb3JzID8gJyVjJyA6ICcnKSArXG5cdFx0dGhpcy5uYW1lc3BhY2UgK1xuXHRcdCh0aGlzLnVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKSArXG5cdFx0YXJnc1swXSArXG5cdFx0KHRoaXMudXNlQ29sb3JzID8gJyVjICcgOiAnICcpICtcblx0XHQnKycgKyBtb2R1bGUuZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG5cdGlmICghdGhpcy51c2VDb2xvcnMpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcblx0YXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0Jyk7XG5cblx0Ly8gVGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcblx0Ly8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuXHQvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cblx0bGV0IGluZGV4ID0gMDtcblx0bGV0IGxhc3RDID0gMDtcblx0YXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIG1hdGNoID0+IHtcblx0XHRpZiAobWF0Y2ggPT09ICclJScpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aW5kZXgrKztcblx0XHRpZiAobWF0Y2ggPT09ICclYycpIHtcblx0XHRcdC8vIFdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuXHRcdFx0Ly8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcblx0XHRcdGxhc3RDID0gaW5kZXg7XG5cdFx0fVxuXHR9KTtcblxuXHRhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG5cdC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG5cdC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG5cdHJldHVybiB0eXBlb2YgY29uc29sZSA9PT0gJ29iamVjdCcgJiZcblx0XHRjb25zb2xlLmxvZyAmJlxuXHRcdGNvbnNvbGUubG9nKC4uLmFyZ3MpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG5cdHRyeSB7XG5cdFx0aWYgKG5hbWVzcGFjZXMpIHtcblx0XHRcdGV4cG9ydHMuc3RvcmFnZS5zZXRJdGVtKCdkZWJ1ZycsIG5hbWVzcGFjZXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gU3dhbGxvd1xuXHRcdC8vIFhYWCAoQFFpeC0pIHNob3VsZCB3ZSBiZSBsb2dnaW5nIHRoZXNlP1xuXHR9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGxvYWQoKSB7XG5cdGxldCByO1xuXHR0cnkge1xuXHRcdHIgPSBleHBvcnRzLnN0b3JhZ2UuZ2V0SXRlbSgnZGVidWcnKTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHQvLyBTd2FsbG93XG5cdFx0Ly8gWFhYIChAUWl4LSkgc2hvdWxkIHdlIGJlIGxvZ2dpbmcgdGhlc2U/XG5cdH1cblxuXHQvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG5cdGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuXHRcdHIgPSBwcm9jZXNzLmVudi5ERUJVRztcblx0fVxuXG5cdHJldHVybiByO1xufVxuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcblx0dHJ5IHtcblx0XHQvLyBUVk1MS2l0IChBcHBsZSBUViBKUyBSdW50aW1lKSBkb2VzIG5vdCBoYXZlIGEgd2luZG93IG9iamVjdCwganVzdCBsb2NhbFN0b3JhZ2UgaW4gdGhlIGdsb2JhbCBjb250ZXh0XG5cdFx0Ly8gVGhlIEJyb3dzZXIgYWxzbyBoYXMgbG9jYWxTdG9yYWdlIGluIHRoZSBnbG9iYWwgY29udGV4dC5cblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdC8vIFN3YWxsb3dcblx0XHQvLyBYWFggKEBRaXgtKSBzaG91bGQgd2UgYmUgbG9nZ2luZyB0aGVzZT9cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY29tbW9uJykoZXhwb3J0cyk7XG5cbmNvbnN0IHtmb3JtYXR0ZXJzfSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbiAodikge1xuXHR0cnkge1xuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRyZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyb3IubWVzc2FnZTtcblx0fVxufTtcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgZGF0ZVRhZyA9ICdbb2JqZWN0IERhdGVdJztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHByb2Nlc3NgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlUHJvY2VzcyA9IG1vZHVsZUV4cG9ydHMgJiYgZnJlZUdsb2JhbC5wcm9jZXNzO1xuXG4vKiogVXNlZCB0byBhY2Nlc3MgZmFzdGVyIE5vZGUuanMgaGVscGVycy4gKi9cbnZhciBub2RlVXRpbCA9IChmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZnJlZVByb2Nlc3MgJiYgZnJlZVByb2Nlc3MuYmluZGluZygndXRpbCcpO1xuICB9IGNhdGNoIChlKSB7fVxufSgpKTtcblxuLyogTm9kZS5qcyBoZWxwZXIgcmVmZXJlbmNlcy4gKi9cbnZhciBub2RlSXNEYXRlID0gbm9kZVV0aWwgJiYgbm9kZVV0aWwuaXNEYXRlO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2FwcGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRGF0ZWAgd2l0aG91dCBOb2RlLmpzIG9wdGltaXphdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNEYXRlKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpID09IGRhdGVUYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBEYXRlYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBkYXRlIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRGF0ZShuZXcgRGF0ZSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc0RhdGUoJ01vbiBBcHJpbCAyMyAyMDEyJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNEYXRlID0gbm9kZUlzRGF0ZSA/IGJhc2VVbmFyeShub2RlSXNEYXRlKSA6IGJhc2VJc0RhdGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRGF0ZTtcbiIsImltcG9ydCBpc0RhdGUgZnJvbSAnbG9kYXNoLmlzZGF0ZSdcbmV4cG9ydCB7XG4gIGlzQm9vbGlzaCxcbiAgaXNDdXJyZW5jeSxcbiAgaXNEYXRlU3RyaW5nLFxuICBpc0VtYWlsU2hhcGVkLFxuICBpc0Zsb2F0aXNoLFxuICBpc051bGxpc2gsXG4gIGlzTnVtZXJpYyxcbiAgaXNPYmplY3RJZCxcbiAgaXNUaW1lc3RhbXAsXG4gIGlzVXVpZFxufVxuXG5jb25zdCBjdXJyZW5jaWVzID0gW1xuICAnJCcsICfCoicsICfCoycsICfCpCcsICfCpScsICfWjycsICfYiycsICffvicsICffvycsICfgp7InLCAn4KezJywgJ+CnuycsXG4gICfgq7EnLCAn4K+5JywgJ+C4vycsICfhn5snLCAn4oKgJywgJ+KCoScsICfigqInLCAn4oKjJywgJ+KCpCcsICfigqUnLCAn4oKmJywgJ+KCpycsXG4gICfigqgnLCAn4oKpJywgJ+KCqicsICfigqsnLCAn4oKsJywgJ+KCrScsICfigq4nLCAn4oKvJywgJ+KCsCcsICfigrEnLCAn4oKyJywgJ+KCsycsXG4gICfigrQnLCAn4oK1JywgJ+KCticsICfigrcnLCAn4oK4JywgJ+KCuScsICfigronLCAn4oK7JywgJ+KCvCcsICfigr0nLCAn4oK+JywgJ+KCvycsXG4gICfqoLgnLCAn77e8JywgJ++5qScsICfvvIQnLCAn77+gJywgJ++/oScsICfvv6UnLCAn77+mJyxcbiAgJ/CRv50nLCAn8JG/nicsICfwkb+fJywgJ/CRv6AnLCAn8J6LvycsICfwnrKwJ1xuXVxuXG5jb25zdCBib29saXNoUGF0dGVybiA9IC9eKFtZTl18KFRSVUUpfChGQUxTRSkpJC9pXG5jb25zdCB1dWlkUGF0dGVybiA9IC9eWzAtOWEtZkEtRl17OH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17NH0tWzAtOWEtZkEtRl17MTJ9JC9cbmNvbnN0IG9iamVjdElkUGF0dGVybiA9IC9eW2EtZlxcZF17MjR9JC9pXG5jb25zdCBkYXRlU3RyaW5nUGF0dGVybiA9IC9eKFsrLV0/XFxkezR9KD8hXFxkezJ9XFxiKSkoKC0/KSgoMFsxLTldfDFbMC0yXSkoXFwzKFsxMl1cXGR8MFsxLTldfDNbMDFdKSk/fFcoWzAtNF1cXGR8NVswLTJdKSgtP1sxLTddKT98KDAwWzEtOV18MFsxLTldXFxkfFsxMl1cXGR7Mn18MyhbMC01XVxcZHw2WzEtNl0pKSkoW1RcXHNdKCgoWzAxXVxcZHwyWzAtM10pKCg6PylbMC01XVxcZCk/fDI0XFw6PzAwKShbLixdXFxkKyg/ITopKT8pPyhcXDE3WzAtNV1cXGQoWy4sXVxcZCspPyk/KFt6Wl18KFsrLV0pKFswMV1cXGR8MlswLTNdKTo/KFswLTVdXFxkKT8pPyk/KT8kL1xuY29uc3QgdGltZXN0YW1wUGF0dGVybiA9IC9eWzEyXVxcZHsxMn0kL1xuY29uc3QgY3VycmVuY3lQYXR0ZXJuVVMgPSAvXlxccHtTY31cXHM/W1xcZCwuXSskL3VpZ1xuY29uc3QgY3VycmVuY3lQYXR0ZXJuRVUgPSAvXltcXGQsLl0rXFxzP1xccHtTY30kL3VpZ1xuY29uc3QgbnVtYmVyaXNoUGF0dGVybiA9IC9eLT9bXFxkLixdKyQvXG5jb25zdCBmbG9hdFBhdHRlcm4gPSAvXFxkXFwuXFxkL1xuLy8gY29uc3QgZW1haWxQYXR0ZXJuID0gL15bXkBdK0BbXkBdezIsfVxcLlteQF17Mix9W14uXSQvXG5jb25zdCBlbWFpbFBhdHRlcm4gPSAvXlxcdysoW1xcLi1dP1xcdyspKkBcXHcrKFtcXC4tXT9cXHcrKSooXFwuXFx3ezIsM30pKyQvXG5jb25zdCBudWxsaXNoUGF0dGVybiA9IC9udWxsL2lcbi8vIGNvbnN0IGVtYWlsUGF0dGVybiA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC9pZ21cblxuZnVuY3Rpb24gaXNCb29saXNoICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDw9IDYgJiYgYm9vbGlzaFBhdHRlcm4udGVzdChTdHJpbmcodmFsdWUpKVxufVxuXG5mdW5jdGlvbiBpc1V1aWQgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIHJldHVybiB2YWx1ZS5sZW5ndGggPCA0MCAmJiB1dWlkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuZnVuY3Rpb24gaXNPYmplY3RJZCAodmFsdWUsIGZpZWxkTmFtZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDQwICYmIG9iamVjdElkUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0RhdGVTdHJpbmcgKHZhbHVlLCBmaWVsZE5hbWUpIHtcbiAgLy8gbm90IGJ1bGxldC1wcm9vZiwgbWVhbnQgdG8gc25pZmYgaW50ZW50aW9uIGluIHRoZSBkYXRhXG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHJldHVybiB0cnVlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA8IDMwICYmIGRhdGVTdHJpbmdQYXR0ZXJuLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGlzVGltZXN0YW1wICh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gU3RyaW5nKHZhbHVlKS50cmltKClcbiAgcmV0dXJuIHRpbWVzdGFtcFBhdHRlcm4udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNDdXJyZW5jeSAodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGNvbnN0IHZhbHVlU3ltYm9sID0gY3VycmVuY2llcy5maW5kKGN1clN5bWJvbCA9PiB2YWx1ZS5pbmRleE9mKGN1clN5bWJvbCkgPiAtMSlcbiAgaWYgKCF2YWx1ZVN5bWJvbCkgcmV0dXJuIGZhbHNlXG4gIHZhbHVlID0gdmFsdWUucmVwbGFjZSh2YWx1ZVN5bWJvbCwgJycpXG4gIHJldHVybiBpc051bWVyaWModmFsdWUpXG4gIC8vIGNvbnNvbGUubG9nKHZhbHVlLCAnY3VycmVuY3lQYXR0ZXJuVVMnLCBjdXJyZW5jeVBhdHRlcm5VUy50ZXN0KHZhbHVlKSwgJ2N1cnJlbmN5UGF0dGVybkVVJywgY3VycmVuY3lQYXR0ZXJuRVUudGVzdCh2YWx1ZSkpO1xuICAvLyByZXR1cm4gY3VycmVuY3lQYXR0ZXJuVVMudGVzdCh2YWx1ZSkgfHwgY3VycmVuY3lQYXR0ZXJuRVUudGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gaXNOdW1lcmljICh2YWx1ZSwgZmllbGROYW1lKSB7XG4gIC8vIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgdmFsdWUgPSBTdHJpbmcodmFsdWUpLnRyaW0oKVxuICByZXR1cm4gdmFsdWUubGVuZ3RoIDwgMzAgJiYgbnVtYmVyaXNoUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc0Zsb2F0aXNoICh2YWx1ZSkge1xuICByZXR1cm4gISEoaXNOdW1lcmljKFN0cmluZyh2YWx1ZSkpICYmIGZsb2F0UGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkpICYmICFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSlcbn1cblxuZnVuY3Rpb24gaXNFbWFpbFNoYXBlZCAodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSkudHJpbSgpXG4gIGlmICh2YWx1ZS5pbmNsdWRlcygnICcpIHx8ICF2YWx1ZS5pbmNsdWRlcygnQCcpKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHZhbHVlLmxlbmd0aCA+PSA1ICYmIHZhbHVlLmxlbmd0aCA8IDgwICYmIGVtYWlsUGF0dGVybi50ZXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiBpc051bGxpc2ggKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCBudWxsaXNoUGF0dGVybi50ZXN0KFN0cmluZyh2YWx1ZSkudHJpbSgpKVxufVxuIiwiaW1wb3J0IHtcbiAgaXNCb29saXNoLFxuICBpc0N1cnJlbmN5LFxuICBpc0RhdGVTdHJpbmcsXG4gIGlzRW1haWxTaGFwZWQsXG4gIGlzRmxvYXRpc2gsXG4gIGlzTnVsbGlzaCxcbiAgaXNOdW1lcmljLFxuICBpc09iamVjdElkLFxuICBpc1RpbWVzdGFtcCxcbiAgaXNVdWlkXG59IGZyb20gJy4vdXRpbHMvdHlwZS1kZXRlY3RvcnMuanMnXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiBUeXBlTmFtZS5cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSAtIGlucHV0IGRhdGFcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZnVuY3Rpb24gZGV0ZWN0VHlwZXMgKHZhbHVlKSB7XG4gIGNvbnN0IGV4Y2x1ZGVkVHlwZXMgPSBbXVxuICBjb25zdCBtYXRjaGVkVHlwZXMgPSBwcmlvcml0aXplZFR5cGVzLnJlZHVjZSgodHlwZXMsIHR5cGVIZWxwZXIpID0+IHtcbiAgICBpZiAodHlwZUhlbHBlci5jaGVjayh2YWx1ZSkpIHtcbiAgICAgIGlmICh0eXBlSGVscGVyLnN1cGVyY2VkZXMpIGV4Y2x1ZGVkVHlwZXMucHVzaCguLi50eXBlSGVscGVyLnN1cGVyY2VkZXMpXG4gICAgICB0eXBlcy5wdXNoKHR5cGVIZWxwZXIudHlwZSlcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVzXG4gIH0sIFtdKVxuICByZXR1cm4gbWF0Y2hlZFR5cGVzLmZpbHRlcih0eXBlID0+IGV4Y2x1ZGVkVHlwZXMuaW5kZXhPZih0eXBlKSA9PT0gLTEpXG59XG5cbi8qKlxuICogTWV0YUNoZWNrcyBhcmUgdXNlZCB0byBhbmFseXplIHRoZSBpbnRlcm1lZGlhdGUgcmVzdWx0cywgYWZ0ZXIgdGhlIEJhc2ljIChkaXNjcmVldCkgdHlwZSBjaGVja3MgYXJlIGNvbXBsZXRlLlxuICogVGhleSBoYXZlIGFjY2VzcyB0byBhbGwgdGhlIGRhdGEgcG9pbnRzIGJlZm9yZSBpdCBpcyBmaW5hbGx5IHByb2Nlc3NlZC5cbiAqL1xuY29uc3QgTWV0YUNoZWNrcyA9IHtcbiAgVFlQRV9FTlVNOiB7XG4gICAgdHlwZTogJ2VudW0nLFxuICAgIG1hdGNoQmFzaWNUeXBlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gICAgY2hlY2s6ICh0eXBlSW5mbywgeyByb3dDb3VudCwgdW5pcXVlcyB9LCB7IGVudW1BYnNvbHV0ZUxpbWl0LCBlbnVtUGVyY2VudFRocmVzaG9sZCB9KSA9PiB7XG4gICAgICBpZiAoIXVuaXF1ZXMgfHwgdW5pcXVlcy5sZW5ndGggPT09IDApIHJldHVybiB0eXBlSW5mb1xuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIHVuaXF1ZW5lc3MgdXNpbmcgQUxMIHVuaXF1ZXMgY29tYmluZWQgZnJvbSBBTEwgdHlwZXMsIHRoaXMgb25seSBzZWVzIGNvbnNpc3RlbnRseSB0eXBlZCBkYXRhXG4gICAgICAvLyBjb25zdCB1bmlxdWVuZXNzID0gcm93Q291bnQgLyB1bmlxdWVzLmxlbmd0aFxuICAgICAgY29uc3QgcmVsYXRpdmVFbnVtTGltaXQgPSBNYXRoLm1pbihwYXJzZUludChTdHJpbmcocm93Q291bnQgKiBlbnVtUGVyY2VudFRocmVzaG9sZCksIDEwKSwgZW51bUFic29sdXRlTGltaXQpXG4gICAgICBpZiAodW5pcXVlcy5sZW5ndGggPiByZWxhdGl2ZUVudW1MaW1pdCkgcmV0dXJuIHR5cGVJbmZvXG4gICAgICAvLyBjb25zdCBlbnVtTGltaXQgPSB1bmlxdWVuZXNzIDwgZW51bUFic29sdXRlTGltaXQgJiYgcmVsYXRpdmVFbnVtTGltaXQgPCBlbnVtQWJzb2x1dGVMaW1pdFxuICAgICAgLy8gICA/IGVudW1BYnNvbHV0ZUxpbWl0XG4gICAgICAvLyAgIDogcmVsYXRpdmVFbnVtTGltaXRcblxuICAgICAgcmV0dXJuIHsgZW51bTogdW5pcXVlcywgLi4udHlwZUluZm8gfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH0sXG4gIFRZUEVfTlVMTEFCTEU6IHtcbiAgICB0eXBlOiAnbnVsbGFibGUnLFxuICAgIC8vIG1hdGNoQmFzaWNUeXBlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gICAgY2hlY2s6ICh0eXBlSW5mbywgeyByb3dDb3VudCwgdW5pcXVlcyB9LCB7IG51bGxhYmxlUm93c1RocmVzaG9sZCB9KSA9PiB7XG4gICAgICBpZiAoIXVuaXF1ZXMgfHwgdW5pcXVlcy5sZW5ndGggPT09IDApIHJldHVybiB0eXBlSW5mb1xuICAgICAgY29uc3QgeyB0eXBlcyB9ID0gdHlwZUluZm9cbiAgICAgIGxldCBudWxsaXNoVHlwZUNvdW50ID0gMFxuICAgICAgaWYgKHR5cGVzLk51bGwpIHtcbiAgICAgICAgbnVsbGlzaFR5cGVDb3VudCArPSB0eXBlcy5OdWxsLmNvdW50XG4gICAgICB9XG4gICAgICBpZiAodHlwZXMuVW5rbm93bikge1xuICAgICAgICBudWxsaXNoVHlwZUNvdW50ICs9IHR5cGVzLlVua25vd24uY291bnRcbiAgICAgIH1cbiAgICAgIGNvbnN0IG51bGxMaW1pdCA9IHJvd0NvdW50ICogbnVsbGFibGVSb3dzVGhyZXNob2xkXG4gICAgICBjb25zdCBpc05vdE51bGxhYmxlID0gbnVsbGlzaFR5cGVDb3VudCA8PSBudWxsTGltaXRcbiAgICAgIC8vIFRPRE86IExvb2sgaW50byBzcGVjaWZpY2FsbHkgY2hlY2tpbmcgJ051bGwnIG9yICdVbmtub3duJyB0eXBlIHN0YXRzXG4gICAgICByZXR1cm4geyBudWxsYWJsZTogIWlzTm90TnVsbGFibGUsIC4uLnR5cGVJbmZvIH1cbiAgICAgIC8vIFRPRE86IGNhbGN1bGF0ZSBlbnRyb3B5IHVzaW5nIGEgc3VtIG9mIGFsbCBub24tbnVsbCBkZXRlY3RlZCB0eXBlcywgbm90IGp1c3QgdHlwZUNvdW50XG4gICAgfVxuICB9LFxuICBUWVBFX1VOSVFVRToge1xuICAgIHR5cGU6ICd1bmlxdWUnLFxuICAgIC8vIG1hdGNoQmFzaWNUeXBlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gICAgY2hlY2s6ICh0eXBlSW5mbywgeyByb3dDb3VudCwgdW5pcXVlcyB9LCB7IHVuaXF1ZVJvd3NUaHJlc2hvbGQgfSkgPT4ge1xuICAgICAgaWYgKCF1bmlxdWVzIHx8IHVuaXF1ZXMubGVuZ3RoID09PSAwKSByZXR1cm4gdHlwZUluZm9cbiAgICAgIC8vIGNvbnN0IHVuaXF1ZW5lc3MgPSByb3dDb3VudCAvIHVuaXF1ZXMubGVuZ3RoXG4gICAgICBjb25zdCBpc1VuaXF1ZSA9IHVuaXF1ZXMubGVuZ3RoID09PSAocm93Q291bnQgKiB1bmlxdWVSb3dzVGhyZXNob2xkKVxuICAgICAgLy8gVE9ETzogTG9vayBpbnRvIHNwZWNpZmljYWxseSBjaGVja2luZyAnTnVsbCcgb3IgJ1Vua25vd24nIHR5cGUgc3RhdHNcbiAgICAgIHJldHVybiB7IHVuaXF1ZTogaXNVbmlxdWUsIC4uLnR5cGVJbmZvIH1cbiAgICAgIC8vIHJldHVybiB7dW5pcXVlOiB1bmlxdWVuZXNzID49IHVuaXF1ZVJvd3NUaHJlc2hvbGQsIC4uLnR5cGVJbmZvfVxuICAgICAgLy8gVE9ETzogY2FsY3VsYXRlIGVudHJvcHkgdXNpbmcgYSBzdW0gb2YgYWxsIG5vbi1udWxsIGRldGVjdGVkIHR5cGVzLCBub3QganVzdCB0eXBlQ291bnRcbiAgICB9XG4gIH1cbn1cblxuLy8gQmFzaWMgVHlwZSBGaWx0ZXJzIC0gcnVkaW1lbnRhcnkgZGF0YSBzbmlmZmluZyB1c2VkIHRvIHRhbGx5IHVwIFwidm90ZXNcIiBmb3IgYSBnaXZlbiBmaWVsZFxuLyoqXG4gKiBEZXRlY3QgYW1iaWd1b3VzIGZpZWxkIHR5cGUuXG4gKiBXaWxsIG5vdCBhZmZlY3Qgd2VpZ2h0ZWQgZmllbGQgYW5hbHlzaXMuXG4gKi9cbmNvbnN0IFRZUEVfVU5LTk9XTiA9IHtcbiAgdHlwZTogJ1Vua25vd24nLFxuICBjaGVjazogdmFsdWUgPT4gdmFsdWUgPT09ICcnIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICd1bmRlZmluZWQnXG59XG5jb25zdCBUWVBFX09CSkVDVF9JRCA9IHtcbiAgdHlwZTogJ09iamVjdElkJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzT2JqZWN0SWRcbn1cbmNvbnN0IFRZUEVfVVVJRCA9IHtcbiAgdHlwZTogJ1VVSUQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZyddLFxuICBjaGVjazogaXNVdWlkXG59XG5jb25zdCBUWVBFX0JPT0xFQU4gPSB7XG4gIHR5cGU6ICdCb29sZWFuJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzQm9vbGlzaFxufVxuY29uc3QgVFlQRV9EQVRFID0ge1xuICB0eXBlOiAnRGF0ZScsXG4gIHN1cGVyY2VkZXM6IFsnU3RyaW5nJ10sXG4gIGNoZWNrOiBpc0RhdGVTdHJpbmdcbn1cbmNvbnN0IFRZUEVfVElNRVNUQU1QID0ge1xuICB0eXBlOiAnVGltZXN0YW1wJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc1RpbWVzdGFtcFxufVxuY29uc3QgVFlQRV9DVVJSRU5DWSA9IHtcbiAgdHlwZTogJ0N1cnJlbmN5JyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnLCAnTnVtYmVyJ10sXG4gIGNoZWNrOiBpc0N1cnJlbmN5XG59XG5jb25zdCBUWVBFX0ZMT0FUID0ge1xuICB0eXBlOiAnRmxvYXQnLFxuICBzdXBlcmNlZGVzOiBbJ1N0cmluZycsICdOdW1iZXInXSxcbiAgY2hlY2s6IGlzRmxvYXRpc2hcbn1cbmNvbnN0IFRZUEVfTlVNQkVSID0ge1xuICB0eXBlOiAnTnVtYmVyJyxcbiAgY2hlY2s6IHZhbHVlID0+IHtcbiAgICByZXR1cm4gISEodmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIChOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBpc051bWVyaWModmFsdWUpKSlcbiAgfVxufVxuY29uc3QgVFlQRV9FTUFJTCA9IHtcbiAgdHlwZTogJ0VtYWlsJyxcbiAgc3VwZXJjZWRlczogWydTdHJpbmcnXSxcbiAgY2hlY2s6IGlzRW1haWxTaGFwZWRcbn1cbmNvbnN0IFRZUEVfU1RSSU5HID0ge1xuICB0eXBlOiAnU3RyaW5nJyxcbiAgY2hlY2s6IHZhbHVlID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUubGVuZ3RoID49IDFcbn1cbmNvbnN0IFRZUEVfQVJSQVkgPSB7XG4gIHR5cGU6ICdBcnJheScsXG4gIGNoZWNrOiB2YWx1ZSA9PiB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpXG4gIH1cbn1cbmNvbnN0IFRZUEVfT0JKRUNUID0ge1xuICB0eXBlOiAnT2JqZWN0JyxcbiAgY2hlY2s6IHZhbHVlID0+IHtcbiAgICByZXR1cm4gIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuICB9XG59XG5jb25zdCBUWVBFX05VTEwgPSB7XG4gIHR5cGU6ICdOdWxsJyxcbiAgY2hlY2s6IGlzTnVsbGlzaFxufVxuXG5jb25zdCBwcmlvcml0aXplZFR5cGVzID0gW1xuICBUWVBFX1VOS05PV04sXG4gIFRZUEVfT0JKRUNUX0lELFxuICBUWVBFX1VVSUQsXG4gIFRZUEVfQk9PTEVBTixcbiAgVFlQRV9EQVRFLFxuICBUWVBFX1RJTUVTVEFNUCxcbiAgVFlQRV9DVVJSRU5DWSxcbiAgVFlQRV9GTE9BVCxcbiAgVFlQRV9OVU1CRVIsXG4gIFRZUEVfTlVMTCxcbiAgVFlQRV9FTUFJTCxcbiAgVFlQRV9TVFJJTkcsXG4gIFRZUEVfQVJSQVksXG4gIFRZUEVfT0JKRUNUXG5dXG5cbi8qKlxuICogVHlwZSBSYW5rIE1hcDogVXNlIHRvIHNvcnQgTG93ZXN0IHRvIEhpZ2hlc3RcbiAqL1xuY29uc3QgdHlwZVJhbmtpbmdzID0ge1xuICBbVFlQRV9VTktOT1dOLnR5cGVdOiAtMSxcbiAgW1RZUEVfT0JKRUNUX0lELnR5cGVdOiAxLFxuICBbVFlQRV9VVUlELnR5cGVdOiAyLFxuICBbVFlQRV9CT09MRUFOLnR5cGVdOiAzLFxuICBbVFlQRV9EQVRFLnR5cGVdOiA0LFxuICBbVFlQRV9USU1FU1RBTVAudHlwZV06IDUsXG4gIFtUWVBFX0NVUlJFTkNZLnR5cGVdOiA2LFxuICBbVFlQRV9GTE9BVC50eXBlXTogNyxcbiAgW1RZUEVfTlVNQkVSLnR5cGVdOiA4LFxuICBbVFlQRV9OVUxMLnR5cGVdOiAxMCxcbiAgW1RZUEVfRU1BSUwudHlwZV06IDExLFxuICBbVFlQRV9TVFJJTkcudHlwZV06IDEyLFxuICBbVFlQRV9BUlJBWS50eXBlXTogMTMsXG4gIFtUWVBFX09CSkVDVC50eXBlXTogMTRcbn1cblxuZXhwb3J0IHtcbiAgdHlwZVJhbmtpbmdzLFxuICBwcmlvcml0aXplZFR5cGVzLFxuICBkZXRlY3RUeXBlcyxcbiAgTWV0YUNoZWNrcyxcbiAgVFlQRV9VTktOT1dOLFxuICBUWVBFX09CSkVDVF9JRCxcbiAgVFlQRV9VVUlELFxuICBUWVBFX0JPT0xFQU4sXG4gIFRZUEVfREFURSxcbiAgVFlQRV9USU1FU1RBTVAsXG4gIFRZUEVfQ1VSUkVOQ1ksXG4gIFRZUEVfRkxPQVQsXG4gIFRZUEVfTlVNQkVSLFxuICBUWVBFX05VTEwsXG4gIFRZUEVfRU1BSUwsXG4gIFRZUEVfU1RSSU5HLFxuICBUWVBFX0FSUkFZLFxuICBUWVBFX09CSkVDVFxufVxuLy8gY29uc3QgVFlQRV9FTlVNID0ge1xuLy8gICB0eXBlOiBcIlN0cmluZ1wiLFxuLy8gICBjaGVjazogKHZhbHVlLCBmaWVsZEluZm8sIHNjaGVtYUluZm8pID0+IHtcbi8vICAgICAvLyBUaHJlc2hvbGQgc2V0IHRvIDUlIC0gNSAob3IgZmV3ZXIpIG91dCBvZiAxMDAgdW5pcXVlIHN0cmluZ3Mgc2hvdWxkIGVuYWJsZSAnZW51bScgbW9kZVxuLy8gICAgIGlmIChzY2hlbWFJbmZvLmlucHV0Um93Q291bnQgPCAxMDApIHJldHVybiBmYWxzZTsgLy8gZGlzYWJsZWQgaWYgc2V0IHRvbyBzbWFsbFxuLy8gICB9XG4vLyB9O1xuIiwiaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuLy8gaW1wb3J0IEZQIGZyb20gJ2Z1bmN0aW9uYWwtcHJvbWlzZXMnO1xuLy8gaW1wb3J0IHsgZGV0ZWN0VHlwZXMgfSBmcm9tICcuL3R5cGUtaGVscGVycy5qcydcbi8vIGltcG9ydCBTdGF0c01hcCBmcm9tICdzdGF0cy1tYXAnO1xuLy8gaW1wb3J0IG1lbSBmcm9tICdtZW0nO1xuaW1wb3J0IHsgZGV0ZWN0VHlwZXMsIE1ldGFDaGVja3MsIHR5cGVSYW5raW5ncyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzLmpzJ1xuY29uc3QgbG9nID0gZGVidWcoJ3NjaGVtYS1idWlsZGVyOmluZGV4Jylcbi8vIGNvbnN0IGNhY2hlID0gbmV3IFN0YXRzTWFwKCk7XG4vLyBjb25zdCBkZXRlY3RUeXBlc0NhY2hlZCA9IG1lbShfZGV0ZWN0VHlwZXMsIHsgY2FjaGUsIG1heEFnZTogMTAwMCAqIDYwMCB9KSAvLyBrZWVwIGNhY2hlIHVwIHRvIDEwIG1pbnV0ZXNcblxuZXhwb3J0IHsgc2NoZW1hQnVpbGRlciwgcGl2b3RGaWVsZERhdGFCeVR5cGUsIGdldE51bWJlclJhbmdlU3RhdHMgfVxuXG4vKipcbiAqIEluY2x1ZGVzIHRoZSByZXN1bHRzIG9mIGlucHV0IGFuYWx5c2lzLlxuICogQHR5cGVkZWYgVHlwZVN1bW1hcnlcbiAqIEB0eXBlIHt7IGZpZWxkczogT2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZVN1bW1hcnk+OyB0b3RhbFJvd3M6IG51bWJlcjsgfX1cbiAqL1xuXG4vKipcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgaW50ZXJtZWRpYXRlIHN0cnVjdHVyZS5cbiAqIEl0IG1pcnJvcnMgdGhlIGBGaWVsZFN1bW1hcnlgIHR5cGUgaXQgd2lsbCBiZWNvbWUuXG4gKiBAcHJpdmF0ZVxuICogQHR5cGVkZWYgRmllbGRUeXBlRGF0YVxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFt2YWx1ZV0gLSBhcnJheSBvZiB2YWx1ZXMsIHByZSBwcm9jZXNzaW5nIGludG8gYW4gQWdncmVnYXRlU3VtbWFyeVxuICogQHByb3BlcnR5IHtudW1iZXJbXX0gW2xlbmd0aF0gLSBhcnJheSBvZiBzdHJpbmcgKG9yIGRlY2ltYWwpIHNpemVzLCBwcmUgcHJvY2Vzc2luZyBpbnRvIGFuIEFnZ3JlZ2F0ZVN1bW1hcnlcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyW119IFtwcmVjaXNpb25dIC0gb25seSBhcHBsaWVzIHRvIEZsb2F0IHR5cGVzLiBBcnJheSBvZiBzaXplcyBvZiB0aGUgdmFsdWUgYm90aCBiZWZvcmUgYW5kIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtudW1iZXJbXX0gW3NjYWxlXSAtIG9ubHkgYXBwbGllcyB0byBGbG9hdCB0eXBlcy4gQXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtjb3VudF0gLSBudW1iZXIgb2YgdGltZXMgdGhlIHR5cGUgd2FzIG1hdGNoZWRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbcmFua10gLSBhYnNvbHV0ZSBwcmlvcml0eSBvZiB0aGUgZGV0ZWN0ZWQgVHlwZU5hbWUsIGRlZmluZWQgaW4gdGhlIG9iamVjdCBgdHlwZVJhbmtpbmdzYFxuICpcbiAqL1xuXG4vKipcbiAqXG4gKiBAdHlwZWRlZiBGaWVsZFR5cGVTdW1tYXJ5XG4gKiBAdHlwZSB7T2JqZWN0fVxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbdmFsdWVdIC0gc3VtbWFyeSBvZiBhcnJheSBvZiB2YWx1ZXMsIHByZSBwcm9jZXNzaW5nIGludG8gYW4gQWdncmVnYXRlU3VtbWFyeVxuICogQHByb3BlcnR5IHtBZ2dyZWdhdGVTdW1tYXJ5fSBbbGVuZ3RoXSAtIHN1bW1hcnkgb2YgYXJyYXkgb2Ygc3RyaW5nIChvciBkZWNpbWFsKSBzaXplcywgcHJlIHByb2Nlc3NpbmcgaW50byBhbiBBZ2dyZWdhdGVTdW1tYXJ5XG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFtwcmVjaXNpb25dIC0gb25seSBhcHBsaWVzIHRvIEZsb2F0IHR5cGVzLiBTdW1tYXJ5IG9mIGFycmF5IG9mIHNpemVzIG9mIHRoZSB2YWx1ZSBib3RoIGJlZm9yZSBhbmQgYWZ0ZXIgdGhlIGRlY2ltYWwuXG4gKiBAcHJvcGVydHkge0FnZ3JlZ2F0ZVN1bW1hcnl9IFtzY2FsZV0gLSBvbmx5IGFwcGxpZXMgdG8gRmxvYXQgdHlwZXMuIFN1bW1hcnkgb2YgYXJyYXkgb2Ygc2l6ZXMgb2YgdGhlIHZhbHVlIGFmdGVyIHRoZSBkZWNpbWFsLlxuICogQHByb3BlcnR5IHtzdHJpbmdbXXxudW1iZXJbXX0gW2VudW1dIC0gaWYgZW51bSBydWxlcyB3ZXJlIHRyaWdnZXJlZCB3aWxsIGNvbnRhaW4gdGhlIGRldGVjdGVkIHVuaXF1ZSB2YWx1ZXMuXG4gKiBAcHJvcGVydHkge251bWJlcn0gY291bnQgLSBudW1iZXIgb2YgdGltZXMgdGhlIHR5cGUgd2FzIG1hdGNoZWRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSByYW5rIC0gYWJzb2x1dGUgcHJpb3JpdHkgb2YgdGhlIGRldGVjdGVkIFR5cGVOYW1lLCBkZWZpbmVkIGluIHRoZSBvYmplY3QgYHR5cGVSYW5raW5nc2BcbiAqXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBGaWVsZEluZm9cbiAqIEB0eXBlIHtvYmplY3R9XG4gKiBAcHJvcGVydHkge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gdHlwZXMgLSBmaWVsZCBzdGF0cyBvcmdhbml6ZWQgYnkgdHlwZVxuICogQHByb3BlcnR5IHtib29sZWFufSBudWxsYWJsZSAtIGlzIHRoZSBmaWVsZCBudWxsYWJsZVxuICogQHByb3BlcnR5IHtib29sZWFufSB1bmlxdWUgLSBpcyB0aGUgZmllbGQgdW5pcXVlXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfG51bWJlcltdfSBbZW51bV0gLSBlbnVtZXJhdGlvbiBkZXRlY3RlZCwgdGhlIHZhbHVlcyBhcmUgbGlzdGVkIG9uIHRoaXMgcHJvcGVydHkuXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIHJlcHJlc2VudCBhIG51bWJlciBzZXJpZXMgb2YgYW55IHNpemUuXG4gKiBJbmNsdWRlcyB0aGUgbG93ZXN0IChgbWluYCksIGhpZ2hlc3QgKGBtYXhgKSwgbWVhbi9hdmVyYWdlIChgbWVhbmApIGFuZCBtZWFzdXJlbWVudHMgYXQgY2VydGFpbiBgcGVyY2VudGlsZXNgLlxuICogQHR5cGVkZWYgQWdncmVnYXRlU3VtbWFyeVxuICogQHR5cGUge3ttaW46IG51bWJlciwgbWF4OiBudW1iZXIsIG1lYW46IG51bWJlciwgcGVyY2VudGlsZXM6IG51bWJlcltdfX1cbiAqL1xuXG4vKipcbiAqIFRoaXMgY2FsbGJhY2sgaXMgZGlzcGxheWVkIGFzIGEgZ2xvYmFsIG1lbWJlci5cbiAqIEBjYWxsYmFjayBwcm9ncmVzc0NhbGxiYWNrXG4gKiBAcGFyYW0ge3t0b3RhbFJvd3M6IG51bWJlciwgY3VycmVudFJvdzogbnVtYmVyfX0gcHJvZ3Jlc3MgLSBUaGUgY3VycmVudCBwcm9ncmVzcyBvZiBwcm9jZXNzaW5nLlxuICovXG5cbi8qKlxuICogc2NoZW1hQnVpbGRlciBpcyB0aGUgbWFpbiBmdW5jdGlvbiBhbmQgd2hlcmUgYWxsIHRoZSBhbmFseXNpcyAmIHByb2Nlc3NpbmcgaGFwcGVucy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gTmFtZSBvZiB0aGUgcmVzb3VyY2UsIFRhYmxlIG9yIGNvbGxlY3Rpb24uXG4gKiBAcGFyYW0ge0FycmF5PE9iamVjdD59IGlucHV0IC0gVGhlIGlucHV0IGRhdGEgdG8gYW5hbHl6ZS4gTXVzdCBiZSBhbiBhcnJheSBvZiBvYmplY3RzLlxuICogQHBhcmFtIHt7IG9uUHJvZ3Jlc3M/OiBwcm9ncmVzc0NhbGxiYWNrLCBlbnVtTWluaW11bVJvd0NvdW50PzogbnVtYmVyLCBlbnVtQWJzb2x1dGVMaW1pdD86IG51bWJlciwgZW51bVBlcmNlbnRUaHJlc2hvbGQ/OiBudW1iZXIsIG51bGxhYmxlUm93c1RocmVzaG9sZD86IG51bWJlciwgdW5pcXVlUm93c1RocmVzaG9sZD86IG51bWJlciB9fSBbb3B0aW9uc10gLSBPcHRpb25hbCBwYXJhbWV0ZXJzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxUeXBlU3VtbWFyeT59IFJldHVybnMgYW5kXG4gKi9cbmZ1bmN0aW9uIHNjaGVtYUJ1aWxkZXIgKFxuICBuYW1lLCBpbnB1dCxcbiAge1xuICAgIG9uUHJvZ3Jlc3MgPSAoeyB0b3RhbFJvd3MsIGN1cnJlbnRSb3cgfSkgPT4ge30sXG4gICAgZW51bU1pbmltdW1Sb3dDb3VudCA9IDEwMCwgZW51bUFic29sdXRlTGltaXQgPSAxMCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgPSAwLjAxLFxuICAgIG51bGxhYmxlUm93c1RocmVzaG9sZCA9IDAuMDIsXG4gICAgdW5pcXVlUm93c1RocmVzaG9sZCA9IDEuMFxuICB9ID0ge1xuICAgIG9uUHJvZ3Jlc3M6ICh7IHRvdGFsUm93cywgY3VycmVudFJvdyB9KSA9PiB7fSxcbiAgICBlbnVtTWluaW11bVJvd0NvdW50OiAxMDAsXG4gICAgZW51bUFic29sdXRlTGltaXQ6IDEwLFxuICAgIGVudW1QZXJjZW50VGhyZXNob2xkOiAwLjAxLFxuICAgIG51bGxhYmxlUm93c1RocmVzaG9sZDogMC4wMixcbiAgICB1bmlxdWVSb3dzVGhyZXNob2xkOiAxLjBcbiAgfVxuKSB7XG4gIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHRocm93IEVycm9yKCdBcmd1bWVudCBgbmFtZWAgbXVzdCBiZSBhIFN0cmluZycpXG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHRocm93IEVycm9yKCdJbnB1dCBEYXRhIG11c3QgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cycpXG4gIGNvbnN0IGlzRW51bUVuYWJsZWQgPSBpbnB1dC5sZW5ndGggPj0gZW51bU1pbmltdW1Sb3dDb3VudFxuXG4gIGxvZygnU3RhcnRpbmcnKVxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGlucHV0KVxuICAgIC50aGVuKHBpdm90Um93c0dyb3VwZWRCeVR5cGUpXG4gICAgLnRoZW4oY29uZGVuc2VGaWVsZERhdGEpXG4gICAgLnRoZW4oc2NoZW1hID0+IHtcbiAgICAgIGxvZygnQnVpbHQgc3VtbWFyeSBmcm9tIEZpZWxkIFR5cGUgZGF0YS4nKVxuICAgICAgLy8gY29uc29sZS5sb2coJ2dlblNjaGVtYScsIEpTT04uc3RyaW5naWZ5KGdlblNjaGVtYSwgbnVsbCwgMikpXG5cbiAgICAgIGNvbnN0IGZpZWxkcyA9IE9iamVjdC5rZXlzKHNjaGVtYS5maWVsZHMpXG4gICAgICAgIC5yZWR1Y2UoKGZpZWxkSW5mbywgZmllbGROYW1lKSA9PiB7XG4gICAgICAgIC8qKiBAdHlwZSB7RmllbGRJbmZvfSAqL1xuICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdID0ge1xuICAgICAgICAgIC8vIG51bGxhYmxlOiBudWxsLFxuICAgICAgICAgIC8vIHVuaXF1ZTogbnVsbCxcbiAgICAgICAgICAgIHR5cGVzOiBzY2hlbWEuZmllbGRzW2ZpZWxkTmFtZV1cbiAgICAgICAgICB9XG4gICAgICAgICAgZmllbGRJbmZvW2ZpZWxkTmFtZV0gPSBNZXRhQ2hlY2tzLlRZUEVfRU5VTS5jaGVjayhmaWVsZEluZm9bZmllbGROYW1lXSxcbiAgICAgICAgICAgIHsgcm93Q291bnQ6IGlucHV0Lmxlbmd0aCwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMgJiYgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB9LFxuICAgICAgICAgICAgeyBlbnVtQWJzb2x1dGVMaW1pdCwgZW51bVBlcmNlbnRUaHJlc2hvbGQgfSlcbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IE1ldGFDaGVja3MuVFlQRV9OVUxMQUJMRS5jaGVjayhmaWVsZEluZm9bZmllbGROYW1lXSxcbiAgICAgICAgICAgIHsgcm93Q291bnQ6IGlucHV0Lmxlbmd0aCwgdW5pcXVlczogc2NoZW1hLnVuaXF1ZXMgJiYgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB9LFxuICAgICAgICAgICAgeyBudWxsYWJsZVJvd3NUaHJlc2hvbGQgfSlcbiAgICAgICAgICBmaWVsZEluZm9bZmllbGROYW1lXSA9IE1ldGFDaGVja3MuVFlQRV9VTklRVUUuY2hlY2soZmllbGRJbmZvW2ZpZWxkTmFtZV0sXG4gICAgICAgICAgICB7IHJvd0NvdW50OiBpbnB1dC5sZW5ndGgsIHVuaXF1ZXM6IHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0gfSxcbiAgICAgICAgICAgIHsgdW5pcXVlUm93c1RocmVzaG9sZCB9KVxuXG4gICAgICAgICAgaWYgKHNjaGVtYS51bmlxdWVzICYmIHNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0pIHtcbiAgICAgICAgICAgIGZpZWxkSW5mb1tmaWVsZE5hbWVdLnVuaXF1ZUNvdW50ID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXS5sZW5ndGhcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpZWxkSW5mb1xuICAgICAgICB9LCB7fSlcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICB0b3RhbFJvd3M6IHNjaGVtYS50b3RhbFJvd3NcbiAgICAgICAgLy8gdW5pcXVlczogdW5pcXVlcyxcbiAgICAgICAgLy8gZmllbGRzOiBzY2hlbWEuZmllbGRzXG4gICAgICB9XG4gICAgfSlcblxuICAvKipcbiAgICogQHBhcmFtIHtvYmplY3RbXX0gZG9jc1xuICAgKiBAcmV0dXJucyB7eyB0b3RhbFJvd3M6IG51bWJlcjsgdW5pcXVlczogeyBbeDogc3RyaW5nXTogYW55W107IH07IGZpZWxkc0RhdGE6IHsgW3g6IHN0cmluZ106IEZpZWxkVHlwZURhdGFbXTsgfTsgfX0gc2NoZW1hXG4gICAqL1xuICBmdW5jdGlvbiBwaXZvdFJvd3NHcm91cGVkQnlUeXBlIChkb2NzKSB7XG4gICAgY29uc3QgZGV0ZWN0ZWRTY2hlbWEgPSB7IHVuaXF1ZXM6IGlzRW51bUVuYWJsZWQgPyB7fSA6IG51bGwsIGZpZWxkc0RhdGE6IHt9LCB0b3RhbFJvd3M6IG51bGwgfVxuICAgIGxvZyhgICBBYm91dCB0byBleGFtaW5lIGV2ZXJ5IHJvdyAmIGNlbGwuIEZvdW5kICR7ZG9jcy5sZW5ndGh9IHJlY29yZHMuLi5gKVxuICAgIGNvbnN0IHBpdm90ZWRTY2hlbWEgPSBkb2NzLnJlZHVjZShldmFsdWF0ZVNjaGVtYUxldmVsLCBkZXRlY3RlZFNjaGVtYSlcbiAgICBsb2coJyAgRXh0cmFjdGVkIGRhdGEgcG9pbnRzIGZyb20gRmllbGQgVHlwZSBhbmFseXNpcycpXG4gICAgcmV0dXJuIHBpdm90ZWRTY2hlbWFcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3sgdG90YWxSb3dzOiBudW1iZXI7IHVuaXF1ZXM6IHsgW3g6IHN0cmluZ106IGFueVtdOyB9OyBmaWVsZHNEYXRhOiB7IFt4OiBzdHJpbmddOiBGaWVsZFR5cGVEYXRhW107IH07IH19IHNjaGVtYVxuICAgKiBAcGFyYW0ge3sgW3g6IHN0cmluZ106IGFueTsgfX0gcm93XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgKiBAcGFyYW0ge2FueVtdfSBhcnJheVxuICAgKi9cbiAgICBmdW5jdGlvbiBldmFsdWF0ZVNjaGVtYUxldmVsIChzY2hlbWEsIHJvdywgaW5kZXgsIGFycmF5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICBzY2hlbWEudG90YWxSb3dzID0gc2NoZW1hLnRvdGFsUm93cyB8fCBhcnJheS5sZW5ndGhcbiAgICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMocm93KVxuICAgIGxvZyhgUHJvY2Vzc2luZyBSb3cgIyAke2luZGV4ICsgMX0vJHtzY2hlbWEudG90YWxSb3dzfS4uLmApXG4gICAgZmllbGROYW1lcy5mb3JFYWNoKChmaWVsZE5hbWUsIGluZGV4LCBhcnJheSkgPT4ge1xuICAgICAgaWYgKGluZGV4ID09PSAwKSBsb2coYEZvdW5kICR7YXJyYXkubGVuZ3RofSBDb2x1bW4ocykhYClcbiAgICAgIGNvbnN0IHR5cGVGaW5nZXJwcmludCA9IGdldEZpZWxkTWV0YWRhdGEoe1xuICAgICAgICBzY2hlbWEsXG4gICAgICAgIGZpZWxkTmFtZSxcbiAgICAgICAgdmFsdWU6IHJvd1tmaWVsZE5hbWVdXG4gICAgICB9KVxuICAgICAgY29uc3QgdHlwZU5hbWVzID0gT2JqZWN0LmtleXModHlwZUZpbmdlcnByaW50KVxuICAgICAgY29uc3QgaXNFbnVtVHlwZSA9IHR5cGVOYW1lcy5pbmNsdWRlcygnTnVtYmVyJykgfHwgdHlwZU5hbWVzLmluY2x1ZGVzKCdTdHJpbmcnKVxuICAgICAgaWYgKGlzRW51bUVuYWJsZWQgJiYgaXNFbnVtVHlwZSkge1xuICAgICAgICBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdID0gc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSB8fCBbXVxuICAgICAgICBpZiAoIXNjaGVtYS51bmlxdWVzW2ZpZWxkTmFtZV0uaW5jbHVkZXMocm93W2ZpZWxkTmFtZV0pKSBzY2hlbWEudW5pcXVlc1tmaWVsZE5hbWVdLnB1c2gocm93W2ZpZWxkTmFtZV0pXG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgc2NoZW1hLnVuaXF1ZXNbZmllbGROYW1lXSA9IG51bGxcbiAgICAgIH1cbiAgICAgIHNjaGVtYS5maWVsZHNEYXRhW2ZpZWxkTmFtZV0gPSBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdIHx8IFtdXG4gICAgICBzY2hlbWEuZmllbGRzRGF0YVtmaWVsZE5hbWVdLnB1c2godHlwZUZpbmdlcnByaW50KVxuICAgIH0pXG4gICAgb25Qcm9ncmVzcyh7IHRvdGFsUm93czogc2NoZW1hLnRvdGFsUm93cywgY3VycmVudFJvdzogaW5kZXggKyAxIH0pXG4gICAgcmV0dXJuIHNjaGVtYVxuICB9XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7eyBmaWVsZHNEYXRhOiBPYmplY3QuPHN0cmluZywgRmllbGRUeXBlRGF0YVtdPiwgdW5pcXVlczogT2JqZWN0LjxzdHJpbmcsIGFueVtdPiwgdG90YWxSb3dzOiBudW1iZXJ9fSBzY2hlbWFcbiAqIEByZXR1cm5zIHt7ZmllbGRzOiBPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT4sIHVuaXF1ZXM6IE9iamVjdC48c3RyaW5nLCBhbnlbXT4sIHRvdGFsUm93czogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29uZGVuc2VGaWVsZERhdGEgKHNjaGVtYSkge1xuICBjb25zdCB7IGZpZWxkc0RhdGEgfSA9IHNjaGVtYVxuICBjb25zdCBmaWVsZE5hbWVzID0gT2JqZWN0LmtleXMoZmllbGRzRGF0YSlcblxuICAvLyBjb25zb2xlLmxvZygnY29uZGVuc2VmaWVsZERhdGEnLCBmaWVsZE5hbWVzKVxuICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gKi9cbiAgY29uc3QgZmllbGRTdW1tYXJ5ID0ge31cbiAgbG9nKGBQcmUtY29uZGVuc2VGaWVsZFNpemVzKGZpZWxkc1tmaWVsZE5hbWVdKSBmb3IgJHtmaWVsZE5hbWVzLmxlbmd0aH0gY29sdW1uc2ApXG4gIGZpZWxkTmFtZXNcbiAgICAuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgICAvKiogQHR5cGUge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVEYXRhPn0gKi9cbiAgICAgIGNvbnN0IHBpdm90ZWREYXRhID0gcGl2b3RGaWVsZERhdGFCeVR5cGUoZmllbGRzRGF0YVtmaWVsZE5hbWVdKVxuICAgICAgZmllbGRTdW1tYXJ5W2ZpZWxkTmFtZV0gPSBjb25kZW5zZUZpZWxkU2l6ZXMocGl2b3RlZERhdGEpXG4gICAgfSlcbiAgbG9nKCdQb3N0LWNvbmRlbnNlRmllbGRTaXplcyhmaWVsZHNbZmllbGROYW1lXSknKVxuICBsb2coJ1JlcGxhY2VkIGZpZWxkRGF0YSB3aXRoIGZpZWxkU3VtbWFyeScpXG4gIHJldHVybiB7IGZpZWxkczogZmllbGRTdW1tYXJ5LCB1bmlxdWVzOiBzY2hlbWEudW5pcXVlcywgdG90YWxSb3dzOiBzY2hlbWEudG90YWxSb3dzIH1cbn1cblxuLyoqXG4gKiBUeXBlTmFtZVxuICogQHJlYWRvbmx5XG4gKiBAZW51bSB7c3RyaW5nfVxuICovXG5jb25zdCBUeXBlTmFtZSA9IHtcbiAgVW5rbm93bjogJ1Vua25vd24nLFxuICBPYmplY3RJZDogJ09iamVjdElkJyxcbiAgVVVJRDogJ1VVSUQnLFxuICBCb29sZWFuOiAnQm9vbGVhbicsXG4gIERhdGU6ICdEYXRlJyxcbiAgVGltZXN0YW1wOiAnVGltZXN0YW1wJyxcbiAgQ3VycmVuY3k6ICdDdXJyZW5jeScsXG4gIEZsb2F0OiAnRmxvYXQnLFxuICBOdW1iZXI6ICdOdW1iZXInLFxuICBFbWFpbDogJ0VtYWlsJyxcbiAgU3RyaW5nOiAnU3RyaW5nJyxcbiAgQXJyYXk6ICdBcnJheScsXG4gIE9iamVjdDogJ09iamVjdCcsXG4gIE51bGw6ICdOdWxsJ1xufVxuXG4vKipcbiAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmcsIHsgdmFsdWU/LCBsZW5ndGg/LCBzY2FsZT8sIHByZWNpc2lvbj8gfT5bXX0gdHlwZVNpemVEYXRhIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlXG4gKiBAcmV0dXJucyB7T2JqZWN0LjxzdHJpbmcsIEZpZWxkVHlwZURhdGE+fVxuICovXG5mdW5jdGlvbiBwaXZvdEZpZWxkRGF0YUJ5VHlwZSAodHlwZVNpemVEYXRhKSB7XG4gIC8vIGNvbnN0IGJsYW5rVHlwZVN1bXMgPSAoKSA9PiAoeyBsZW5ndGg6IDAsIHNjYWxlOiAwLCBwcmVjaXNpb246IDAgfSlcbiAgbG9nKGBQcm9jZXNzaW5nICR7dHlwZVNpemVEYXRhLmxlbmd0aH0gdHlwZSBndWVzc2VzYClcbiAgcmV0dXJuIHR5cGVTaXplRGF0YS5yZWR1Y2UoKHBpdm90ZWREYXRhLCBjdXJyZW50VHlwZUd1ZXNzZXMpID0+IHtcbiAgICBPYmplY3QuZW50cmllcyhjdXJyZW50VHlwZUd1ZXNzZXMpXG4gICAgICAubWFwKChbdHlwZU5hbWUsIHsgdmFsdWUsIGxlbmd0aCwgc2NhbGUsIHByZWNpc2lvbiB9XSkgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2codHlwZU5hbWUsIEpTT04uc3RyaW5naWZ5KHsgbGVuZ3RoLCBzY2FsZSwgcHJlY2lzaW9uIH0pKVxuICAgICAgICBwaXZvdGVkRGF0YVt0eXBlTmFtZV0gPSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0gfHwgeyB0eXBlTmFtZSwgY291bnQ6IDAgfVxuICAgICAgICAvLyBpZiAoIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLmNvdW50ID0gMFxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGxlbmd0aCkgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGgpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGggPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHNjYWxlKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0uc2NhbGUgPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHByZWNpc2lvbikgJiYgIXBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24pIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24gPSBbXVxuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiAhcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlKSBwaXZvdGVkRGF0YVt0eXBlTmFtZV0udmFsdWUgPSBbXVxuXG4gICAgICAgIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5jb3VudCsrXG4gICAgICAgIGlmIChsZW5ndGgpIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5sZW5ndGgucHVzaChsZW5ndGgpXG4gICAgICAgIGlmIChzY2FsZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnNjYWxlLnB1c2goc2NhbGUpXG4gICAgICAgIGlmIChwcmVjaXNpb24pIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5wcmVjaXNpb24ucHVzaChwcmVjaXNpb24pXG4gICAgICAgIGlmICh2YWx1ZSkgcGl2b3RlZERhdGFbdHlwZU5hbWVdLnZhbHVlLnB1c2godmFsdWUpXG4gICAgICAgIC8vIHBpdm90ZWREYXRhW3R5cGVOYW1lXS5yYW5rID0gdHlwZVJhbmtpbmdzW3R5cGVOYW1lXVxuICAgICAgICByZXR1cm4gcGl2b3RlZERhdGFbdHlwZU5hbWVdXG4gICAgICB9KVxuICAgIHJldHVybiBwaXZvdGVkRGF0YVxuICB9LCB7fSlcbiAgLypcbiAgPiBFeGFtcGxlIG9mIHN1bUNvdW50cyBhdCB0aGlzIHBvaW50XG4gIHtcbiAgICBGbG9hdDogeyBjb3VudDogNCwgc2NhbGU6IFsgNSwgNSwgNSwgNSBdLCBwcmVjaXNpb246IFsgMiwgMiwgMiwgMiBdIH0sXG4gICAgU3RyaW5nOiB7IGNvdW50OiAzLCBsZW5ndGg6IFsgMiwgMywgNiBdIH0sXG4gICAgTnVtYmVyOiB7IGNvdW50OiAxLCBsZW5ndGg6IFsgNiBdIH1cbiAgfVxuKi9cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB3aGljaCBhbmFseXplcyBhbmQgc3VtbWFyaXplcyBlYWNoIGNvbHVtbnMgZGF0YSBieSB0eXBlLiBTb3J0IG9mIGEgaGlzdG9ncmFtIG9mIHNpZ25pZmljYW50IHBvaW50cy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVEYXRhPn0gcGl2b3RlZERhdGFCeVR5cGUgLSBhIG1hcCBvcmdhbml6ZWQgYnkgVHlwZSBrZXlzIChgVHlwZU5hbWVgKSwgY29udGFpbmluZyBleHRyYWN0ZWQgZGF0YSBmb3IgdGhlIHJldHVybmVkIGBGaWVsZFN1bW1hcnlgLlxuICogQHJldHVybnMge09iamVjdC48c3RyaW5nLCBGaWVsZFR5cGVTdW1tYXJ5Pn0gLSBUaGUgZmluYWwgb3V0cHV0LCB3aXRoIGhpc3RvZ3JhbXMgb2Ygc2lnbmlmaWNhbnQgcG9pbnRzXG4gKi9cbmZ1bmN0aW9uIGNvbmRlbnNlRmllbGRTaXplcyAocGl2b3RlZERhdGFCeVR5cGUpIHtcbiAgLyoqIEB0eXBlIHtPYmplY3QuPHN0cmluZywgRmllbGRUeXBlU3VtbWFyeT59ICovXG4gIGNvbnN0IGFnZ3JlZ2F0ZVN1bW1hcnkgPSB7fVxuICBsb2coJ1N0YXJ0aW5nIGNvbmRlbnNlRmllbGRTaXplcygpJylcbiAgT2JqZWN0LmtleXMocGl2b3RlZERhdGFCeVR5cGUpXG4gICAgLm1hcCh0eXBlTmFtZSA9PiB7XG4gICAgICBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXSA9IHtcbiAgICAgICAgLy8gdHlwZU5hbWUsXG4gICAgICAgIHJhbms6IHR5cGVSYW5raW5nc1t0eXBlTmFtZV0sXG4gICAgICAgIGNvdW50OiBwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0uY291bnRcbiAgICAgIH1cbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpIGFnZ3JlZ2F0ZVN1bW1hcnlbdHlwZU5hbWVdLnZhbHVlID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0udmFsdWUpXG4gICAgICBpZiAocGl2b3RlZERhdGFCeVR5cGVbdHlwZU5hbWVdLmxlbmd0aCkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0ubGVuZ3RoID0gZ2V0TnVtYmVyUmFuZ2VTdGF0cyhwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ubGVuZ3RoKVxuICAgICAgaWYgKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSkgYWdncmVnYXRlU3VtbWFyeVt0eXBlTmFtZV0uc2NhbGUgPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5zY2FsZSlcbiAgICAgIGlmIChwaXZvdGVkRGF0YUJ5VHlwZVt0eXBlTmFtZV0ucHJlY2lzaW9uKSBhZ2dyZWdhdGVTdW1tYXJ5W3R5cGVOYW1lXS5wcmVjaXNpb24gPSBnZXROdW1iZXJSYW5nZVN0YXRzKHBpdm90ZWREYXRhQnlUeXBlW3R5cGVOYW1lXS5wcmVjaXNpb24pXG4gICAgfSlcbiAgbG9nKCdEb25lIGNvbmRlbnNlRmllbGRTaXplcygpLi4uJylcbiAgcmV0dXJuIGFnZ3JlZ2F0ZVN1bW1hcnlcbn1cblxuZnVuY3Rpb24gZ2V0RmllbGRNZXRhZGF0YSAoe1xuICB2YWx1ZSxcbiAgZmllbGROYW1lLFxuICBzY2hlbWEsIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgcmVjdXJzaXZlID0gZmFsc2Vcbn0pIHtcbiAgLy8gR2V0IGluaXRpYWwgcGFzcyBhdCB0aGUgZGF0YSB3aXRoIHRoZSBUWVBFXyogYC5jaGVjaygpYCBtZXRob2RzLlxuICBjb25zdCB0eXBlR3Vlc3NlcyA9IGRldGVjdFR5cGVzKHZhbHVlKVxuXG4gIC8vIEFzc2lnbiBpbml0aWFsIG1ldGFkYXRhIGZvciBlYWNoIG1hdGNoZWQgdHlwZSBiZWxvd1xuICByZXR1cm4gdHlwZUd1ZXNzZXMucmVkdWNlKChhbmFseXNpcywgdHlwZUd1ZXNzLCByYW5rKSA9PiB7XG4gICAgbGV0IGxlbmd0aFxuICAgIGxldCBwcmVjaXNpb25cbiAgICBsZXQgc2NhbGVcblxuICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IHJhbms6IHJhbmsgKyAxIH1cblxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdGbG9hdCcpIHtcbiAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZSlcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIHZhbHVlIH1cbiAgICAgIGNvbnN0IHNpZ25pZmljYW5kQW5kTWFudGlzc2EgPSBTdHJpbmcodmFsdWUpLnNwbGl0KCcuJylcbiAgICAgIGlmIChzaWduaWZpY2FuZEFuZE1hbnRpc3NhLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBwcmVjaXNpb24gPSBzaWduaWZpY2FuZEFuZE1hbnRpc3NhLmpvaW4oJycpLmxlbmd0aCAvLyB0b3RhbCAjIG9mIG51bWVyaWMgcG9zaXRpb25zIGJlZm9yZSAmIGFmdGVyIGRlY2ltYWxcbiAgICAgICAgc2NhbGUgPSBzaWduaWZpY2FuZEFuZE1hbnRpc3NhWzFdLmxlbmd0aFxuICAgICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCBwcmVjaXNpb24sIHNjYWxlIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVHdWVzcyA9PT0gJ051bWJlcicgfHwgdHlwZUd1ZXNzID09PSAnVGltZXN0YW1wJykge1xuICAgICAgdmFsdWUgPSBOdW1iZXIodmFsdWUpXG4gICAgICBhbmFseXNpc1t0eXBlR3Vlc3NdID0geyAuLi5hbmFseXNpc1t0eXBlR3Vlc3NdLCB2YWx1ZSB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdTdHJpbmcnIHx8IHR5cGVHdWVzcyA9PT0gJ0VtYWlsJykge1xuICAgICAgbGVuZ3RoID0gU3RyaW5nKHZhbHVlKS5sZW5ndGhcbiAgICAgIGFuYWx5c2lzW3R5cGVHdWVzc10gPSB7IC4uLmFuYWx5c2lzW3R5cGVHdWVzc10sIGxlbmd0aCB9XG4gICAgfVxuICAgIGlmICh0eXBlR3Vlc3MgPT09ICdBcnJheScpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aFxuICAgICAgYW5hbHlzaXNbdHlwZUd1ZXNzXSA9IHsgLi4uYW5hbHlzaXNbdHlwZUd1ZXNzXSwgbGVuZ3RoIH1cbiAgICB9XG4gICAgcmV0dXJuIGFuYWx5c2lzXG4gIH0sIHt9KVxufVxuXG4vKipcbiAqIEFjY2VwdHMgYW4gYXJyYXkgb2YgbnVtYmVycyBhbmQgcmV0dXJucyBzdW1tYXJ5IGRhdGEgYWJvdXRcbiAqICB0aGUgcmFuZ2UgJiBzcHJlYWQgb2YgcG9pbnRzIGluIHRoZSBzZXQuXG4gKlxuICogQHBhcmFtIHtudW1iZXJbXX0gbnVtYmVycyAtIHNlcXVlbmNlIG9mIHVuc29ydGVkIGRhdGEgcG9pbnRzXG4gKiBAcmV0dXJucyB7QWdncmVnYXRlU3VtbWFyeX1cbiAqL1xuZnVuY3Rpb24gZ2V0TnVtYmVyUmFuZ2VTdGF0cyAobnVtYmVycykge1xuICBpZiAoIW51bWJlcnMgfHwgbnVtYmVycy5sZW5ndGggPCAxKSByZXR1cm4gdW5kZWZpbmVkXG4gIG51bWJlcnMgPSBudW1iZXJzLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYSA8IGIgPyAtMSA6IGEgPT09IGIgPyAwIDogMSlcbiAgY29uc3Qgc3VtID0gbnVtYmVycy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKVxuICByZXR1cm4ge1xuICAgIG1pbjogbnVtYmVyc1swXSxcbiAgICBtZWFuOiBzdW0gLyBudW1iZXJzLmxlbmd0aCxcbiAgICBtYXg6IG51bWJlcnNbbnVtYmVycy5sZW5ndGggLSAxXSxcbiAgICBwZXJjZW50aWxlczogW1xuICAgICAgbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjMpLCAxMCldLFxuICAgICAgbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjYpLCAxMCldLFxuICAgICAgbnVtYmVyc1twYXJzZUludChTdHJpbmcobnVtYmVycy5sZW5ndGggKiAwLjkpLCAxMCldXG4gICAgXVxuICB9XG59XG4iXSwibmFtZXMiOlsicmVxdWlyZSQkMCIsImdsb2JhbCIsImlzRGF0ZSIsImRlYnVnIl0sIm1hcHBpbmdzIjoiOzs7O0NBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDYixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcs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O0FBQ2xCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDcEMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDcEMsR0FBRztBQUNILEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDckIsRUFBRSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzNCLEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdkMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDMUMsR0FBRztBQUNILEVBQUUsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO0FBQ2xCLElBQUksT0FBTyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDMUMsR0FBRztBQUNILEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLENBQUM7QUFD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RyxTQUFTLENBQUM7QUFDOUIsZUFBZSxHQUFHLFlBQVksRUFBRSxDQUFDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLEdBQUc7QUFDakIsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxTQUFTO0FBQ1YsQ0FBQyxDQUFDO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFNBQVMsR0FBRztBQUNyQjtBQUNBO0FBQ0E7QUFDQSxDQUFDLElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDdkgsRUFBRSxPQUFPLElBQUksQ0FBQztBQUNkLEVBQUU7QUFDRjtBQUNBO0FBQ0EsQ0FBQyxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEVBQUU7QUFDbEksRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNmLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQSxDQUFDLE9BQU8sQ0FBQyxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksUUFBUSxDQUFDLGVBQWUsSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0I7QUFDeko7QUFDQSxHQUFHLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUNySTtBQUNBO0FBQ0EsR0FBRyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN6SjtBQUNBLEdBQUcsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0FBQzdILENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsVUFBVSxDQUFDLElBQUksRUFBRTtBQUMxQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUU7QUFDdEMsRUFBRSxJQUFJLENBQUMsU0FBUztBQUNoQixHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNoQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDVCxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNoQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0M7QUFDQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ3RCLEVBQUUsT0FBTztBQUNULEVBQUU7QUFDRjtBQUNBLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDbEMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLElBQUk7QUFDekMsRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7QUFDdEIsR0FBRyxPQUFPO0FBQ1YsR0FBRztBQUNILEVBQUUsS0FBSyxFQUFFLENBQUM7QUFDVixFQUFFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUN0QjtBQUNBO0FBQ0EsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2pCLEdBQUc7QUFDSCxFQUFFLENBQUMsQ0FBQztBQUNKO0FBQ0EsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDMUIsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUU7QUFDdEI7QUFDQTtBQUNBLENBQUMsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRO0FBQ25DLEVBQUUsT0FBTyxDQUFDLEdBQUc7QUFDYixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDMUIsQ0FBQyxJQUFJO0FBQ0wsRUFBRSxJQUFJLFVBQVUsRUFBRTtBQUNsQixHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNoRCxHQUFHLE1BQU07QUFDVCxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZDLEdBQUc7QUFDSCxFQUFFLENBQUMsT0FBTyxLQUFLLEVBQUU7QUFDakI7QUFDQTtBQUNBLEVBQUU7QUFDRixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLElBQUksR0FBRztBQUNoQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxJQUFJO0FBQ0wsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdkMsRUFBRSxDQUFDLE9BQU8sS0FBSyxFQUFFO0FBQ2pCO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLElBQUksS0FBSyxJQUFJLE9BQU8sRUFBRTtBQUMvRCxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUN4QixFQUFFO0FBQ0Y7QUFDQSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ1YsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsWUFBWSxHQUFHO0FBQ3hCLENBQUMsSUFBSTtBQUNMO0FBQ0E7QUFDQSxFQUFFLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLEVBQUUsQ0FBQyxPQUFPLEtBQUssRUFBRTtBQUNqQjtBQUNBO0FBQ0EsRUFBRTtBQUNGLENBQUM7QUFDRDtBQUNBLGNBQWMsR0FBR0EsTUFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5QztBQUNBLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0FBQ3BDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxFQUFFO0FBQzVCLENBQUMsSUFBSTtBQUNMLEVBQUUsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLEVBQUUsQ0FBQyxPQUFPLEtBQUssRUFBRTtBQUNqQixFQUFFLE9BQU8sOEJBQThCLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUN4RCxFQUFFO0FBQ0YsQ0FBQzs7Ozs7Ozs7O0FDdlFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDO0FBQzlCO0FBQ0E7QUFDQSxJQUFJLFVBQVUsR0FBRyxPQUFPQyxjQUFNLElBQUksUUFBUSxJQUFJQSxjQUFNLElBQUlBLGNBQU0sQ0FBQyxNQUFNLEtBQUssTUFBTSxJQUFJQSxjQUFNLENBQUM7QUFDM0Y7QUFDQTtBQUNBLElBQUksV0FBVyxHQUFHLENBQThCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDO0FBQ3hGO0FBQ0E7QUFDQSxJQUFJLFVBQVUsR0FBRyxXQUFXLElBQUksUUFBYSxJQUFJLFFBQVEsSUFBSSxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQztBQUNsRztBQUNBO0FBQ0EsSUFBSSxhQUFhLEdBQUcsVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEtBQUssV0FBVyxDQUFDO0FBQ3JFO0FBQ0E7QUFDQSxJQUFJLFdBQVcsR0FBRyxhQUFhLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUN0RDtBQUNBO0FBQ0EsSUFBSSxRQUFRLElBQUksV0FBVztBQUMzQixFQUFFLElBQUk7QUFDTixJQUFJLE9BQU8sV0FBVyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDaEIsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNMO0FBQ0E7QUFDQSxJQUFJLFVBQVUsR0FBRyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFO0FBQ3pCLEVBQUUsT0FBTyxTQUFTLEtBQUssRUFBRTtBQUN6QixJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLEdBQUcsQ0FBQztBQUNKLENBQUM7QUFDRDtBQUNBO0FBQ0EsSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGNBQWMsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDM0IsRUFBRSxPQUFPLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQztBQUN0RSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLEdBQUcsVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsR0FBRyxVQUFVLENBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDN0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxDQUFDO0FBQzdDLENBQUM7QUFDRDtBQUNBLGNBQWMsR0FBRyxNQUFNO0dDeEd2QixNQUFNLFVBQVUsR0FBRztBQUNuQixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztBQUM1RCxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztBQUM1RCxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztBQUM1RCxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztBQUM1RCxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO0FBQ3hDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0FBQ3BDLEVBQUM7QUFDRDtBQUNBLE1BQU0sY0FBYyxHQUFHLDJCQUEwQjtBQUNqRCxNQUFNLFdBQVcsR0FBRyxnRkFBK0U7QUFDbkcsTUFBTSxlQUFlLEdBQUcsaUJBQWdCO0FBQ3hDLE1BQU0saUJBQWlCLEdBQUcsMFJBQXlSO0FBQ25ULE1BQU0sZ0JBQWdCLEdBQUcsZUFBYztBQUN2QyxBQUVBLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYTtBQUN0QyxNQUFNLFlBQVksR0FBRyxTQUFRO0FBQzdCO0FBQ0EsTUFBTSxZQUFZLEdBQUcsZ0RBQStDO0FBQ3BFLE1BQU0sY0FBYyxHQUFHLFFBQU87QUFDOUI7QUFDQTtBQUNBLFNBQVMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDdEMsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFDRDtBQUNBLFNBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7QUFDbkMsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3JELENBQUM7QUFDRCxTQUFTLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ3ZDLEVBQUUsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFLE9BQU8sS0FBSztBQUNqQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN6RCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFlBQVksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ3pDO0FBQ0EsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsSUFBSUMsYUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sSUFBSTtBQUNoQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzNELENBQUM7QUFDRDtBQUNBLFNBQVMsV0FBVyxFQUFFLEtBQUssRUFBRTtBQUM3QixFQUFFLElBQUksS0FBSyxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDakMsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRTtBQUM5QixFQUFFLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNyQyxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFVBQVUsRUFBRSxLQUFLLEVBQUU7QUFDNUIsRUFBRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsT0FBTyxLQUFLO0FBQ2pDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUU7QUFDOUIsRUFBRSxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBQ2pGLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEtBQUs7QUFDaEMsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFDO0FBQ3hDLEVBQUUsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3pCO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ3RDO0FBQ0EsRUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRTtBQUM5QixFQUFFLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUMxRCxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFVBQVUsRUFBRSxLQUFLLEVBQUU7QUFDNUIsRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckcsQ0FBQztBQUNEO0FBQ0EsU0FBUyxhQUFhLEVBQUUsS0FBSyxFQUFFO0FBQy9CLEVBQUUsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFLE9BQU8sS0FBSztBQUNqQyxFQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFFO0FBQzlCLEVBQUUsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEtBQUs7QUFDL0QsRUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQzNFLENBQUM7QUFDRDtBQUNBLFNBQVMsU0FBUyxFQUFFLEtBQUssRUFBRTtBQUMzQixFQUFFLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwRSxDQUFDLEFDckZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFdBQVcsRUFBRSxLQUFLLEVBQUU7QUFDN0IsRUFBRSxNQUFNLGFBQWEsR0FBRyxHQUFFO0FBQzFCLEVBQUUsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLFVBQVUsS0FBSztBQUN0RSxJQUFJLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNqQyxNQUFNLElBQUksVUFBVSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLFVBQVUsRUFBQztBQUM3RSxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBQztBQUNqQyxLQUFLO0FBQ0wsSUFBSSxPQUFPLEtBQUs7QUFDaEIsR0FBRyxFQUFFLEVBQUUsRUFBQztBQUNSLEVBQUUsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxVQUFVLEdBQUc7QUFDbkIsRUFBRSxTQUFTLEVBQUU7QUFDYixJQUFJLElBQUksRUFBRSxNQUFNO0FBQ2hCLElBQUksZUFBZSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztBQUN6QyxJQUFJLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLEtBQUs7QUFDN0YsTUFBTSxJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sUUFBUTtBQUMzRDtBQUNBO0FBQ0EsTUFBTSxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsb0JBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxpQkFBaUIsRUFBQztBQUNsSCxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsRUFBRSxPQUFPLFFBQVE7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsUUFBUSxFQUFFO0FBQzNDO0FBQ0EsS0FBSztBQUNMLEdBQUc7QUFDSCxFQUFFLGFBQWEsRUFBRTtBQUNqQixJQUFJLElBQUksRUFBRSxVQUFVO0FBQ3BCO0FBQ0EsSUFBSSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxLQUFLO0FBQzNFLE1BQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxPQUFPLFFBQVE7QUFDM0QsTUFBTSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsU0FBUTtBQUNoQyxNQUFNLElBQUksZ0JBQWdCLEdBQUcsRUFBQztBQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtBQUN0QixRQUFRLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBSztBQUM1QyxPQUFPO0FBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7QUFDekIsUUFBUSxnQkFBZ0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQUs7QUFDL0MsT0FBTztBQUNQLE1BQU0sTUFBTSxTQUFTLEdBQUcsUUFBUSxHQUFHLHNCQUFxQjtBQUN4RCxNQUFNLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixJQUFJLFVBQVM7QUFDekQ7QUFDQSxNQUFNLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxhQUFhLEVBQUUsR0FBRyxRQUFRLEVBQUU7QUFDdEQ7QUFDQSxLQUFLO0FBQ0wsR0FBRztBQUNILEVBQUUsV0FBVyxFQUFFO0FBQ2YsSUFBSSxJQUFJLEVBQUUsUUFBUTtBQUNsQjtBQUNBLElBQUksS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsS0FBSztBQUN6RSxNQUFNLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxRQUFRO0FBQzNEO0FBQ0EsTUFBTSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxNQUFNLFFBQVEsR0FBRyxtQkFBbUIsRUFBQztBQUMxRTtBQUNBLE1BQU0sT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxRQUFRLEVBQUU7QUFDOUM7QUFDQTtBQUNBLEtBQUs7QUFDTCxHQUFHO0FBQ0gsRUFBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sWUFBWSxHQUFHO0FBQ3JCLEVBQUUsSUFBSSxFQUFFLFNBQVM7QUFDakIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssV0FBVztBQUM5RSxFQUFDO0FBQ0QsTUFBTSxjQUFjLEdBQUc7QUFDdkIsRUFBRSxJQUFJLEVBQUUsVUFBVTtBQUNsQixFQUFFLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztBQUN4QixFQUFFLEtBQUssRUFBRSxVQUFVO0FBQ25CLEVBQUM7QUFDRCxNQUFNLFNBQVMsR0FBRztBQUNsQixFQUFFLElBQUksRUFBRSxNQUFNO0FBQ2QsRUFBRSxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7QUFDeEIsRUFBRSxLQUFLLEVBQUUsTUFBTTtBQUNmLEVBQUM7QUFDRCxNQUFNLFlBQVksR0FBRztBQUNyQixFQUFFLElBQUksRUFBRSxTQUFTO0FBQ2pCLEVBQUUsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDO0FBQ3hCLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDbEIsRUFBQztBQUNELE1BQU0sU0FBUyxHQUFHO0FBQ2xCLEVBQUUsSUFBSSxFQUFFLE1BQU07QUFDZCxFQUFFLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztBQUN4QixFQUFFLEtBQUssRUFBRSxZQUFZO0FBQ3JCLEVBQUM7QUFDRCxNQUFNLGNBQWMsR0FBRztBQUN2QixFQUFFLElBQUksRUFBRSxXQUFXO0FBQ25CLEVBQUUsVUFBVSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztBQUNsQyxFQUFFLEtBQUssRUFBRSxXQUFXO0FBQ3BCLEVBQUM7QUFDRCxNQUFNLGFBQWEsR0FBRztBQUN0QixFQUFFLElBQUksRUFBRSxVQUFVO0FBQ2xCLEVBQUUsVUFBVSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztBQUNsQyxFQUFFLEtBQUssRUFBRSxVQUFVO0FBQ25CLEVBQUM7QUFDRCxNQUFNLFVBQVUsR0FBRztBQUNuQixFQUFFLElBQUksRUFBRSxPQUFPO0FBQ2YsRUFBRSxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO0FBQ2xDLEVBQUUsS0FBSyxFQUFFLFVBQVU7QUFDbkIsRUFBQztBQUNELE1BQU0sV0FBVyxHQUFHO0FBQ3BCLEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDaEIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxDQUFDLEVBQUUsS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN2RyxHQUFHO0FBQ0gsRUFBQztBQUNELE1BQU0sVUFBVSxHQUFHO0FBQ25CLEVBQUUsSUFBSSxFQUFFLE9BQU87QUFDZixFQUFFLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztBQUN4QixFQUFFLEtBQUssRUFBRSxhQUFhO0FBQ3RCLEVBQUM7QUFDRCxNQUFNLFdBQVcsR0FBRztBQUNwQixFQUFFLElBQUksRUFBRSxRQUFRO0FBQ2hCLEVBQUUsS0FBSyxFQUFFLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDO0FBQ2hFLEVBQUM7QUFDRCxNQUFNLFVBQVUsR0FBRztBQUNuQixFQUFFLElBQUksRUFBRSxPQUFPO0FBQ2YsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztBQUMvQixHQUFHO0FBQ0gsRUFBQztBQUNELE1BQU0sV0FBVyxHQUFHO0FBQ3BCLEVBQUUsSUFBSSxFQUFFLFFBQVE7QUFDaEIsRUFBRSxLQUFLLEVBQUUsS0FBSyxJQUFJO0FBQ2xCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO0FBQzlFLEdBQUc7QUFDSCxFQUFDO0FBQ0QsTUFBTSxTQUFTLEdBQUc7QUFDbEIsRUFBRSxJQUFJLEVBQUUsTUFBTTtBQUNkLEVBQUUsS0FBSyxFQUFFLFNBQVM7QUFDbEIsRUFBQztBQUNEO0FBQ0EsTUFBTSxnQkFBZ0IsR0FBRztBQUN6QixFQUFFLFlBQVk7QUFDZCxFQUFFLGNBQWM7QUFDaEIsRUFBRSxTQUFTO0FBQ1gsRUFBRSxZQUFZO0FBQ2QsRUFBRSxTQUFTO0FBQ1gsRUFBRSxjQUFjO0FBQ2hCLEVBQUUsYUFBYTtBQUNmLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUUsU0FBUztBQUNYLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUUsVUFBVTtBQUNaLEVBQUUsV0FBVztBQUNiLEVBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU0sWUFBWSxHQUFHO0FBQ3JCLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN6QixFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQzFCLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDckIsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUN4QixFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ3JCLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDMUIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUN6QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ3RCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUM7QUFDdkIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUN0QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ3ZCLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLEVBQUU7QUFDeEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUN2QixFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ3hCLEVBQUM7QUFDRCxBQXFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FDNU5MLE1BQU0sR0FBRyxHQUFHQyxPQUFLLENBQUMsc0JBQXNCLEVBQUM7QUFDekMsQUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxhQUFhO0FBQ3RCLEVBQUUsSUFBSSxFQUFFLEtBQUs7QUFDYixFQUFFO0FBQ0YsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO0FBQ2xELElBQUksbUJBQW1CLEdBQUcsR0FBRyxFQUFFLGlCQUFpQixHQUFHLEVBQUUsRUFBRSxvQkFBb0IsR0FBRyxJQUFJO0FBQ2xGLElBQUkscUJBQXFCLEdBQUcsSUFBSTtBQUNoQyxJQUFJLG1CQUFtQixHQUFHLEdBQUc7QUFDN0IsR0FBRyxHQUFHO0FBQ04sSUFBSSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO0FBQ2pELElBQUksbUJBQW1CLEVBQUUsR0FBRztBQUM1QixJQUFJLGlCQUFpQixFQUFFLEVBQUU7QUFDekIsSUFBSSxvQkFBb0IsRUFBRSxJQUFJO0FBQzlCLElBQUkscUJBQXFCLEVBQUUsSUFBSTtBQUMvQixJQUFJLG1CQUFtQixFQUFFLEdBQUc7QUFDNUIsR0FBRztBQUNILEVBQUU7QUFDRixFQUFFLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLE1BQU0sS0FBSyxDQUFDLGtDQUFrQyxDQUFDO0FBQy9FLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxLQUFLLENBQUMsd0NBQXdDLENBQUM7QUFDbEYsRUFBRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLG9CQUFtQjtBQUMzRDtBQUNBLEVBQUUsR0FBRyxDQUFDLFVBQVUsRUFBQztBQUNqQixFQUFFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDL0IsS0FBSyxJQUFJLENBQUMsc0JBQXNCLENBQUM7QUFDakMsS0FBSyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDNUIsS0FBSyxJQUFJLENBQUMsTUFBTSxJQUFJO0FBQ3BCLE1BQU0sR0FBRyxDQUFDLHFDQUFxQyxFQUFDO0FBQ2hEO0FBQ0E7QUFDQSxNQUFNLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUMvQyxTQUFTLE1BQU0sQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLEtBQUs7QUFDMUM7QUFDQSxVQUFVLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRztBQUNqQztBQUNBO0FBQ0EsWUFBWSxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDM0MsWUFBVztBQUNYLFVBQVUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7QUFDaEYsWUFBWSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDNUYsWUFBWSxFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFFLEVBQUM7QUFDeEQsVUFBVSxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztBQUNwRixZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUM1RixZQUFZLEVBQUUscUJBQXFCLEVBQUUsRUFBQztBQUN0QyxVQUFVLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO0FBQ2xGLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQzVGLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxFQUFDO0FBQ3BDO0FBQ0EsVUFBVSxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUMzRCxZQUFZLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFNO0FBQy9FLFdBQVc7QUFDWCxVQUFVLE9BQU8sU0FBUztBQUMxQixTQUFTLEVBQUUsRUFBRSxFQUFDO0FBQ2Q7QUFDQSxNQUFNLE9BQU87QUFDYixRQUFRLE1BQU07QUFDZCxRQUFRLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztBQUNuQztBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUssQ0FBQztBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFLFNBQVMsc0JBQXNCLEVBQUUsSUFBSSxFQUFFO0FBQ3pDLElBQUksTUFBTSxjQUFjLEdBQUcsRUFBRSxPQUFPLEVBQUUsYUFBYSxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxHQUFFO0FBQ2xHLElBQUksR0FBRyxDQUFDLENBQUMsMkNBQTJDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBQztBQUMvRSxJQUFJLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsY0FBYyxFQUFDO0FBQzFFLElBQUksR0FBRyxDQUFDLGtEQUFrRCxFQUFDO0FBQzNELElBQUksT0FBTyxhQUFhO0FBQ3hCLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksU0FBUyxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDN0QsSUFBSSxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU07QUFDdkQsSUFBSSxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQztBQUN2QyxJQUFJLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUM7QUFDL0QsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEtBQUs7QUFDcEQsTUFBTSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUM7QUFDOUQsTUFBTSxNQUFNLGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQztBQUMvQyxRQUFRLE1BQU07QUFDZCxRQUFRLFNBQVM7QUFDakIsUUFBUSxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUM3QixPQUFPLEVBQUM7QUFDUixNQUFNLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFDO0FBQ3BELE1BQU0sTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBQztBQUNyRixNQUFNLElBQUksYUFBYSxJQUFJLFVBQVUsRUFBRTtBQUN2QyxRQUFRLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFFO0FBQ25FLFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBQztBQUMvRztBQUNBO0FBQ0EsT0FBTztBQUNQLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUU7QUFDdkUsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUM7QUFDeEQsS0FBSyxFQUFDO0FBQ04sSUFBSSxVQUFVLENBQUMsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFDO0FBQ3RFLElBQUksT0FBTyxNQUFNO0FBQ2pCLEdBQUc7QUFDSCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUyxpQkFBaUIsRUFBRSxNQUFNLEVBQUU7QUFDcEMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTTtBQUMvQixFQUFFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBLEVBQUUsTUFBTSxZQUFZLEdBQUcsR0FBRTtBQUN6QixFQUFFLEdBQUcsQ0FBQyxDQUFDLDhDQUE4QyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUM7QUFDbkYsRUFBRSxVQUFVO0FBQ1osS0FBSyxPQUFPLENBQUMsQ0FBQyxTQUFTLEtBQUs7QUFDNUI7QUFDQSxNQUFNLE1BQU0sV0FBVyxHQUFHLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBQztBQUNyRSxNQUFNLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUM7QUFDL0QsS0FBSyxFQUFDO0FBQ04sRUFBRSxHQUFHLENBQUMsNENBQTRDLEVBQUM7QUFDbkQsRUFBRSxHQUFHLENBQUMsc0NBQXNDLEVBQUM7QUFDN0MsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRTtBQUN2RixDQUFDO0FBQ0QsQUFzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsb0JBQW9CLEVBQUUsWUFBWSxFQUFFO0FBQzdDO0FBQ0EsRUFBRSxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBQztBQUN2RCxFQUFFLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxrQkFBa0IsS0FBSztBQUNsRSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7QUFDdEMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEtBQUs7QUFDaEU7QUFDQSxRQUFRLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRTtBQUMvRTtBQUNBLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxHQUFHLEdBQUU7QUFDdkcsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRTtBQUNwRyxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFFO0FBQ2hILFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxHQUFHLEdBQUU7QUFDcEc7QUFDQSxRQUFRLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUU7QUFDckMsUUFBUSxJQUFJLE1BQU0sRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUM7QUFDN0QsUUFBUSxJQUFJLEtBQUssRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7QUFDMUQsUUFBUSxJQUFJLFNBQVMsRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUM7QUFDdEUsUUFBUSxJQUFJLEtBQUssRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUM7QUFDMUQ7QUFDQSxRQUFRLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUNwQyxPQUFPLEVBQUM7QUFDUixJQUFJLE9BQU8sV0FBVztBQUN0QixHQUFHLEVBQUUsRUFBRSxDQUFDO0FBQ1I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUU7QUFDaEQ7QUFDQSxFQUFFLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRTtBQUM3QixFQUFFLEdBQUcsQ0FBQywrQkFBK0IsRUFBQztBQUN0QyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDaEMsS0FBSyxHQUFHLENBQUMsUUFBUSxJQUFJO0FBQ3JCLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEdBQUc7QUFDbkM7QUFDQSxRQUFRLElBQUksRUFBRSxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQ3BDLFFBQVEsS0FBSyxFQUFFLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUs7QUFDaEQsUUFBTztBQUNQLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBQztBQUN0SSxNQUFNLElBQUksaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUM7QUFDekksTUFBTSxJQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFDO0FBQ3RJLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsRUFBQztBQUNsSixLQUFLLEVBQUM7QUFDTixFQUFFLEdBQUcsQ0FBQyw4QkFBOEIsRUFBQztBQUNyQyxFQUFFLE9BQU8sZ0JBQWdCO0FBQ3pCLENBQUM7QUFDRDtBQUNBLFNBQVMsZ0JBQWdCLEVBQUU7QUFDM0IsRUFBRSxLQUFLO0FBQ1AsRUFBRSxTQUFTO0FBQ1gsRUFBRSxNQUFNO0FBQ1IsRUFBRSxTQUFTLEdBQUcsS0FBSztBQUNuQixDQUFDLEVBQUU7QUFDSDtBQUNBLEVBQUUsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssRUFBQztBQUN4QztBQUNBO0FBQ0EsRUFBRSxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLElBQUksS0FBSztBQUMzRCxJQUFJLElBQUksT0FBTTtBQUNkLElBQUksSUFBSSxVQUFTO0FBQ2pCLElBQUksSUFBSSxNQUFLO0FBQ2I7QUFDQSxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxHQUFFO0FBQzVDO0FBQ0EsSUFBSSxJQUFJLFNBQVMsS0FBSyxPQUFPLEVBQUU7QUFDL0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBQztBQUMvQixNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssR0FBRTtBQUM3RCxNQUFNLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUM7QUFDN0QsTUFBTSxJQUFJLHNCQUFzQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDL0MsUUFBUSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU07QUFDMUQsUUFBUSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTTtBQUNoRCxRQUFRLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLEdBQUU7QUFDMUUsT0FBTztBQUNQLEtBQUs7QUFDTCxJQUFJLElBQUksU0FBUyxLQUFLLFFBQVEsSUFBSSxTQUFTLEtBQUssV0FBVyxFQUFFO0FBQzdELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUM7QUFDM0IsTUFBTSxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEdBQUU7QUFDN0QsS0FBSztBQUNMLElBQUksSUFBSSxTQUFTLEtBQUssUUFBUSxJQUFJLFNBQVMsS0FBSyxPQUFPLEVBQUU7QUFDekQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU07QUFDbkMsTUFBTSxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEdBQUU7QUFDOUQsS0FBSztBQUNMLElBQUksSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFO0FBQy9CLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFNO0FBQzNCLE1BQU0sUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxHQUFFO0FBQzlELEtBQUs7QUFDTCxJQUFJLE9BQU8sUUFBUTtBQUNuQixHQUFHLEVBQUUsRUFBRSxDQUFDO0FBQ1IsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLG1CQUFtQixFQUFFLE9BQU8sRUFBRTtBQUN2QyxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsT0FBTyxTQUFTO0FBQ3RELEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ3hFLEVBQUUsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUM7QUFDaEQsRUFBRSxPQUFPO0FBQ1QsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNuQixJQUFJLElBQUksRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU07QUFDOUIsSUFBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLElBQUksV0FBVyxFQUFFO0FBQ2pCLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6RCxNQUFNLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekQsTUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3pELEtBQUs7QUFDTCxHQUFHO0FBQ0gsQ0FBQyJ9
