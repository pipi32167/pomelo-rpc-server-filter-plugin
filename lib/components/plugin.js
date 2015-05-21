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

      tracer.error('invalid rpc server before filter');
      cb(new Error('invalid rpc server before filter'));
    }
    next();
  };

  var afterFilter = function(tracer, msg, resp, cb) {
    var index = 0;
    var filters = app.get(Constants.KEYWORDS.RPC_SERVER_AFTER_FILTER) || [];
    var next = function(err) {

      if (err || index >= filters.length) {
        cb(err);
        return;
      }

      var filter = filters[index++];

      if (filter instanceof Function) {
        filter(msg, resp, next);
        return;
      }

      if (filter.after instanceof Function) {
        filter.after(msg, resp, next);
        return;
      }

      tracer.error('invalid rpc server after filter');
      cb(new Error('invalid rpc server after filter'));
    }
    next();
  };

  var Dispatcher = opts.Dispatcher || app.require('node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/dispatcher.js');
  var __route = Dispatcher.prototype.route;
  Dispatcher.prototype.route = function(tracer, msg, cb) {

    var self = this;
    var resp;

    async.series({

      before: function(cb) {
        beforeFilter(tracer, msg, cb);
      },

      route: function(cb) {
        __route.call(self, tracer, msg, function() {
          resp = Array.prototype.slice.call(arguments, 0);
          cb();
        });
      },

      after: function(cb) {
        afterFilter(tracer, msg, resp, cb);
      }
    }, function(err) {
      if (!!err) {
        cb(err);
        return;
      }
      cb.apply(null, resp);
    });
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