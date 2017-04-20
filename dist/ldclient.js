(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["LDClient"] = factory();
	else
		root["LDClient"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var EventProcessor = __webpack_require__(1);
	var EventEmitter = __webpack_require__(4);
	var GoalTracker = __webpack_require__(5);
	var Stream = __webpack_require__(7);
	var Requestor = __webpack_require__(8);
	var Identity = __webpack_require__(9);
	var utils = __webpack_require__(2);

	var flags = {};
	var environment;
	var events;
	var requestor;
	var stream;
	var emitter;
	var hash;
	var ident;
	var baseUrl;
	var eventsUrl;
	var streamUrl;
	var goalTracker;
	var useLocalStorage;
	var goals;

	var readyEvent = 'ready';
	var changeEvent = 'change';

	var flushInterval = 2000;

	var seenRequests = {};

	function sendIdentifyEvent(user) {
	  events.enqueue({
	    kind: 'identify',
	    key: user.key,
	    user: user,
	    creationDate: (new Date()).getTime()
	  });
	}

	function sendFlagEvent(key, value, defaultValue) {
	  var user = ident.getUser();
	  var cacheKey = JSON.stringify(value) + (user && user.key ? user.key : '') + key;
	  var now = new Date();
	  var cached = seenRequests[cacheKey];

	  if (cached && (now - cached) < 300000 /* five minutes, in ms */) {
	    return;
	  }

	  seenRequests[cacheKey] = now;

	  events.enqueue({
	    kind: 'feature',
	    key: key,
	    user: user,
	    value: value,
	    'default': defaultValue,
	    creationDate: now.getTime()
	  });
	}

	function sendGoalEvent(kind, goal) {
	  var event = {
	    kind: kind,
	    key: goal.key,
	    data: null,
	    url: window.location.href,
	    creationDate: (new Date()).getTime()
	  };

	  if (kind === 'click') {
	    event.selector = goal.selector;
	  }

	  return events.enqueue(event);
	}

	function identify(user, hash, onDone) {
	  ident.setUser(user);
	  requestor.fetchFlagSettings(ident.getUser(), hash, function(err, settings) {
	    if (settings) {
	      updateSettings(settings);
	    }
	    onDone && onDone();
	  });
	}

	function variation(key, defaultValue) {
	  var value;

	  if (flags && flags.hasOwnProperty(key)) {
	    value = flags[key] === null ? defaultValue : flags[key];
	  } else {
	    value = defaultValue;
	  }

	  sendFlagEvent(key, value, defaultValue);

	  return value;
	}

	function allFlags() {
	  var results = {};

	  if (!flags) { return results; }

	  for (var key in flags) {
	    if (flags.hasOwnProperty(key)) {
	      results[key] = variation(key, null);
	    }
	  }

	  return results;
	}

	function track(key, data) {
	  if (typeof key !== 'string') {
	    throw 'Event key must be a string';
	  }

	  events.enqueue({
	    kind: 'custom',
	    key: key,
	    data: data,
	    url: window.location.href,
	    creationDate: (new Date()).getTime()
	  });
	}

	function connectStream() {
	  stream.connect(function() {
	    requestor.fetchFlagSettings(ident.getUser(), hash, function(err, settings) {
	      updateSettings(settings);
	    });
	  });
	}

	function updateSettings(settings) {
	  var changes;
	  var keys;

	  if (!settings) { return; }

	  changes = utils.modifications(flags, settings);
	  keys = Object.keys(changes);

	  flags = settings;

	  if (useLocalStorage) {
	    localStorage.setItem(lsKey(environment, ident.getUser()), JSON.stringify(flags));
	  }

	  if (keys.length > 0) {
	    keys.forEach(function(key) {
	      emitter.emit(changeEvent + ':' + key, changes[key].current, changes[key].previous);
	    });

	    emitter.emit(changeEvent, changes);

	    keys.forEach(function(key) {
	      sendFlagEvent(key, changes[key].current);
	    });
	  }
	}

	function on(event, handler, context) {
	  if (event.substr(0, changeEvent.length) === changeEvent) {
	    if (!stream.isConnected()) {
	      connectStream();
	    }
	    emitter.on.apply(emitter, [event, handler, context]);
	  } else {
	    emitter.on.apply(emitter, Array.prototype.slice.call(arguments));
	  }
	}

	function off() {
	  emitter.off.apply(emitter, Array.prototype.slice.call(arguments));
	}

	function handleMessage(event) {
	  if (event.origin !== baseUrl) { return; }
	  if (event.data.type === 'SYN') {
	    window.editorClientBaseUrl = baseUrl;
	    var editorTag = document.createElement('script');
	    editorTag.type = 'text/javascript';
	    editorTag.async = true;
	    editorTag.src = baseUrl + event.data.editorClientUrl;
	    var s = document.getElementsByTagName('script')[0];
	    s.parentNode.insertBefore(editorTag, s);
	  }
	}

	var client = {
	  identify: identify,
	  variation: variation,
	  track: track,
	  on: on,
	  off: off,
	  allFlags: allFlags
	};

	function lsKey(env, user) {
	  var uKey = '';
	  if (user && user.key) {
	    uKey = user.key;
	  }
	  return 'ld:' + env + ':' + uKey;
	}

	function initialize(env, user, options) {
	  var localStorageKey;
	  options = options || {};
	  environment = env;
	  flags = typeof(options.bootstrap) === 'object' ? options.bootstrap : {};
	  hash = options.hash;
	  baseUrl = options.baseUrl || 'https://app.launchdarkly.com';
	  eventsUrl = options.eventsUrl || 'https://events.launchdarkly.com';
	  streamUrl = options.streamUrl || 'https://clientstream.launchdarkly.com';
	  stream = Stream(streamUrl, environment);
	  events = EventProcessor(eventsUrl + '/a/' + environment + '.gif');
	  emitter = EventEmitter();
	  ident = Identity(user, sendIdentifyEvent);
	  requestor = Requestor(baseUrl, environment);
	  localStorageKey = lsKey(environment, ident.getUser());

	  if (typeof options.bootstrap === 'object') {
	    // Emitting the event here will happen before the consumer
	    // can register a listener, so defer to next tick.
	    setTimeout(function() { emitter.emit(readyEvent); }, 0);
	  }
	  else if (typeof(options.bootstrap) === 'string' && options.bootstrap.toUpperCase() === 'LOCALSTORAGE' && typeof(Storage) !== 'undefined') {
	    useLocalStorage = true;
	    // check if localstorage data is corrupted, if so clear it
	    try {
	      flags = JSON.parse(localStorage.getItem(localStorageKey));
	    } catch (error) {
	      localStorage.setItem(localStorageKey, null);
	    }

	    if (flags === null) {
	      requestor.fetchFlagSettings(ident.getUser(), hash, function(err, settings) {
	        flags = settings;
	        settings && localStorage.setItem(localStorageKey, JSON.stringify(flags));
	        emitter.emit(readyEvent);
	      });
	    } else {
	      // We're reading the flags from local storage. Signal that we're ready,
	      // then update localStorage for the next page load. We won't signal changes or update
	      // the in-memory flags unless you subscribe for changes
	      setTimeout(function() { emitter.emit(readyEvent); }, 0);
	      requestor.fetchFlagSettings(ident.getUser(), hash, function(err, settings) {
	        settings && localStorage.setItem(localStorageKey, JSON.stringify(settings));
	      });
	    }
	  }
	  else {
	    requestor.fetchFlagSettings(ident.getUser(), hash, function(err, settings) {
	      flags = settings;
	      emitter.emit(readyEvent);
	    });
	  }

	  requestor.fetchGoals(function(err, g) {
	    if (err) {/* TODO */}
	    if (g && g.length > 0) {
	      goals = g;
	      goalTracker = GoalTracker(goals, sendGoalEvent);
	    }
	  });

	  function start() {
	    setTimeout(function tick() {
	      events.flush(ident.getUser());
	      setTimeout(tick, flushInterval);
	    }, flushInterval);
	  }

	  if (document.readyState !== 'complete') {
	    window.addEventListener('load', start);
	  } else {
	    start();
	  }

	  window.addEventListener('beforeunload', function() {
	    events.flush(ident.getUser(), true);
	  });

	  function refreshGoalTracker() {
	    if (goalTracker) {
	      goalTracker.dispose();
	    }
	    if (goals && goals.length) {
	      goalTracker = GoalTracker(goals, sendGoalEvent);
	    }
	  }

	  if (goals && goals.length > 0) {
	    if (!!(window.history && history.pushState)) {
	      window.addEventListener('popstate', refreshGoalTracker);
	    } else {
	      window.addEventListener('hashchange', refreshGoalTracker);
	    }
	  }

	  window.addEventListener('message', handleMessage);

	  return client;
	}

	module.exports = {
	  initialize: initialize
	};

	if(true) {
	  module.exports.version = ("1.1.9");
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(2);

	function EventProcessor(eventsUrl) {
	  var processor = {};
	  var queue = [];
	  var initialFlush = true;
	  
	  processor.enqueue = function(event) {
	    queue.push(event);
	  };
	  
	  processor.flush = function(user, sync) {
	    var maxLength = 2000 - eventsUrl.length;
	    var data = [];
	    
	    if (!user) {
	      if (initialFlush) {
	        console && console.warn && console.warn('Be sure to call `identify` in the LaunchDarkly client: http://docs.launchdarkly.com/docs/running-an-ab-test#include-the-client-side-snippet');
	      }
	      return false;
	    }
	    
	    initialFlush = false;
	    while (maxLength > 0 && queue.length > 0) {
	      var event = queue.pop();
	      event.user = user;
	      maxLength = maxLength - utils.base64URLEncode(JSON.stringify(event)).length;
	      // If we are over the max size, put this one back on the queue
	      // to try in the next round, unless this event alone is larger 
	      // than the limit, in which case, screw it, and try it anyway.
	      if (maxLength < 0 && data.length > 0) {
	        queue.push(event);
	      } else {
	        data.push(event);
	      }
	    }
	    
	    if (data.length > 0) {
	      var src = eventsUrl + '?d=' + utils.base64URLEncode(JSON.stringify(data));
	      //Detect browser support for CORS
	      if ('withCredentials' in new XMLHttpRequest()) {
	        /* supports cross-domain requests */
	        var xhr = new XMLHttpRequest();
	        xhr.open('GET', src, !sync);
	        xhr.send();
	      } else {
	        var img = new Image();
	        img.src = src;
	      }
	    }

	    // if the queue is not empty, call settimeout to flush it again 
	    // with a 0 timeout (stack-less recursion)
	    // Or, just recursively call flush_queue with the remaining elements
	    // if we're doing this on unload
	    if (queue.length > 0) {
	      if (sync) {
	        processor.flush(user, sync);
	      }
	      else {
	        setTimeout(function() {
	          processor.flush(user);
	        }, 0);
	      }
	    }
	    return false;
	  };
	  
	  return processor;
	}

	module.exports = EventProcessor;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Base64 = __webpack_require__(3);

	// See http://ecmanaut.blogspot.com/2006/07/encoding-decoding-utf8-in-javascript.html
	function btoa(s) {
	  return Base64.btoa(unescape(encodeURIComponent(s)));
	}

	function base64URLEncode(s) {
	  return btoa(s)
	  .replace(/=/g, '')
	  .replace(/\+/g, '-')
	  .replace(/\//g, '_');
	}

	function clone(obj) {
	  return JSON.parse(JSON.stringify(obj));
	}

	function modifications(oldObj, newObj) {
	  var mods = {};
	  if (!oldObj || !newObj) { return {}; }
	  for (var prop in oldObj) {
	    if (oldObj.hasOwnProperty(prop)) {
	      if (newObj[prop] !== oldObj[prop]) {
	        mods[prop] = {previous: oldObj[prop], current: newObj[prop]};
	      }
	    }
	  }
	  
	  return mods;
	}

	module.exports = {
	  btoa: btoa,
	  base64URLEncode: base64URLEncode,
	  clone: clone,
	  modifications: modifications
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	;(function () {

	  var object =  true ? exports : self; // #8: web workers
	  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

	  function InvalidCharacterError(message) {
	    this.message = message;
	  }
	  InvalidCharacterError.prototype = new Error;
	  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	  // encoder
	  // [https://gist.github.com/999166] by [https://github.com/nignag]
	  object.btoa || (
	  object.btoa = function (input) {
	    var str = String(input);
	    for (
	      // initialize result and counter
	      var block, charCode, idx = 0, map = chars, output = '';
	      // if the next str index does not exist:
	      //   change the mapping table to "="
	      //   check if d has no fractional digits
	      str.charAt(idx | 0) || (map = '=', idx % 1);
	      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	    ) {
	      charCode = str.charCodeAt(idx += 3/4);
	      if (charCode > 0xFF) {
	        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
	      }
	      block = block << 8 | charCode;
	    }
	    return output;
	  });

	  // decoder
	  // [https://gist.github.com/1020396] by [https://github.com/atk]
	  object.atob || (
	  object.atob = function (input) {
	    var str = String(input).replace(/=+$/, '');
	    if (str.length % 4 == 1) {
	      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
	    }
	    for (
	      // initialize result and counters
	      var bc = 0, bs, buffer, idx = 0, output = '';
	      // get next character
	      buffer = str.charAt(idx++);
	      // character found in table? initialize bit storage and add its ascii value;
	      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
	        // and if not first of each 4 characters,
	        // convert the first 8 bits to one ascii character
	        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
	    ) {
	      // try to find character in table (0-63, not found => -1)
	      buffer = chars.indexOf(buffer);
	    }
	    return output;
	  });

	}());


/***/ },
/* 4 */
/***/ function(module, exports) {

	function EventEmitter() {
	  var emitter = {};
	  var events = {};
	  
	  emitter.on = function(event, handler, context) {
	    events[event] = events[event] || [];
	    events[event] = events[event].concat({handler: handler, context: context});
	  };
	  
	  emitter.off = function(event, handler, context) {
	    if (!events[event]) { return; }
	    for (var i = 0; i < events[event].length ; i++) {
	      if (events[event][i].handler === handler && events[event][i].context === context) {
	        events[event] = events[event].slice(0, i).concat(events[event].slice(i + 1));
	      }
	    }
	  };
	  
	  emitter.emit = function(event) { 
	    if (!events[event]) { return; }
	    for (var i = 0; i < events[event].length; i++) {
	      events[event][i].handler.apply(events[event][i].context, Array.prototype.slice.call(arguments, 1));
	    }
	  };
	  
	  return emitter;
	}

	module.exports = EventEmitter;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var escapeStringRegexp = __webpack_require__(6);

	function doesUrlMatch(matcher, href, search, hash) {
	  var canonicalUrl = href.replace(search, '').replace(hash, '');
	  var regex;
	  var testUrl;
	  
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
	        if (target === elements[j])
	          matches.push(goal);
	      }
	      target = target.parentNode;
	    }
	  }
	  
	  return matches;
	}

	function GoalTracker(goals, onEvent) {
	  var tracker = {};
	  var goals = goals;
	  var listenerFn = null;
	  
	  var clickGoals = [];
	  
	  for (var i = 0; i < goals.length; i++) {
	    var goal = goals[i];
	    var urls = goal.urls || [];
	    
	    for (var j = 0; j < urls.length; j++) {
	      if (doesUrlMatch(urls[j], location.href, location.search, location.hash)) {
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
	    listenerFn = function(event) {
	      var goals = findGoalsForClick(event, clickGoals);
	      for (var i = 0; i < goals.length; i++) {
	        onEvent('click', goals[i]);
	      }
	    };

	    document.addEventListener('click', listenerFn);
	  }

	  tracker.dispose = function() {
	    document.removeEventListener('click', listenerFn);
	  }
	  
	  return tracker;
	}

	module.exports = GoalTracker;


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

	module.exports = function (str) {
		if (typeof str !== 'string') {
			throw new TypeError('Expected a string');
		}

		return str.replace(matchOperatorsRe, '\\$&');
	};


/***/ },
/* 7 */
/***/ function(module, exports) {

	function Stream(url, environment) {
	  var stream = {};
	  var url = url + '/ping/' + environment;
	  var es = null;

	  stream.connect = function(onPing) {
	    if (typeof EventSource !== 'undefined') {
	      es = new window.EventSource(url);
	      es.addEventListener('ping', onPing);
	    }
	  }

	  stream.disconnect = function() {
	    es && es.close();
	  }

	  stream.isConnected = function() {
	    return es && (es.readyState === EventSource.OPEN || es.readyState === EventSource.CONNECTING);
	  }

	  return stream;
	}

	module.exports = Stream;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(2);

	var json = 'application/json';

	function fetchJSON(endpoint, callback) {
	  var xhr = new XMLHttpRequest();
	  
	  xhr.addEventListener('load', function() {
	    if (xhr.status === 200 && xhr.getResponseHeader('Content-type') === json) {
	      callback(null, JSON.parse(xhr.responseText));
	    } else {
	      callback(xhr.statusText);
	    }
	  });
	  
	  xhr.addEventListener('error', function() {
	    callback(xhr.statusText);
	  });
	  
	  xhr.open('GET', endpoint);
	  xhr.send();
	  
	  return xhr;
	}

	var flagSettingsRequest;
	var lastFlagSettingsCallback;

	function Requestor(baseUrl, environment) {
	  var requestor = {};
	  
	  requestor.fetchFlagSettings = function(user, hash, callback) {
	    var data = utils.base64URLEncode(JSON.stringify(user));
	    var endpoint = [baseUrl, '/sdk/eval/', environment,  '/users/', data, hash ? '?h=' + hash : ''].join('');
	    var cb;

	    var wrappedCallback = (function(currentCallback) {
	      return function() {
	        currentCallback.apply(null, arguments);
	        flagSettingsRequest = null;
	        lastFlagSettingsCallback = null;
	      };
	    })(callback);
	    

	    if (flagSettingsRequest) {
	      flagSettingsRequest.abort();
	      cb = (function(prevCallback) {
	        return function() {
	          prevCallback && prevCallback.apply(null, arguments);
	          wrappedCallback.apply(null, arguments);
	        };
	      })(lastFlagSettingsCallback);
	    } else {
	      cb = wrappedCallback;
	    }

	    lastFlagSettingsCallback = cb;
	    flagSettingsRequest = fetchJSON(endpoint, cb);
	  };
	  
	  requestor.fetchGoals = function(callback) {
	    var endpoint = [baseUrl, '/sdk/goals/', environment].join('');
	    fetchJSON(endpoint, callback);
	  };
	  
	  return requestor;
	}

	module.exports = Requestor;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(2);

	function sanitizeUser(u) {
	  var sane = utils.clone(u);
	  if (sane.key) {
	    sane.key = sane.key.toString();
	  }
	  return sane;
	}

	function Identity(initialUser, onChange) {
	  var ident = {};
	  var user;
	  
	  ident.setUser = function(u) {
	    user = sanitizeUser(u);
	    onChange(utils.clone(user));
	  };
	  
	  ident.getUser = function() {
	    return utils.clone(user);
	  };
	  
	  if (initialUser) {
	    ident.setUser(initialUser);
	  }
	  
	  return ident;
	}

	module.exports = Identity;


/***/ }
/******/ ])
});
;