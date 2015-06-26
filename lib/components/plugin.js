'use strict';

var path = require('path');
var assert = require('assert');
var async = require('async');

module.exports = function(app, opts) {
  return new Plugin(app, opts);
};

var defaultLogger = function() {
  return {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error,
  }
}

var Constants = {

  KEYWORDS: {
    RPC_SERVER_BEFORE_FILTER: '__rpcServerBefores__',
    RPC_SERVER_AFTER_FILTER: '__rpcServerAfters__',
  }
};

var addFilter = function(app, type, filter) {
  var filters = app.get(type);
  if (!filters) {
    filters = [];
    app.set(type, filters);
  }
  filters.push(filter);
};

var Plugin = function(app, opts) {

  app.rpcServerBefore = function(bf) {
    addFilter(this, Constants.KEYWORDS.RPC_SERVER_BEFORE_FILTER, bf);
  };

  app.rpcServerAfter = function(af) {
    addFilter(this, Constants.KEYWORDS.RPC_SERVER_AFTER_FILTER, af);
  };

  app.rpcServerFilter = function(filter) {
    this.rpcServerBefore(filter);
    this.rpcServerAfter(filter);
  };

  var self = this;

  var beforeFilter = function(tracer, msg, cb) {
    var index = 0;
    var filters = app.get(Constants.KEYWORDS.RPC_SERVER_BEFORE_FILTER) || [];
    var next = function(err) {

      if (err || index >= filters.length) {
        cb(err);
        return;
      }

      var filter = filters[index++];

      if (filter instanceof Function) {
        filter(msg, next);
        return;
      }

      if (filter.before instanceof Function) {
        filter.before(msg, next);
        return;
      }

      cb(new Error('invalid rpc server before filter'));
    }
    next();
  };

  var afterFilter = function(tracer, err, msg, resp, cb) {
    var index = 0;
    var filters = app.get(Constants.KEYWORDS.RPC_SERVER_AFTER_FILTER) || [];
    var next = function(err) {

      if (index >= filters.length) {
        cb(err);
        return;
      }

      var filter = filters[index++];

      if (filter instanceof Function) {
        filter(err, msg, resp, next);
        return;
      }

      if (filter.after instanceof Function) {
        filter.after(err, msg, resp, next);
        return;
      }

      cb(new Error('invalid rpc server after filter'));
    }
    next(err);
  };

  var Dispatcher = opts.Dispatcher || app.require('node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/dispatcher.js');
  var __route = Dispatcher.prototype.route;
  Dispatcher.prototype.route = function(tracer, msg, cb) {

    var self = this;
    var resp;
    var cb2 = function(err) {
      if (!!err) {
        tracer.error('handle remote error:', err, err.stack);
        cb(err);
        return;
      }

      cb.apply(null, resp);
    }

    var handle = function(err) {
      if (!!err) {
        afterFilter(tracer, err, msg, null, cb2);
        return;
      }

      try {
        __route.call(self, tracer, msg, function() {
          resp = Array.prototype.slice.call(arguments, 0);
          afterFilter(tracer, null, msg, resp, cb2);
        });
      } catch (e) {
        afterFilter(tracer, e, msg, null, cb2);
      }
    }

    beforeFilter(tracer, msg, handle);
  }
}

Plugin.name = '__rpc_server_filter__';

Plugin.prototype.start = function(cb) {
  setImmediate(cb);
}

Plugin.prototype.afterStart = function(cb) {
  setImmediate(cb);
}

Plugin.prototype.stop = function(force, cb) {
  setImmediate(cb);
}