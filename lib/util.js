var urlRegexp = /^(http|udp|ftp|dht)s?:\/\//;

/**
 * Returns true if str is a URL.
 *
 * @param {String} str
 * @return {Boolean}
 */
exports.isURL = function(str) {
  return urlRegexp.test(str);
};


/**
 * Returns true if n is an integer.
 *
 * @param {Number} n
 * @return {Boolean}
 */
exports.isInteger = function(n) {
  return !isNaN(parseInt(n, 10));
};


/**
 * Splits a path into an array, platform safe.
 *
 * @param {String} path
 * @return {Array.<String>}
 */
exports.splitPath = function(path) {
  return path.split(path.sep);
};


/**
 * Returns true if part of buffer `b` beginning at `start` matches buffer `a`.
 *
 * @param {Buffer} a
 * @param {Buffer} b
 * @param {Number} start
 */
exports.buffersMatch = function(a, b, start) {
  for (var i = 0, l = b.length; i < l; i++) {
    if (a[start + i] !== b[i]) {
      return false;
    }
  }

  return true;
};

function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

/**
 * Returns true if n is an object.
 *
 * @param {Object} n
 * @return {Boolean}
 */
exports.isObject = isType("Object")

/**
 * Returns true if n is a string.
 *
 * @param {String} n
 * @return {Boolean}
 */
exports.isString = isType("String")

/**
 * Returns true if n is an array.
 *
 * @param {array} n
 * @return {Boolean}
 */
exports.isArray = Array.isArray || isType("Array")

/**
 * Returns true if n is an function.
 *
 * @param {Function} n
 * @return {Boolean}
 */
exports.isFunction = isType("Function")

/**
 * Returns true if n is an undefined.
 *
 * @param {undefined} n
 * @return {Boolean}
 */
exports.isUndefined = isType("Undefined")