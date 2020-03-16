(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.LDClient = {})));
}(this, (function (exports) { 'use strict';

  var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  function createCustomError(name) {
    function CustomError(message, code) {
      Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
      this.message = message;
      this.code = code;
    }

    CustomError.prototype = new Error();
    CustomError.prototype.name = name;
    CustomError.prototype.constructor = CustomError;

    return CustomError;
  }

  var LDUnexpectedResponseError = createCustomError('LaunchDarklyUnexpectedResponseError');
  var LDInvalidEnvironmentIdError = createCustomError('LaunchDarklyInvalidEnvironmentIdError');
  var LDInvalidUserError = createCustomError('LaunchDarklyInvalidUserError');
  var LDInvalidEventKeyError = createCustomError('LaunchDarklyInvalidEventKeyError');
  var LDInvalidArgumentError = createCustomError('LaunchDarklyInvalidArgumentError');
  var LDFlagFetchError = createCustomError('LaunchDarklyFlagFetchError');

  function isHttpErrorRecoverable(status) {
    if (status >= 400 && status < 500) {
      return status === 400 || status === 408 || status === 429;
    }
    return true;
  }

  var errors = /*#__PURE__*/Object.freeze({
    LDUnexpectedResponseError: LDUnexpectedResponseError,
    LDInvalidEnvironmentIdError: LDInvalidEnvironmentIdError,
    LDInvalidUserError: LDInvalidUserError,
    LDInvalidEventKeyError: LDInvalidEventKeyError,
    LDInvalidArgumentError: LDInvalidArgumentError,
    LDFlagFetchError: LDFlagFetchError,
    isHttpErrorRecoverable: isHttpErrorRecoverable
  });

  var fromByteArray_1 = fromByteArray;

  var lookup = [];
  var revLookup = [];

  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  // Support decoding URL-safe base64 strings, as Node.js does.
  // See: https://en.wikipedia.org/wiki/Base64#URL_applications
  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;

  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
      output.push(tripletToBase64(tmp));
    }
    return output.join('');
  }

  function fromByteArray(uint8) {
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
    }

    return parts.join('');
  }

  var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
    return typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
  };

  var isArray = Array.isArray;
  var keyList = Object.keys;
  var hasProp = Object.prototype.hasOwnProperty;

  var fastDeepEqual = function equal(a, b) {
    if (a === b) return true;

    if (a && b && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) == 'object' && (typeof b === 'undefined' ? 'undefined' : _typeof(b)) == 'object') {
      var arrA = isArray(a),
          arrB = isArray(b),
          i,
          length,
          key;

      if (arrA && arrB) {
        length = a.length;
        if (length != b.length) return false;
        for (i = length; i-- !== 0;) {
          if (!equal(a[i], b[i])) return false;
        }return true;
      }

      if (arrA != arrB) return false;

      var dateA = a instanceof Date,
          dateB = b instanceof Date;
      if (dateA != dateB) return false;
      if (dateA && dateB) return a.getTime() == b.getTime();

      var regexpA = a instanceof RegExp,
          regexpB = b instanceof RegExp;
      if (regexpA != regexpB) return false;
      if (regexpA && regexpB) return a.toString() == b.toString();

      var keys = keyList(a);
      length = keys.length;

      if (length !== keyList(b).length) return false;

      for (i = length; i-- !== 0;) {
        if (!hasProp.call(b, keys[i])) return false;
      }for (i = length; i-- !== 0;) {
        key = keys[i];
        if (!equal(a[key], b[key])) return false;
      }

      return true;
    }

    return a !== a && b !== b;
  };

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }return target;
  };

  var userAttrsToStringify = ['key', 'secondary', 'ip', 'country', 'email', 'firstName', 'lastName', 'avatar', 'name'];

  // See http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
  function btoa(s) {
    var escaped = unescape(encodeURIComponent(s));
    return fromByteArray_1(stringToBytes(escaped));
  }

  function stringToBytes(s) {
    var b = [];
    for (var i = 0; i < s.length; i++) {
      b.push(s.charCodeAt(i));
    }
    return b;
  }

  function base64URLEncode(s) {
    return btoa(s)
    // eslint-disable-next-line
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function deepEquals(a, b) {
    return fastDeepEqual(a, b);
  }

  // Events emitted in LDClient's initialize method will happen before the consumer
  // can register a listener, so defer them to next tick.
  function onNextTick(cb) {
    setTimeout(cb, 0);
  }

  /**
   * Wrap a promise to invoke an optional callback upon resolution or rejection.
   *
   * This function assumes the callback follows the Node.js callback type: (err, value) => void
   *
   * If a callback is provided:
   *   - if the promise is resolved, invoke the callback with (null, value)
   *   - if the promise is rejected, invoke the callback with (error, null)
   *
   * @param {Promise<any>} promise
   * @param {Function} callback
   * @returns Promise<any> | undefined
   */
  function wrapPromiseCallback(promise, callback) {
    var ret = promise.then(function (value) {
      if (callback) {
        setTimeout(function () {
          callback(null, value);
        }, 0);
      }
      return value;
    }, function (error) {
      if (callback) {
        setTimeout(function () {
          callback(error, null);
        }, 0);
      } else {
        return Promise.reject(error);
      }
    });

    return !callback ? ret : undefined;
  }

  /**
   * Takes a map of flag keys to values, and returns the more verbose structure used by the
   * client stream.
   */
  function transformValuesToVersionedValues(flags) {
    var ret = {};
    for (var key in flags) {
      if (flags.hasOwnProperty(key)) {
        ret[key] = { value: flags[key], version: 0 };
      }
    }
    return ret;
  }

  /**
   * Converts the internal flag state map to a simple map of flag keys to values.
   */
  function transformVersionedValuesToValues(flagsState) {
    var ret = {};
    for (var key in flagsState) {
      if (flagsState.hasOwnProperty(key)) {
        ret[key] = flagsState[key].value;
      }
    }
    return ret;
  }

  /**
   * Returns an array of event groups each of which can be safely URL-encoded
   * without hitting the safe maximum URL length of certain browsers.
   *
   * @param {number} maxLength maximum URL length targeted
   * @param {Array[Object}]} events queue of events to divide
   * @returns Array[Array[Object]]
   */
  function chunkUserEventsForUrl(maxLength, events) {
    var allEvents = events.slice(0);
    var allChunks = [];
    var remainingSpace = maxLength;
    var chunk = void 0;

    while (allEvents.length > 0) {
      chunk = [];

      while (remainingSpace > 0) {
        var event = allEvents.shift();
        if (!event) {
          break;
        }
        remainingSpace = remainingSpace - base64URLEncode(JSON.stringify(event)).length;
        // If we are over the max size, put this one back on the queue
        // to try in the next round, unless this event alone is larger
        // than the limit, in which case, screw it, and try it anyway.
        if (remainingSpace < 0 && chunk.length > 0) {
          allEvents.unshift(event);
        } else {
          chunk.push(event);
        }
      }

      remainingSpace = maxLength;
      allChunks.push(chunk);
    }

    return allChunks;
  }

  function getLDUserAgentString(platform) {
    var version = platform.version || "2.10.2";
    return platform.userAgent + '/' + version;
  }

  function getLDHeaders(platform) {
    return {
      'X-LaunchDarkly-User-Agent': getLDUserAgentString(platform)
    };
  }

  function extend() {
    for (var _len = arguments.length, objects = Array(_len), _key = 0; _key < _len; _key++) {
      objects[_key] = arguments[_key];
    }

    return objects.reduce(function (acc, obj) {
      return _extends({}, acc, obj);
    }, {});
  }

  function sanitizeUser(user) {
    if (!user) {
      return user;
    }
    var newUser = void 0;
    for (var i in userAttrsToStringify) {
      var attr = userAttrsToStringify[i];
      var value = user[attr];
      if (value !== undefined && typeof value !== 'string') {
        newUser = newUser || Object.assign({}, user);
        newUser[attr] = String(value);
      }
    }
    return newUser || user;
  }

  var utils = /*#__PURE__*/Object.freeze({
    btoa: btoa,
    base64URLEncode: base64URLEncode,
    clone: clone,
    deepEquals: deepEquals,
    onNextTick: onNextTick,
    wrapPromiseCallback: wrapPromiseCallback,
    transformValuesToVersionedValues: transformValuesToVersionedValues,
    transformVersionedValuesToValues: transformVersionedValuesToValues,
    chunkUserEventsForUrl: chunkUserEventsForUrl,
    getLDUserAgentString: getLDUserAgentString,
    getLDHeaders: getLDHeaders,
    extend: extend,
    sanitizeUser: sanitizeUser
  });

  var MAX_URL_LENGTH = 2000;

  function EventSender(platform, eventsUrl, environmentId, imageCreator) {
    var postUrl = eventsUrl + '/events/bulk/' + environmentId;
    var imageUrl = eventsUrl + '/a/' + environmentId + '.gif';
    var sender = {};

    function loadUrlUsingImage(src) {
      var img = new window.Image();
      img.src = src;
    }

    function getResponseInfo(result) {
      var ret = { status: result.status };
      var dateStr = result.header('date');
      if (dateStr) {
        var time = Date.parse(dateStr);
        if (time) {
          ret.serverTime = time;
        }
      }
      return ret;
    }

    function sendChunk(events, usePost) {
      var createImage = imageCreator || loadUrlUsingImage;
      var jsonBody = JSON.stringify(events);

      function doPostRequest(canRetry) {
        var headers = extend({
          'Content-Type': 'application/json',
          'X-LaunchDarkly-Event-Schema': '3'
        }, getLDHeaders(platform));
        return platform.httpRequest('POST', postUrl, headers, jsonBody).promise.then(function (result) {
          if (!result) {
            // This was a response from a fire-and-forget request, so we won't have a status.
            return;
          }
          if (result.status >= 400 && isHttpErrorRecoverable(result.status) && canRetry) {
            return doPostRequest(false);
          } else {
            return getResponseInfo(result);
          }
        }).catch(function () {
          if (canRetry) {
            return doPostRequest(false);
          }
          return Promise.reject();
        });
      }

      if (usePost) {
        return doPostRequest(true).catch(function () {});
      } else {
        var src = imageUrl + '?d=' + base64URLEncode(jsonBody);
        createImage(src);
        return Promise.resolve();
        // We do not specify an onload handler for the image because we don't want the client to wait around
        // for the image to load - it won't provide a server response, there's nothing to be done.
      }
    }

    sender.sendEvents = function (events) {
      if (!platform.httpRequest) {
        return Promise.resolve();
      }
      var canPost = platform.httpAllowsPost();
      var chunks = void 0;
      if (canPost) {
        // no need to break up events into chunks if we can send a POST
        chunks = [events];
      } else {
        chunks = chunkUserEventsForUrl(MAX_URL_LENGTH - eventsUrl.length, events);
      }
      var results = [];
      for (var i = 0; i < chunks.length; i++) {
        results.push(sendChunk(chunks[i], canPost));
      }
      return Promise.all(results);
    };

    return sender;
  }

  function EventSummarizer() {
    var es = {};

    var startDate = 0,
        endDate = 0,
        counters = {};

    es.summarizeEvent = function (event) {
      if (event.kind === 'feature') {
        var counterKey = event.key + ':' + (event.variation !== null && event.variation !== undefined ? event.variation : '') + ':' + (event.version !== null && event.version !== undefined ? event.version : '');
        var counterVal = counters[counterKey];
        if (counterVal) {
          counterVal.count = counterVal.count + 1;
        } else {
          counters[counterKey] = {
            count: 1,
            key: event.key,
            variation: event.variation,
            version: event.version,
            value: event.value,
            default: event.default
          };
        }
        if (startDate === 0 || event.creationDate < startDate) {
          startDate = event.creationDate;
        }
        if (event.creationDate > endDate) {
          endDate = event.creationDate;
        }
      }
    };

    es.getSummary = function () {
      var flagsOut = {};
      var empty = true;
      for (var i in counters) {
        var c = counters[i];
        var flag = flagsOut[c.key];
        if (!flag) {
          flag = {
            default: c.default,
            counters: []
          };
          flagsOut[c.key] = flag;
        }
        var counterOut = {
          value: c.value,
          count: c.count
        };
        if (c.variation !== undefined && c.variation !== null) {
          counterOut.variation = c.variation;
        }
        if (c.version) {
          counterOut.version = c.version;
        } else {
          counterOut.unknown = true;
        }
        flag.counters.push(counterOut);
        empty = false;
      }
      return empty ? null : {
        startDate: startDate,
        endDate: endDate,
        features: flagsOut
      };
    };

    es.clearSummary = function () {
      startDate = 0;
      endDate = 0;
      counters = {};
    };

    return es;
  }

  /**
   * The UserFilter object transforms user objects into objects suitable to be sent as JSON to
   * the server, hiding any private user attributes.
   *
   * @param {Object} the LaunchDarkly client configuration object
   **/
  function UserFilter(config) {
    var filter = {};
    var allAttributesPrivate = config.allAttributesPrivate;
    var privateAttributeNames = config.privateAttributeNames || [];
    var ignoreAttrs = { key: true, custom: true, anonymous: true };
    var allowedTopLevelAttrs = {
      key: true,
      secondary: true,
      ip: true,
      country: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      name: true,
      anonymous: true,
      custom: true
    };

    filter.filterUser = function (user) {
      if (!user) {
        return null;
      }
      var userPrivateAttrs = user.privateAttributeNames || [];

      var isPrivateAttr = function isPrivateAttr(name) {
        return !ignoreAttrs[name] && (allAttributesPrivate || userPrivateAttrs.indexOf(name) !== -1 || privateAttributeNames.indexOf(name) !== -1);
      };
      var filterAttrs = function filterAttrs(props, isAttributeAllowed) {
        return Object.keys(props).reduce(function (acc, name) {
          var ret = acc;
          if (isAttributeAllowed(name)) {
            if (isPrivateAttr(name)) {
              // add to hidden list
              ret[1][name] = true;
            } else {
              ret[0][name] = props[name];
            }
          }
          return ret;
        }, [{}, {}]);
      };
      var result = filterAttrs(user, function (key) {
        return allowedTopLevelAttrs[key];
      });
      var filteredProps = result[0];
      var removedAttrs = result[1];
      if (user.custom) {
        var customResult = filterAttrs(user.custom, function () {
          return true;
        });
        filteredProps.custom = customResult[0];
        removedAttrs = extend({}, removedAttrs, customResult[1]);
      }
      var removedAttrNames = Object.keys(removedAttrs);
      if (removedAttrNames.length) {
        removedAttrNames.sort();
        filteredProps.privateAttrs = removedAttrNames;
      }
      return filteredProps;
    };
    return filter;
  }

  var clientInitialized = function clientInitialized() {
    return 'LaunchDarkly client initialized';
  };

  var docLink = ' Please see https://docs.launchdarkly.com/docs/js-sdk-reference#section-initializing-the-client for instructions on SDK initialization.';

  var clientNotReady = function clientNotReady() {
    return 'LaunchDarkly client is not ready';
  };

  var eventWithoutUser = function eventWithoutUser() {
    return 'Be sure to call `identify` in the LaunchDarkly client: http://docs.launchdarkly.com/docs/running-an-ab-test#include-the-client-side-snippet';
  };

  var invalidKey = function invalidKey() {
    return 'Event key must be a string';
  };

  var localStorageUnavailable = function localStorageUnavailable() {
    return 'localStorage is unavailable';
  };

  var localStorageUnavailableForUserId = function localStorageUnavailableForUserId() {
    return 'localStorage is unavailable, so anonymous user ID cannot be cached';
  };

  var networkError = function networkError(e) {
    return 'network error' + (e ? ' (' + e + ')' : '');
  };

  var unknownCustomEventKey = function unknownCustomEventKey(key) {
    return 'Custom event "' + key + '" does not exist';
  };

  var environmentNotFound = function environmentNotFound() {
    return 'environment not found.' + docLink;
  };

  var environmentNotSpecified = function environmentNotSpecified() {
    return 'No environment specified.' + docLink;
  };

  var errorFetchingFlags = function errorFetchingFlags(err) {
    return 'Error fetching flag settings: ' + (err.message || err);
  };

  var userNotSpecified = function userNotSpecified() {
    return 'No user specified.' + docLink;
  };

  var invalidUser = function invalidUser() {
    return 'Invalid user specified.' + docLink;
  };

  var bootstrapOldFormat = function bootstrapOldFormat() {
    return 'LaunchDarkly client was initialized with bootstrap data that did not include flag metadata. ' + 'Events may not be sent correctly.' + docLink;
  };

  var bootstrapInvalid = function bootstrapInvalid() {
    return 'LaunchDarkly bootstrap data is not available because the back end could not read the flags.';
  };

  var deprecated = function deprecated(oldName, newName) {
    return '[LaunchDarkly] "' + oldName + '" is deprecated, please use "' + newName + '"';
  };

  var httpErrorMessage = function httpErrorMessage(status, context, retryMessage) {
    return 'Received error ' + status + (status === 401 ? ' (invalid SDK key)' : '') + ' for ' + context + ' - ' + (isHttpErrorRecoverable(status) ? retryMessage : 'giving up permanently');
  };

  var httpUnavailable = function httpUnavailable() {
    return 'Cannot make HTTP requests in this environment.' + docLink;
  };

  var identifyDisabled = function identifyDisabled() {
    return 'identify() has no effect here; it must be called on the main client instance';
  };

  var debugPolling = function debugPolling(url) {
    return 'polling for feature flags at ' + url;
  };

  var debugStreamPing = function debugStreamPing() {
    return 'received ping message from stream';
  };

  var debugStreamPut = function debugStreamPut() {
    return 'received streaming update for all flags';
  };

  var debugStreamPatch = function debugStreamPatch(key) {
    return 'received streaming update for flag "' + key + '"';
  };

  var debugStreamPatchIgnored = function debugStreamPatchIgnored(key) {
    return 'received streaming update for flag "' + key + '" but ignored due to version check';
  };

  var debugStreamDelete = function debugStreamDelete(key) {
    return 'received streaming deletion for flag "' + key + '"';
  };

  var debugStreamDeleteIgnored = function debugStreamDeleteIgnored(key) {
    return 'received streaming deletion for flag "' + key + '" but ignored due to version check';
  };

  var debugEnqueueingEvent = function debugEnqueueingEvent(kind) {
    return 'enqueueing "' + kind + '" event';
  };

  var debugPostingEvents = function debugPostingEvents(count) {
    return 'sending ' + count + ' events';
  };

  var messages = /*#__PURE__*/Object.freeze({
    clientInitialized: clientInitialized,
    clientNotReady: clientNotReady,
    eventWithoutUser: eventWithoutUser,
    invalidKey: invalidKey,
    localStorageUnavailable: localStorageUnavailable,
    localStorageUnavailableForUserId: localStorageUnavailableForUserId,
    networkError: networkError,
    unknownCustomEventKey: unknownCustomEventKey,
    environmentNotFound: environmentNotFound,
    environmentNotSpecified: environmentNotSpecified,
    errorFetchingFlags: errorFetchingFlags,
    userNotSpecified: userNotSpecified,
    invalidUser: invalidUser,
    bootstrapOldFormat: bootstrapOldFormat,
    bootstrapInvalid: bootstrapInvalid,
    deprecated: deprecated,
    httpErrorMessage: httpErrorMessage,
    httpUnavailable: httpUnavailable,
    identifyDisabled: identifyDisabled,
    debugPolling: debugPolling,
    debugStreamPing: debugStreamPing,
    debugStreamPut: debugStreamPut,
    debugStreamPatch: debugStreamPatch,
    debugStreamPatchIgnored: debugStreamPatchIgnored,
    debugStreamDelete: debugStreamDelete,
    debugStreamDeleteIgnored: debugStreamDeleteIgnored,
    debugEnqueueingEvent: debugEnqueueingEvent,
    debugPostingEvents: debugPostingEvents
  });

  function EventProcessor(platform, options, environmentId, logger) {
    var emitter = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var sender = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

    var processor = {};
    var eventSender = sender || EventSender(platform, options.eventsUrl, environmentId);
    var summarizer = EventSummarizer();
    var userFilter = UserFilter(options);
    var inlineUsers = options.inlineUsersInEvents;
    var samplingInterval = options.samplingInterval;
    var flushInterval = options.flushInterval;
    var queue = [];
    var lastKnownPastTime = 0;
    var disabled = false;
    var flushTimer = void 0;

    function shouldSampleEvent() {
      return samplingInterval === 0 || Math.floor(Math.random() * samplingInterval) === 0;
    }

    function shouldDebugEvent(e) {
      if (e.debugEventsUntilDate) {
        // The "last known past time" comes from the last HTTP response we got from the server.
        // In case the client's time is set wrong, at least we know that any expiration date
        // earlier than that point is definitely in the past.  If there's any discrepancy, we
        // want to err on the side of cutting off event debugging sooner.
        return e.debugEventsUntilDate > lastKnownPastTime && e.debugEventsUntilDate > new Date().getTime();
      }
      return false;
    }

    // Transform an event from its internal format to the format we use when sending a payload.
    function makeOutputEvent(e) {
      var ret = extend({}, e);
      if (inlineUsers || e.kind === 'identify') {
        // identify events always have an inline user
        ret.user = userFilter.filterUser(e.user);
      } else {
        ret.userKey = e.user.key;
        delete ret['user'];
      }
      if (e.kind === 'feature') {
        delete ret['trackEvents'];
        delete ret['debugEventsUntilDate'];
      }
      return ret;
    }

    processor.enqueue = function (event) {
      if (disabled) {
        return;
      }
      var addFullEvent = false;
      var addDebugEvent = false;

      // Add event to the summary counters if appropriate
      summarizer.summarizeEvent(event);

      // Decide whether to add the event to the payload. Feature events may be added twice, once for
      // the event (if tracked) and once for debugging.
      if (event.kind === 'feature') {
        if (shouldSampleEvent()) {
          addFullEvent = !!event.trackEvents;
          addDebugEvent = shouldDebugEvent(event);
        }
      } else {
        addFullEvent = shouldSampleEvent();
      }

      if (addFullEvent) {
        queue.push(makeOutputEvent(event));
      }
      if (addDebugEvent) {
        var debugEvent = extend({}, event, { kind: 'debug' });
        delete debugEvent['trackEvents'];
        delete debugEvent['debugEventsUntilDate'];
        delete debugEvent['variation'];
        queue.push(debugEvent);
      }
    };

    processor.flush = function () {
      if (disabled) {
        return Promise.resolve();
      }
      var eventsToSend = queue;
      var summary = summarizer.getSummary();
      summarizer.clearSummary();
      if (summary) {
        summary.kind = 'summary';
        eventsToSend.push(summary);
      }
      if (eventsToSend.length === 0) {
        return Promise.resolve();
      }
      queue = [];
      logger.debug(debugPostingEvents(eventsToSend.length));
      return eventSender.sendEvents(eventsToSend).then(function (responseInfo) {
        if (responseInfo) {
          if (responseInfo.serverTime) {
            lastKnownPastTime = responseInfo.serverTime;
          }
          if (!isHttpErrorRecoverable(responseInfo.status)) {
            disabled = true;
          }
          if (responseInfo.status >= 400) {
            onNextTick(function () {
              emitter.maybeReportError(new LDUnexpectedResponseError(httpErrorMessage(responseInfo.status, 'event posting', 'some events were dropped')));
            });
          }
        }
      });
    };

    processor.start = function () {
      var flushTick = function flushTick() {
        processor.flush();
        flushTimer = setTimeout(flushTick, flushInterval);
      };
      flushTimer = setTimeout(flushTick, flushInterval);
    };

    processor.stop = function () {
      clearTimeout(flushTimer);
    };

    return processor;
  }

  function EventEmitter(logger) {
    var emitter = {};
    var events = {};

    var listeningTo = function listeningTo(event) {
      return !!events[event];
    };

    emitter.on = function (event, handler, context) {
      events[event] = events[event] || [];
      events[event] = events[event].concat({
        handler: handler,
        context: context
      });
    };

    emitter.off = function (event, handler, context) {
      if (!events[event]) {
        return;
      }
      for (var i = 0; i < events[event].length; i++) {
        if (events[event][i].handler === handler && events[event][i].context === context) {
          events[event] = events[event].slice(0, i).concat(events[event].slice(i + 1));
        }
      }
    };

    emitter.emit = function (event) {
      if (!events[event]) {
        return;
      }
      for (var i = 0; i < events[event].length; i++) {
        events[event][i].handler.apply(events[event][i].context, Array.prototype.slice.call(arguments, 1));
      }
    };

    emitter.getEvents = function () {
      return Object.keys(events);
    };

    emitter.getEventListenerCount = function (event) {
      return events[event] ? events[event].length : 0;
    };

    emitter.maybeReportError = function (error) {
      if (!error) {
        return;
      }
      if (listeningTo('error')) {
        this.emit('error', error);
      } else {
        (logger || console).error(error.message);
      }
    };
    return emitter;
  }

  // The localStorageProvider is provided by the platform object. It should have the following
  // methods, each of which should return a Promise:
  // - get(key): Gets the string value, if any, for the given key
  // - set(key, value): Stores a string value for the given key
  // - remove(key): Removes the given key
  function Store(localStorageProvider, environment, hash, ident, logger) {
    var store = {};

    function getFlagsKey() {
      var key = '';
      var user = ident.getUser();
      if (user) {
        key = hash || btoa(JSON.stringify(user));
      }
      return 'ld:' + environment + ':' + key;
    }

    // Returns a Promise which will be resolved with a parsed JSON value if a stored value was available,
    // resolved with null if there was no value, or rejected if storage was not available.
    store.loadFlags = function () {
      return localStorageProvider.get(getFlagsKey()).then(function (dataStr) {
        if (dataStr === null || dataStr === undefined) {
          return null;
        }
        try {
          var data = JSON.parse(dataStr);
          if (data) {
            var schema = data.$schema;
            if (schema === undefined || schema < 1) {
              data = transformValuesToVersionedValues(data);
            } else {
              delete data['$schema'];
            }
          }
          return data;
        } catch (ex) {
          return store.clearFlags().then(function () {
            return Promise.reject(ex);
          });
        }
      }).catch(function (err) {
        logger.warn(localStorageUnavailable());
        return Promise.reject(err);
      });
    };

    // Returns a Promise which will be resolved with no value if successful, or rejected if storage
    // was not available.
    store.saveFlags = function (flags) {
      var data = extend({}, flags, { $schema: 1 });
      return localStorageProvider.set(getFlagsKey(), JSON.stringify(data)).catch(function (err) {
        logger.warn(localStorageUnavailable());
        return Promise.reject(err);
      });
    };

    // Returns a Promise which will be resolved with no value if successful, or rejected if storage
    // was not available.
    store.clearFlags = function () {
      return localStorageProvider.clear(getFlagsKey()).catch(function (err) {
        logger.warn(localStorageUnavailable());
        return Promise.reject(err);
      });
    };

    return store;
  }

  // The underlying event source implementation is abstracted via the platform object, which should
  // have these three properties:
  // eventSourceFactory(): a function that takes a URL and optional request body and returns an object
  //   with the same methods as the regular HTML5 EventSource object. Passing a body parameter means
  //   that the request should use REPORT instead of GET.
  // eventSourceIsActive(): a function that takes an EventSource-compatible object and returns true if
  //   it is in an active state (connected or connecting).
  // eventSourceAllowsReport: true if REPORT is supported.

  function Stream(platform, config, environment, hash) {
    var baseUrl = config.streamUrl;
    var stream = {};
    var evalUrlPrefix = baseUrl + '/eval/' + environment;
    var useReport = config.useReport;
    var withReasons = config.evaluationReasons;
    var streamReconnectDelay = config.streamReconnectDelay;
    var es = null;
    var reconnectTimeoutReference = null;
    var user = null;
    var handlers = null;

    stream.connect = function (newUser, newHandlers) {
      user = newUser;
      handlers = newHandlers;
      tryConnect();
    };

    stream.disconnect = function () {
      clearTimeout(reconnectTimeoutReference);
      reconnectTimeoutReference = null;
      closeConnection();
    };

    stream.isConnected = function () {
      return es && platform.eventSourceIsActive && platform.eventSourceIsActive(es);
    };

    function reconnect() {
      closeConnection();
      tryConnect(streamReconnectDelay);
    }

    function tryConnect(delay) {
      if (!reconnectTimeoutReference) {
        if (delay) {
          reconnectTimeoutReference = setTimeout(openConnection, delay);
        } else {
          openConnection();
        }
      }
    }

    function openConnection() {
      var url = void 0;
      var query = '';
      var options = {};
      if (platform.eventSourceFactory) {
        if (hash !== null && hash !== undefined) {
          query = 'h=' + hash;
        }
        if (useReport) {
          if (platform.eventSourceAllowsReport) {
            url = evalUrlPrefix;
            options.method = 'REPORT';
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(user);
          } else {
            // if we can't do REPORT, fall back to the old ping-based stream
            url = baseUrl + '/ping/' + environment;
            query = '';
          }
        } else {
          url = evalUrlPrefix + '/' + base64URLEncode(JSON.stringify(user));
        }
        if (withReasons) {
          query = query + (query ? '&' : '') + 'withReasons=true';
        }
        url = url + (query ? '?' : '') + query;

        closeConnection();
        es = platform.eventSourceFactory(url, options);
        for (var key in handlers) {
          if (handlers.hasOwnProperty(key)) {
            es.addEventListener(key, handlers[key]);
          }
        }

        es.onerror = reconnect;
      }
    }

    function closeConnection() {
      if (es) {
        es.close();
        es = null;
      }
    }

    return stream;
  }

  // This function allows a series of Promises to be coalesced such that only the most recently
  // added one actually matters. For instance, if several HTTP requests are made to the same
  // endpoint and we want to ensure that whoever made each one always gets the latest data, each
  // can be passed to addPromise (on the same coalescer) and each caller can wait on the
  // coalescer.resultPromise; all three will then receive the result (or error) from the *last*
  // request, and the results of the first two will be discarded.
  //
  // The cancelFn callback, if present, will be called whenever an existing promise is being
  // discarded. This can be used for instance to abort an HTTP request that's now obsolete.
  //
  // The finallyFn callback, if present, is called on completion of the whole thing. This is
  // different from calling coalescer.resultPromise.finally() because it is executed before any
  // other handlers. Its purpose is to tell the caller that this coalescer should no longer be used.

  function promiseCoalescer(finallyFn) {
    var currentPromise = void 0;
    var currentCancelFn = void 0;
    var finalResolve = void 0;
    var finalReject = void 0;

    var coalescer = {};

    coalescer.addPromise = function (p, cancelFn) {
      currentPromise = p;
      currentCancelFn && currentCancelFn();
      currentCancelFn = cancelFn;

      p.then(function (result) {
        if (currentPromise === p) {
          finalResolve(result);
          finallyFn && finallyFn();
        }
      }, function (error) {
        if (currentPromise === p) {
          finalReject(error);
          finallyFn && finallyFn();
        }
      });
    };

    coalescer.resultPromise = new Promise(function (resolve, reject) {
      finalResolve = resolve;
      finalReject = reject;
    });

    return coalescer;
  }

  var json = 'application/json';

  function getResponseError(result) {
    if (result.status === 404) {
      return new LDInvalidEnvironmentIdError(environmentNotFound());
    } else {
      return new LDFlagFetchError(errorFetchingFlags(result.statusText || String(result.status)));
    }
  }

  function Requestor(platform, options, environment, logger) {
    var baseUrl = options.baseUrl;
    var useReport = options.useReport;
    var withReasons = options.evaluationReasons;
    var sendLDHeaders = options.sendLDHeaders;

    var requestor = {};

    var activeRequests = {}; // map of URLs to promiseCoalescers

    function fetchJSON(endpoint, body) {
      if (!platform.httpRequest) {
        return new Promise(function (resolve, reject) {
          reject(new LDFlagFetchError(httpUnavailable()));
        });
      }

      var method = body ? 'REPORT' : 'GET';
      var headers = sendLDHeaders ? getLDHeaders(platform) : {};
      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      var coalescer = activeRequests[endpoint];
      if (!coalescer) {
        coalescer = promiseCoalescer(function () {
          // this will be called once there are no more active requests for the same endpoint
          delete activeRequests[endpoint];
        });
        activeRequests[endpoint] = coalescer;
      }

      var req = platform.httpRequest(method, endpoint, headers, body);
      var p = req.promise.then(function (result) {
        if (result.status === 200 && result.header('content-type') && result.header('content-type').lastIndexOf(json) === 0) {
          return JSON.parse(result.body);
        } else {
          return Promise.reject(getResponseError(result));
        }
      }, function (e) {
        return Promise.reject(new LDFlagFetchError(networkError(e)));
      });
      coalescer.addPromise(p, function () {
        // this will be called if another request for the same endpoint supersedes this one
        req.cancel && req.cancel();
      });
      return coalescer.resultPromise;
    }

    // Returns a Promise which will resolve with the parsed JSON response, or will be
    // rejected if the request failed.
    requestor.fetchFlagSettings = function (user, hash) {
      var data = void 0;
      var endpoint = void 0;
      var query = '';
      var body = void 0;

      if (useReport) {
        endpoint = [baseUrl, '/sdk/evalx/', environment, '/user'].join('');
        body = JSON.stringify(user);
      } else {
        data = base64URLEncode(JSON.stringify(user));
        endpoint = [baseUrl, '/sdk/evalx/', environment, '/users/', data].join('');
      }
      if (hash) {
        query = 'h=' + hash;
      }
      if (withReasons) {
        query = query + (query ? '&' : '') + 'withReasons=true';
      }
      endpoint = endpoint + (query ? '?' : '') + query;
      logger.debug(debugPolling(endpoint));

      return fetchJSON(endpoint, body);
    };

    // Returns a Promise which will resolve with the parsed JSON response, or will be
    // rejected if the request failed.
    requestor.fetchGoals = function () {
      var endpoint = [baseUrl, '/sdk/goals/', environment].join('');
      return fetchJSON(endpoint, null);
    };

    return requestor;
  }

  function Identity(initialUser, onChange) {
    var ident = {};
    var user = void 0;

    ident.setUser = function (u) {
      user = sanitizeUser(u);
      if (user && onChange) {
        onChange(clone(user));
      }
    };

    ident.getUser = function () {
      return user ? clone(user) : null;
    };

    if (initialUser) {
      ident.setUser(initialUser);
    }

    return ident;
  }

  function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var rngBrowser = createCommonjsModule(function (module) {
    // Unique ID creation requires a high quality random # generator.  In the
    // browser this is a little complicated due to unknown quality of Math.random()
    // and inconsistent support for the `crypto` API.  We do the best we can via
    // feature-detection

    // getRandomValues needs to be invoked in a context where "this" is a Crypto
    // implementation. Also, find the complete implementation of crypto on IE11.
    var getRandomValues = typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (getRandomValues) {
      // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
      var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

      module.exports = function whatwgRNG() {
        getRandomValues(rnds8);
        return rnds8;
      };
    } else {
      // Math.random()-based (RNG)
      //
      // If all else fails, use Math.random().  It's fast, but is of unspecified
      // quality.
      var rnds = new Array(16);

      module.exports = function mathRNG() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
          rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }

        return rnds;
      };
    }
  });

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */
  var byteToHex = [];
  for (var i$1 = 0; i$1 < 256; ++i$1) {
    byteToHex[i$1] = (i$1 + 0x100).toString(16).substr(1);
  }

  function bytesToUuid(buf, offset) {
    var i = offset || 0;
    var bth = byteToHex;
    // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
    return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
  }

  var bytesToUuid_1 = bytesToUuid;

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  var _nodeId;
  var _clockseq;

  // Previous uuid creation time
  var _lastMSecs = 0;
  var _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};
    var node = options.node || _nodeId;
    var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

    // node and clockseq need to be initialized to random values if they're not
    // specified.  We do this lazily to minimize issues related to insufficient
    // system entropy.  See #189
    if (node == null || clockseq == null) {
      var seedBytes = rngBrowser();
      if (node == null) {
        // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
        node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      }
      if (clockseq == null) {
        // Per 4.2.2, randomize (14 bit) clockseq
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
      }
    }

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq === undefined) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    for (var n = 0; n < 6; ++n) {
      b[i + n] = node[n];
    }

    return buf ? buf : bytesToUuid_1(b);
  }

  var v1_1 = v1;

  // Transforms the user object if necessary to make sure it has a valid key.
  // 1. If a key is present, but is not a string, change it to a string.
  // 2. If no key is present, and "anonymous" is true, use a UUID as a key. This is cached in local
  // storage if possible.
  // 3. If there is no key (or no user object), return an error.

  var ldUserIdKey = 'ld:$anonUserId';

  function UserValidator(localStorageProvider, logger) {
    function getCachedUserId() {
      if (localStorageProvider) {
        return localStorageProvider.get(ldUserIdKey).catch(function () {
          return null;
        });
        // Not logging errors here, because if local storage fails for the get, it will presumably fail for the set,
        // so we will end up logging an error in setCachedUserId anyway.
      }
      return Promise.resolve(null);
    }

    function setCachedUserId(id) {
      if (localStorageProvider) {
        return localStorageProvider.set(ldUserIdKey, id).catch(function () {
          logger.warn(localStorageUnavailableForUserId());
        });
      }
      return Promise.resolve();
    }

    var ret = {};

    // Validates the user, returning a Promise that resolves to the validated user, or rejects if there is an error.
    ret.validateUser = function (user) {
      if (!user) {
        return Promise.reject(new LDInvalidUserError(userNotSpecified()));
      }

      var userOut = clone(user);
      if (userOut.key !== null && userOut.key !== undefined) {
        userOut.key = userOut.key.toString();
        return Promise.resolve(userOut);
        return;
      }
      if (userOut.anonymous) {
        return getCachedUserId().then(function (cachedId) {
          if (cachedId) {
            userOut.key = cachedId;
            return userOut;
          } else {
            var id = v1_1();
            userOut.key = id;
            return setCachedUserId(id).then(function () {
              return userOut;
            });
          }
        });
      } else {
        return Promise.reject(new LDInvalidUserError(invalidUser()));
      }
    };

    return ret;
  }

  function validate(options, emitter, extraDefaults, logger) {
    var baseDefaults = {
      baseUrl: 'https://app.launchdarkly.com',
      streamUrl: 'https://clientstream.launchdarkly.com',
      eventsUrl: 'https://events.launchdarkly.com',
      sendEvents: true,
      sendLDHeaders: true,
      inlineUsersInEvents: false,
      allowFrequentDuplicateEvents: false,
      sendEventsOnlyForVariation: false,
      useReport: false,
      evaluationReasons: false,
      flushInterval: 2000,
      samplingInterval: 0,
      streamReconnectDelay: 1000,
      allAttributesPrivate: false,
      privateAttributeNames: []
    };
    var defaults = extend({}, baseDefaults, extraDefaults);

    var deprecatedOptions = {
      // eslint-disable-next-line camelcase
      all_attributes_private: 'allAttributesPrivate',
      // eslint-disable-next-line camelcase
      private_attribute_names: 'privateAttributeNames'
    };

    function checkDeprecatedOptions(config) {
      var opts = config;
      Object.keys(deprecatedOptions).forEach(function (oldName) {
        if (opts[oldName] !== undefined) {
          var newName = deprecatedOptions[oldName];
          logger.warn(deprecated(oldName, newName));
          if (opts[newName] === undefined) {
            opts[newName] = opts[oldName];
          }
          delete opts[oldName];
        }
      });
    }

    function applyDefaults(config, defaults) {
      // This works differently from utils.extend() in that it *will* override a default value
      // if the provided value is explicitly set to null. This provides backward compatibility
      // since in the past we only used the provided values if they were truthy.
      var ret = extend({}, config);
      Object.keys(defaults).forEach(function (name) {
        if (ret[name] === undefined || ret[name] === null) {
          ret[name] = defaults[name];
        }
      });
      return ret;
    }

    function reportArgumentError(message) {
      onNextTick(function () {
        emitter && emitter.maybeReportError(new LDInvalidArgumentError(message));
      });
    }

    var config = extend({}, options || {});

    checkDeprecatedOptions(config);

    config = applyDefaults(config, defaults);

    if (isNaN(config.flushInterval) || config.flushInterval < 2000) {
      config.flushInterval = 2000;
      reportArgumentError('Invalid flush interval configured. Must be an integer >= 2000 (milliseconds).');
    }
    if (isNaN(config.samplingInterval) || config.samplingInterval < 0) {
      config.samplingInterval = 0;
      reportArgumentError('Invalid sampling interval configured. Sampling interval must be an integer >= 0.');
    }

    return config;
  }

  // Default implementation of our internal logging interface, which writes messages to the console.
  // If no minimum level is specified, all messages will be logged. Setting the level to "none"
  // disables all logging.

  function createConsoleLogger(level) {
    var allLevels = ['debug', 'info', 'warn', 'error'];
    var minLevelIndex = 0;
    if (level) {
      if (level === 'none') {
        minLevelIndex = 100;
      } else {
        minLevelIndex = allLevels.indexOf(level);
      }
    }

    var logger = {};

    function log(levelIndex, outputFn, msg) {
      if (levelIndex >= minLevelIndex) {
        outputFn(msg);
      }
    }

    logger.debug = function (msg) {
      return log(0, console.log, msg);
    };
    logger.info = function (msg) {
      return log(1, console.info, msg);
    };
    logger.warn = function (msg) {
      return log(2, console.warn, msg);
    };
    logger.error = function (msg) {
      return log(3, console.error, msg);
    };

    return logger;
  }

  var _typeof$1 = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
    return typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
  };

  var readyEvent = 'ready';
  var successEvent = 'initialized';
  var failedEvent = 'failed';
  var changeEvent = 'change';
  var internalChangeEvent = 'internal-change';

  // This is called by the per-platform initialize functions to create the base client object that we
  // may also extend with additional behavior. It returns an object with these properties:
  //   client: the actual client object
  //   options: the configuration (after any appropriate defaults have been applied)
  // If we need to give the platform-specific clients access to any internals here, we should add those
  // as properties of the return object, not public properties of the client.
  //
  // For definitions of the API in the platform object, see stubPlatform.js in the test code.

  function initialize(env, user, specifiedOptions, platform, extraDefaults) {
    var logger = createLogger();
    var emitter = EventEmitter(logger);
    var options = validate(specifiedOptions, emitter, extraDefaults, logger);
    var hash = options.hash;
    var sendEvents = options.sendEvents;
    var environment = env;
    var stream = Stream(platform, options, environment, hash);
    var events = options.eventProcessor || EventProcessor(platform, options, environment, logger, emitter);
    var requestor = Requestor(platform, options, environment, logger);
    var seenRequests = {};
    var flags = {};
    var useLocalStorage = void 0;
    var streamActive = void 0;
    var streamForcedState = options.streaming;
    var subscribedToChangeEvents = void 0;
    var inited = false;
    var closed = false;
    var firstEvent = true;

    // The "stateProvider" object is used in the Electron SDK, to allow one client instance to take partial
    // control of another. If present, it has the following contract:
    // - getInitialState() returns the initial client state if it is already available. The state is an
    //   object whose properties are "environment", "user", and "flags".
    // - on("init", listener) triggers an event when the initial client state becomes available, passing
    //   the state object to the listener.
    // - on("update", listener) triggers an event when flag values change and/or the current user changes.
    //   The parameter is an object that *may* contain "user" and/or "flags".
    // - enqueueEvent(event) accepts an analytics event object and returns true if the stateProvider will
    //   be responsible for delivering it, or false if we still should deliver it ourselves.
    var stateProvider = options.stateProvider;

    var ident = Identity(null, sendIdentifyEvent);
    var userValidator = UserValidator(platform.localStorage, logger);
    var store = void 0;
    if (platform.localStorage) {
      store = new Store(platform.localStorage, environment, hash, ident, logger);
    }

    function createLogger() {
      if (specifiedOptions && specifiedOptions.logger) {
        return specifiedOptions.logger;
      }
      return extraDefaults && extraDefaults.logger || createConsoleLogger('warn');
    }

    function readFlagsFromBootstrap(data) {
      // If the bootstrap data came from an older server-side SDK, we'll have just a map of keys to values.
      // Newer SDKs that have an allFlagsState method will provide an extra "$flagsState" key that contains
      // the rest of the metadata we want. We do it this way for backward compatibility with older JS SDKs.
      var keys = Object.keys(data);
      var metadataKey = '$flagsState';
      var validKey = '$valid';
      var metadata = data[metadataKey];
      if (!metadata && keys.length) {
        logger.warn(bootstrapOldFormat());
      }
      if (data[validKey] === false) {
        logger.warn(bootstrapInvalid());
      }
      var ret = {};
      keys.forEach(function (key) {
        if (key !== metadataKey && key !== validKey) {
          var flag = { value: data[key] };
          if (metadata && metadata[key]) {
            flag = extend(flag, metadata[key]);
          } else {
            flag.version = 0;
          }
          ret[key] = flag;
        }
      });
      return ret;
    }

    function shouldEnqueueEvent() {
      return sendEvents && !closed && !platform.isDoNotTrack();
    }

    function enqueueEvent(event) {
      if (!environment) {
        // We're in paired mode and haven't been initialized with an environment or user yet
        return;
      }
      if (stateProvider && stateProvider.enqueueEvent && stateProvider.enqueueEvent(event)) {
        return; // it'll be handled elsewhere
      }
      if (!event.user) {
        if (firstEvent) {
          logger.warn(eventWithoutUser());
          firstEvent = false;
        }
        return;
      }
      firstEvent = false;
      if (shouldEnqueueEvent()) {
        logger.debug(debugEnqueueingEvent(event.kind));
        events.enqueue(event);
      }
    }

    function sendIdentifyEvent(user) {
      if (stateProvider) {
        // In paired mode, the other client is responsible for sending identify events
        return;
      }
      if (user) {
        enqueueEvent({
          kind: 'identify',
          key: user.key,
          user: user,
          creationDate: new Date().getTime()
        });
      }
    }

    function sendFlagEvent(key, detail, defaultValue) {
      var user = ident.getUser();
      var now = new Date();
      var value = detail ? detail.value : null;
      if (!options.allowFrequentDuplicateEvents) {
        var cacheKey = JSON.stringify(value) + (user && user.key ? user.key : '') + key; // see below
        var cached = seenRequests[cacheKey];
        // cache TTL is five minutes
        if (cached && now - cached < 300000) {
          return;
        }
        seenRequests[cacheKey] = now;
      }

      var event = {
        kind: 'feature',
        key: key,
        user: user,
        value: value,
        variation: detail ? detail.variationIndex : null,
        default: defaultValue,
        creationDate: now.getTime(),
        reason: detail ? detail.reason : null
      };
      var flag = flags[key];
      if (flag) {
        event.version = flag.flagVersion ? flag.flagVersion : flag.version;
        event.trackEvents = flag.trackEvents;
        event.debugEventsUntilDate = flag.debugEventsUntilDate;
      }

      enqueueEvent(event);
    }

    function identify(user, hash, onDone) {
      if (closed) {
        return wrapPromiseCallback(Promise.resolve({}), onDone);
      }
      if (stateProvider) {
        // We're being controlled by another client instance, so only that instance is allowed to change the user
        logger.warn(identifyDisabled());
        return wrapPromiseCallback(Promise.resolve(transformVersionedValuesToValues(flags)), onDone);
      }
      var clearFirst = useLocalStorage && store ? store.clearFlags() : Promise.resolve();
      return wrapPromiseCallback(clearFirst.then(function () {
        return userValidator.validateUser(user);
      }).then(function (realUser) {
        return ident.setUser(realUser);
      }).then(function () {
        return requestor.fetchFlagSettings(ident.getUser(), hash);
      }).then(function (requestedFlags) {
        var flagValueMap = transformVersionedValuesToValues(requestedFlags);
        if (requestedFlags) {
          return replaceAllFlags(requestedFlags).then(function () {
            return flagValueMap;
          });
        } else {
          return flagValueMap;
        }
      }).then(function (flagValueMap) {
        if (streamActive) {
          connectStream();
        }
        return flagValueMap;
      }).catch(function (err) {
        emitter.maybeReportError(err);
        return Promise.reject(err);
      }), onDone);
    }

    function getUser() {
      return ident.getUser();
    }

    function flush(onDone) {
      return wrapPromiseCallback(sendEvents ? events.flush() : Promise.resolve(), onDone);
    }

    function variation(key, defaultValue) {
      return variationDetailInternal(key, defaultValue, true).value;
    }

    function variationDetail(key, defaultValue) {
      return variationDetailInternal(key, defaultValue, true);
    }

    function variationDetailInternal(key, defaultValue, sendEvent) {
      var detail = void 0;

      if (flags && flags.hasOwnProperty(key) && flags[key] && !flags[key].deleted) {
        var flag = flags[key];
        detail = getFlagDetail(flag);
        if (flag.value === null || flag.value === undefined) {
          detail.value = defaultValue;
        }
      } else {
        detail = { value: defaultValue, variationIndex: null, reason: { kind: 'ERROR', errorKind: 'FLAG_NOT_FOUND' } };
      }

      if (sendEvent) {
        sendFlagEvent(key, detail, defaultValue);
      }

      return detail;
    }

    function getFlagDetail(flag) {
      return {
        value: flag.value,
        variationIndex: flag.variation === undefined ? null : flag.variation,
        reason: flag.reason || null
      };
      // Note, the logic above ensures that variationIndex and reason will always be null rather than
      // undefined if we don't have values for them. That's just to avoid subtle errors that depend on
      // whether an object was JSON-encoded with null properties omitted or not.
    }

    function allFlags() {
      var results = {};

      if (!flags) {
        return results;
      }

      for (var key in flags) {
        if (flags.hasOwnProperty(key)) {
          results[key] = variationDetailInternal(key, null, !options.sendEventsOnlyForVariation).value;
        }
      }

      return results;
    }

    function track(key, data) {
      if (typeof key !== 'string') {
        emitter.maybeReportError(new LDInvalidEventKeyError(unknownCustomEventKey(key)));
        return;
      }

      if (platform.customEventFilter && !platform.customEventFilter(key)) {
        logger.warn(unknownCustomEventKey(key));
      }

      enqueueEvent({
        kind: 'custom',
        key: key,
        data: data,
        user: ident.getUser(),
        url: platform.getCurrentUrl(),
        creationDate: new Date().getTime()
      });
    }

    function connectStream() {
      streamActive = true;
      if (!ident.getUser()) {
        return;
      }
      stream.connect(ident.getUser(), {
        ping: function ping() {
          logger.debug(debugStreamPing());
          requestor.fetchFlagSettings(ident.getUser(), hash, function (err, settings) {
            if (err) {
              emitter.maybeReportError(new LDFlagFetchError(errorFetchingFlags(err)));
            }
            replaceAllFlags(settings); // don't wait for this Promise to be resolved
          });
        },
        put: function put(e) {
          var data = JSON.parse(e.data);
          logger.debug(debugStreamPut());
          replaceAllFlags(data); // don't wait for this Promise to be resolved
        },
        patch: function patch(e) {
          var data = JSON.parse(e.data);
          // If both the flag and the patch have a version property, then the patch version must be
          // greater than the flag version for us to accept the patch.  If either one has no version
          // then the patch always succeeds.
          var oldFlag = flags[data.key];
          if (!oldFlag || !oldFlag.version || !data.version || oldFlag.version < data.version) {
            logger.debug(debugStreamPatch(data.key));
            var mods = {};
            var newFlag = extend({}, data);
            delete newFlag['key'];
            flags[data.key] = newFlag;
            var newDetail = getFlagDetail(newFlag);
            if (oldFlag) {
              mods[data.key] = { previous: oldFlag.value, current: newDetail };
            } else {
              mods[data.key] = { current: newDetail };
            }
            handleFlagChanges(mods); // don't wait for this Promise to be resolved
          } else {
            logger.debug(debugStreamPatchIgnored(data.key));
          }
        },
        delete: function _delete(e) {
          var data = JSON.parse(e.data);
          if (!flags[data.key] || flags[data.key].version < data.version) {
            logger.debug(debugStreamDelete(data.key));
            var mods = {};
            if (flags[data.key] && !flags[data.key].deleted) {
              mods[data.key] = { previous: flags[data.key].value };
            }
            flags[data.key] = { version: data.version, deleted: true };
            handleFlagChanges(mods); // don't wait for this Promise to be resolved
          } else {
            logger.debug(debugStreamDeleteIgnored(data.key));
          }
        }
      });
    }

    function disconnectStream() {
      if (streamActive) {
        stream.disconnect();
        streamActive = false;
      }
    }

    // Returns a Promise which will be resolved when we have completely updated the internal flags state,
    // dispatched all change events, and updated local storage if appropriate. This Promise is guaranteed
    // never to have an unhandled rejection.
    function replaceAllFlags(newFlags) {
      var changes = {};

      if (!newFlags) {
        return Promise.resolve();
      }

      for (var key in flags) {
        if (flags.hasOwnProperty(key) && flags[key]) {
          if (newFlags[key] && !deepEquals(newFlags[key].value, flags[key].value)) {
            changes[key] = { previous: flags[key].value, current: getFlagDetail(newFlags[key]) };
          } else if (!newFlags[key] || newFlags[key].deleted) {
            changes[key] = { previous: flags[key].value };
          }
        }
      }
      for (var _key in newFlags) {
        if (newFlags.hasOwnProperty(_key) && newFlags[_key] && (!flags[_key] || flags[_key].deleted)) {
          changes[_key] = { current: getFlagDetail(newFlags[_key]) };
        }
      }

      flags = newFlags;
      return handleFlagChanges(changes).catch(function () {}); // swallow any exceptions from this Promise
    }

    // Returns a Promise which will be resolved when we have dispatched all change events and updated
    // local storage if appropriate.
    function handleFlagChanges(changes) {
      var keys = Object.keys(changes);

      if (keys.length > 0) {
        var changeEventParams = {};
        keys.forEach(function (key) {
          var current = changes[key].current;
          var value = current ? current.value : undefined;
          var previous = changes[key].previous;
          emitter.emit(changeEvent + ':' + key, value, previous);
          changeEventParams[key] = current ? { current: value, previous: previous } : { previous: previous };
        });

        emitter.emit(changeEvent, changeEventParams);
        emitter.emit(internalChangeEvent, flags);

        // By default, we send feature evaluation events whenever we have received new flag values -
        // the client has in effect evaluated these flags just by receiving them. This can be suppressed
        // by setting "sendEventsOnlyForVariation". Also, if we have a stateProvider, we don't send these
        // events because we assume they have already been sent by the other client that gave us the flags
        // (when it received them in the first place).
        if (!options.sendEventsOnlyForVariation && !stateProvider) {
          keys.forEach(function (key) {
            sendFlagEvent(key, changes[key].current);
          });
        }
      }

      if (useLocalStorage && store) {
        return store.saveFlags(flags).catch(function () {
          return null;
        }); // disregard errors
      } else {
        return Promise.resolve();
      }
    }

    function on(event, handler, context) {
      if (isChangeEventKey(event)) {
        subscribedToChangeEvents = true;
        if (inited) {
          updateStreamingState();
        }
        emitter.on(event, handler, context);
      } else {
        emitter.on.apply(emitter, arguments);
      }
    }

    function off(event) {
      emitter.off.apply(emitter, arguments);
      if (isChangeEventKey(event)) {
        var haveListeners = false;
        emitter.getEvents().forEach(function (key) {
          if (isChangeEventKey(key) && emitter.getEventListenerCount(key) > 0) {
            haveListeners = true;
          }
        });
        if (!haveListeners) {
          subscribedToChangeEvents = false;
          if (streamActive && streamForcedState === undefined) {
            disconnectStream();
          }
        }
      }
    }

    function setStreaming(state) {
      var newState = state === null ? undefined : state;
      if (newState !== streamForcedState) {
        streamForcedState = newState;
        updateStreamingState();
      }
    }

    function updateStreamingState() {
      var shouldBeStreaming = streamForcedState || subscribedToChangeEvents && streamForcedState === undefined;
      if (shouldBeStreaming && !streamActive) {
        connectStream();
      } else if (!shouldBeStreaming && streamActive) {
        disconnectStream();
      }
    }

    function isChangeEventKey(event) {
      return event === changeEvent || event.substr(0, changeEvent.length + 1) === changeEvent + ':';
    }

    var readyPromise = new Promise(function (resolve) {
      var onReady = emitter.on(readyEvent, function () {
        emitter.off(readyEvent, onReady);
        resolve();
      });
    });

    var initPromise = new Promise(function (resolve, reject) {
      var onSuccess = emitter.on(successEvent, function () {
        emitter.off(successEvent, onSuccess);
        resolve();
      });
      var onFailure = emitter.on(failedEvent, function (err) {
        emitter.off(failedEvent, onFailure);
        reject(err);
      });
    });

    if (typeof options.bootstrap === 'string' && options.bootstrap.toUpperCase() === 'LOCALSTORAGE') {
      if (store) {
        useLocalStorage = true;
      } else {
        logger.warn(localStorageUnavailable());
      }
    }

    if (stateProvider) {
      // The stateProvider option is used in the Electron SDK, to allow a client instance in the main process
      // to control another client instance (i.e. this one) in the renderer process. We can't predict which
      // one will start up first, so the initial state may already be available for us or we may have to wait
      // to receive it.
      var state = stateProvider.getInitialState();
      if (state) {
        initFromStateProvider(state);
      } else {
        stateProvider.on('init', initFromStateProvider);
      }
      stateProvider.on('update', updateFromStateProvider);
    } else {
      finishInit().catch(function (err) {
        return emitter.maybeReportError(err);
      });
    }

    function finishInit() {
      if (!env) {
        return Promise.reject(new LDInvalidEnvironmentIdError(environmentNotSpecified()));
      }
      return userValidator.validateUser(user).then(function (realUser) {
        ident.setUser(realUser);
        if (_typeof$1(options.bootstrap) === 'object') {
          flags = readFlagsFromBootstrap(options.bootstrap);
          return signalSuccessfulInit();
        } else if (useLocalStorage) {
          return finishInitWithLocalStorage();
        } else {
          return finishInitWithPolling();
        }
      });
    }

    function finishInitWithLocalStorage() {
      return store.loadFlags().catch(function () {
        return null;
      }) // treat an error the same as if no flags were available
      .then(function (storedFlags) {
        if (storedFlags === null || storedFlags === undefined) {
          flags = {};
          return requestor.fetchFlagSettings(ident.getUser(), hash).then(function (requestedFlags) {
            return replaceAllFlags(requestedFlags || {});
          }).then(signalSuccessfulInit).catch(function (err) {
            var initErr = new LDFlagFetchError(errorFetchingFlags(err));
            signalFailedInit(initErr);
          });
        } else {
          // We're reading the flags from local storage. Signal that we're ready,
          // then update localStorage for the next page load. We won't signal changes or update
          // the in-memory flags unless you subscribe for changes
          flags = storedFlags;
          onNextTick(signalSuccessfulInit);

          return requestor.fetchFlagSettings(ident.getUser(), hash).then(function (requestedFlags) {
            return replaceAllFlags(requestedFlags);
          }).catch(function (err) {
            return emitter.maybeReportError(err);
          });
        }
      });
    }

    function finishInitWithPolling() {
      return requestor.fetchFlagSettings(ident.getUser(), hash).then(function (requestedFlags) {
        flags = requestedFlags || {};
        // Note, we don't need to call updateSettings here because local storage and change events are not relevant
        signalSuccessfulInit();
      }).catch(function (err) {
        flags = {};
        signalFailedInit(err);
      });
    }

    function initFromStateProvider(state) {
      environment = state.environment;
      ident.setUser(state.user);
      flags = state.flags;
      onNextTick(signalSuccessfulInit);
    }

    function updateFromStateProvider(state) {
      if (state.user) {
        ident.setUser(state.user);
      }
      if (state.flags) {
        replaceAllFlags(state.flags); // don't wait for this Promise to be resolved
      }
    }

    function signalSuccessfulInit() {
      logger.info(clientInitialized());
      inited = true;
      updateStreamingState();
      emitter.emit(readyEvent);
      emitter.emit(successEvent); // allows initPromise to distinguish between success and failure
    }

    function signalFailedInit(err) {
      emitter.maybeReportError(err);
      emitter.emit(failedEvent, err);
      emitter.emit(readyEvent); // for backward compatibility, this event happens even on failure
    }

    function start() {
      if (sendEvents) {
        events.start();
      }
    }

    function close(onDone) {
      if (closed) {
        return wrapPromiseCallback(Promise.resolve(), onDone);
      }
      var finishClose = function finishClose() {
        closed = true;
        flags = {};
      };
      var p = Promise.resolve().then(function () {
        disconnectStream();
        if (sendEvents) {
          events.stop();
          return events.flush();
        }
      }).then(finishClose).catch(finishClose);
      return wrapPromiseCallback(p, onDone);
    }

    function getFlagsInternal() {
      // used by Electron integration
      return flags;
    }

    var client = {
      waitForInitialization: function waitForInitialization() {
        return initPromise;
      },
      waitUntilReady: function waitUntilReady() {
        return readyPromise;
      },
      identify: identify,
      getUser: getUser,
      variation: variation,
      variationDetail: variationDetail,
      track: track,
      on: on,
      off: off,
      setStreaming: setStreaming,
      flush: flush,
      allFlags: allFlags,
      close: close
    };

    return {
      client: client, // The client object containing all public methods.
      options: options, // The validated configuration object, including all defaults.
      emitter: emitter, // The event emitter which can be used to log errors or trigger events.
      ident: ident, // The Identity object that manages the current user.
      logger: logger, // The logging abstraction.
      requestor: requestor, // The Requestor object.
      start: start, // Starts the client once the environment is ready.
      enqueueEvent: enqueueEvent, // Puts an analytics event in the queue, if event sending is enabled.
      getFlagsInternal: getFlagsInternal, // Returns flag data structure with all details.
      internalChangeEventName: internalChangeEvent // This event is triggered whenever we have new flag state.
    };
  }

  var version = "2.10.2";

  function isSyncXhrSupported() {
    // This is temporary logic to disable synchronous XHR in Chrome 73 and above. In all other browsers,
    // we will assume it is supported. See https://github.com/launchdarkly/js-client/issues/147
    var userAgent = window.navigator && window.navigator.userAgent;
    if (userAgent) {
      var chromeMatch = userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
      if (chromeMatch) {
        var version = parseInt(chromeMatch[2], 10);
        return version < 73;
      }
    }
    return true;
  }

  var emptyResult = { promise: Promise.resolve({ status: 200, header: function header() {
        return null;
      }, body: null }) };

  function newHttpRequest(method, url, headers, body, pageIsClosing) {
    if (pageIsClosing) {
      // When the page is about to close, we have to use synchronous XHR (until we migrate to sendBeacon).
      // But not all browsers support this.
      if (!isSyncXhrSupported()) {
        return emptyResult;
        // Note that we return a fake success response, because we don't want the request to be retried in this case.
      }
    }

    var xhr = new window.XMLHttpRequest();
    xhr.open(method, url, !pageIsClosing);
    for (var key in headers || {}) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
    if (pageIsClosing) {
      xhr.send(body); // We specified synchronous mode when we called xhr.open
      return emptyResult; // Again, we never want a request to be retried in this case, so we must say it succeeded.
    } else {
      var cancelled = void 0;
      var p = new Promise(function (resolve, reject) {
        xhr.addEventListener('load', function () {
          if (cancelled) {
            return;
          }
          resolve({
            status: xhr.status,
            header: function header(key) {
              return xhr.getResponseHeader(key);
            },
            body: xhr.responseText
          });
        });
        xhr.addEventListener('error', function () {
          if (cancelled) {
            return;
          }
          reject(new Error());
        });
        xhr.send(body);
      });
      var cancel = function cancel() {
        cancelled = true;
        xhr.abort();
      };
      return { promise: p, cancel: cancel };
    }
  }

  function makeBrowserPlatform() {
    var ret = {};

    ret.pageIsClosing = false; // this will be set to true by index.js if the page is closing

    // XMLHttpRequest may not exist if we're running in a server-side rendering context
    if (window.XMLHttpRequest) {
      ret.httpRequest = function (method, url, headers, body) {
        return newHttpRequest(method, url, headers, body, ret.pageIsClosing);
      };
    }

    var hasCors = void 0;
    ret.httpAllowsPost = function () {
      // We compute this lazily because calling XMLHttpRequest() at initialization time can disrupt tests
      if (hasCors === undefined) {
        hasCors = window.XMLHttpRequest ? 'withCredentials' in new window.XMLHttpRequest() : false;
      }
      return hasCors;
    };

    ret.getCurrentUrl = function () {
      return window.location.href;
    };

    ret.isDoNotTrack = function () {
      var flag = void 0;
      if (window.navigator && window.navigator.doNotTrack !== undefined) {
        flag = window.navigator.doNotTrack; // FF, Chrome
      } else if (window.navigator && window.navigator.msDoNotTrack !== undefined) {
        flag = window.navigator.msDoNotTrack; // IE 9/10
      } else {
        flag = window.doNotTrack; // IE 11+, Safari
      }
      return flag === 1 || flag === true || flag === '1' || flag === 'yes';
    };

    try {
      if (window.localStorage) {
        ret.localStorage = {
          get: function get(key) {
            return new Promise(function (resolve) {
              resolve(window.localStorage.getItem(key));
            });
          },
          set: function set(key, value) {
            return new Promise(function (resolve) {
              window.localStorage.setItem(key, value);
              resolve();
            });
          },
          clear: function clear(key) {
            return new Promise(function (resolve) {
              window.localStorage.removeItem(key);
              resolve();
            });
          }
        };
      }
    } catch (e) {
      // In some browsers (such as Chrome), even looking at window.localStorage at all will cause a
      // security error if the feature is disabled.
      ret.localStorage = null;
    }

    // If EventSource does not exist, the absence of eventSourceFactory will make us not try to open streams
    if (window.EventSource) {
      var timeoutMillis = 300000; // this is only used by polyfills - see below

      ret.eventSourceFactory = function (url) {
        // The standard EventSource constructor doesn't take any options, just a URL. However, some
        // EventSource polyfills allow us to specify a timeout interval, and in some cases they will
        // default to a too-short timeout if we don't specify one. So, here, we are setting the
        // timeout properties that are used by several popular polyfills.
        var options = {
          heartbeatTimeout: timeoutMillis, // used by "event-source-polyfill" package
          silentTimeout: timeoutMillis // used by "eventsource-polyfill" package
        };

        return new window.EventSource(url, options);
      };

      ret.eventSourceIsActive = function (es) {
        return es.readyState === window.EventSource.OPEN || es.readyState === window.EventSource.CONNECTING;
      };
    }

    ret.eventSourceAllowsReport = false;

    ret.userAgent = 'JSClient';

    return ret;
  }

  var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

  var escapeStringRegexp = function escapeStringRegexp(str) {
  	if (typeof str !== 'string') {
  		throw new TypeError('Expected a string');
  	}

  	return str.replace(matchOperatorsRe, '\\$&');
  };

  function doesUrlMatch(matcher, href, search, hash) {
    var canonicalUrl = href.replace(search, '').replace(hash, '');
    var regex = void 0;
    var testUrl = void 0;

    switch (matcher.kind) {
      case 'exact':
        testUrl = href;
        regex = new RegExp('^' + escapeStringRegexp(matcher.url) + '/?$');
        break;
      case 'canonical':
        testUrl = canonicalUrl;
        regex = new RegExp('^' + escapeStringRegexp(matcher.url) + '/?$');
        break;
      case 'substring':
        testUrl = canonicalUrl;
        regex = new RegExp('.*' + escapeStringRegexp(matcher.substring) + '.*$');
        break;
      case 'regex':
        testUrl = canonicalUrl;
        regex = new RegExp(matcher.pattern);
        break;
      default:
        return false;
    }
    return regex.test(testUrl);
  }

  function findGoalsForClick(event, clickGoals) {
    var matches = [];

    for (var i = 0; i < clickGoals.length; i++) {
      var target = event.target;
      var goal = clickGoals[i];
      var selector = goal.selector;
      var elements = document.querySelectorAll(selector);
      while (target && elements.length > 0) {
        for (var j = 0; j < elements.length; j++) {
          if (target === elements[j]) {
            matches.push(goal);
          }
        }
        target = target.parentNode;
      }
    }

    return matches;
  }

  function GoalTracker(goals, onEvent) {
    var tracker = {};
    var listenerFn = null;

    var clickGoals = [];

    for (var i = 0; i < goals.length; i++) {
      var goal = goals[i];
      var urls = goal.urls || [];

      for (var j = 0; j < urls.length; j++) {
        if (doesUrlMatch(urls[j], window.location.href, window.location.search, window.location.hash)) {
          if (goal.kind === 'pageview') {
            onEvent('pageview', goal);
          } else {
            clickGoals.push(goal);
            onEvent('click_pageview', goal);
          }
          break;
        }
      }
    }

    if (clickGoals.length > 0) {
      listenerFn = function listenerFn(event) {
        var goals = findGoalsForClick(event, clickGoals);
        for (var _i = 0; _i < goals.length; _i++) {
          onEvent('click', goals[_i]);
        }
      };

      document.addEventListener('click', listenerFn);
    }

    tracker.dispose = function () {
      document.removeEventListener('click', listenerFn);
    };

    return tracker;
  }

  var locationWatcherInterval = 300;

  function GoalManager(clientVars, readyCallback) {
    var goals = void 0;
    var goalTracker = void 0;

    var ret = {};

    ret.goalKeyExists = function (key) {
      if (!goals) {
        return true;
      }
      for (var i = 0; i < goals.length; i++) {
        if (goals[i].kind === 'custom' && goals[i].key === key) {
          return true;
        }
      }
      return false;
    };

    function refreshGoalTracker() {
      if (goalTracker) {
        goalTracker.dispose();
      }
      if (goals && goals.length) {
        goalTracker = GoalTracker(goals, sendGoalEvent);
      }
    }

    function sendGoalEvent(kind, goal) {
      var event = {
        kind: kind,
        key: goal.key,
        data: null,
        url: window.location.href,
        user: clientVars.ident.getUser(),
        creationDate: new Date().getTime()
      };

      if (kind === 'click') {
        event.selector = goal.selector;
      }

      return clientVars.enqueueEvent(event);
    }

    function watchLocation(interval, callback) {
      var previousUrl = window.location.href;
      var currentUrl = void 0;

      function checkUrl() {
        currentUrl = window.location.href;

        if (currentUrl !== previousUrl) {
          previousUrl = currentUrl;
          callback();
        }
      }

      function poll(fn, interval) {
        fn();
        setTimeout(function () {
          poll(fn, interval);
        }, interval);
      }

      poll(checkUrl, interval);

      if (!!(window.history && window.history.pushState)) {
        window.addEventListener('popstate', checkUrl);
      } else {
        window.addEventListener('hashchange', checkUrl);
      }
    }

    clientVars.requestor.fetchGoals().then(function (g) {
      if (g && g.length > 0) {
        goals = g;
        goalTracker = GoalTracker(goals, sendGoalEvent);
        watchLocation(locationWatcherInterval, refreshGoalTracker);
      }
      readyCallback();
    }).catch(function (err) {
      clientVars.emitter.maybeReportError(new errors.LDUnexpectedResponseError('Error fetching goals: ' + (err && err.message) ? err.message : err));
      readyCallback();
    });

    return ret;
  }

  var goalsEvent = 'goalsReady';
  var extraDefaults = {
    fetchGoals: true
  };

  // Pass our platform object to the common code to create the browser version of the client
  function initialize$1(env, user) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var platform = makeBrowserPlatform();
    var clientVars = initialize(env, user, options, platform, extraDefaults);

    var client = clientVars.client;
    var validatedOptions = clientVars.options;
    var emitter = clientVars.emitter;

    var goalsPromise = new Promise(function (resolve) {
      var onGoals = emitter.on(goalsEvent, function () {
        emitter.off(goalsEvent, onGoals);
        resolve();
      });
    });
    client.waitUntilGoalsReady = function () {
      return goalsPromise;
    };

    if (validatedOptions.fetchGoals) {
      var goalManager = GoalManager(clientVars, function () {
        return emitter.emit(goalsEvent);
      });
      platform.customEventFilter = goalManager.goalKeyExists;
    } else {
      emitter.emit(goalsEvent);
    }

    if (document.readyState !== 'complete') {
      window.addEventListener('load', clientVars.start);
    } else {
      clientVars.start();
    }
    window.addEventListener('beforeunload', function () {
      platform.pageIsClosing = true;
      client.close();
    });

    return client;
  }

  var createConsoleLogger$1 = createConsoleLogger;

  var version$1 = version;

  function deprecatedInitialize(env, user) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    console && console.warn && console.warn(messages.deprecated('default export', 'named LDClient export'));
    return initialize$1(env, user, options);
  }

  var index = { initialize: deprecatedInitialize, version: version$1 };

  exports.initialize = initialize$1;
  exports.createConsoleLogger = createConsoleLogger$1;
  exports.version = version$1;
  exports.default = index;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ldclient.js.map
