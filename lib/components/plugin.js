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

  var beforeFilter = function(tracer, msg, session, cb) {
    var index = 0;
    var filters = app.get(Constants.KEYWORDS.RPC_SERVER_BEFORE_FILTER) || [];
    var next = function(err, resp) {
      if (err || index >= filters.length) {
        cb(err, resp);
        return;
      }

      var filter = filters[index++];

      if (filter instanceof Function) {
        filter(msg, session, next);
        return;
      }

      if (filter.before instanceof Function) {
        filter.before(msg, session, next);
        return;
      }

      cb(new Error('invalid rpc server before filter'));
    }
    next();
  };

  var afterFilter = function(tracer, err, msg, session, resp, cb) {
    var index = 0;
    var filters = app.get(Constants.KEYWORDS.RPC_SERVER_AFTER_FILTER) || [];
    var next = function(err) {
      if (index >= filters.length) {
        cb(err, resp);
        return;
      }

      var filter = filters[index++];

      if (filter instanceof Function) {
        filter(err, msg, session, resp, next);
        return;
      }

      if (filter.after instanceof Function) {
        filter.after(err, msg, session, resp, next);
        return;
      }

      cb(new Error('invalid rpc server after filter'));
    }
    next(err);
  };

  var Dispatcher = opts.Dispatcher || app.require('node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/dispatcher.js');

  var __route = function(tracer, req, msg, session, cb) {
    tracer.info('server', __filename, 'route', 'route messsage to appropriate service object');
    var namespace = this.services[req.namespace];
    if (!namespace) {
      tracer.error('server', __filename, 'route', 'no such namespace:' + req.namespace);
      cb(new Error('no such namespace:' + req.namespace));
      return;
    }

    var service = namespace[req.service];
    if (!service) {
      tracer.error('server', __filename, 'route', 'no such service:' + req.service);
      cb(new Error('no such service:' + req.service));
      return;
    }

    var method = service[req.method];
    if (!method) {
      tracer.error('server', __filename, 'route', 'no such method:' + req.method);
      cb(new Error('no such method:' + req.method));
      return;
    }

    var args = req.args.slice(0);
    if (req.namespace === 'sys') {
      args.push(cb);
      method.apply(service, args);
      return;
    }

    if (args.length !== 2) {
      tracer.error('server', __filename, 'route', 'just support request format like (msg, session, next):' + req.method);
      cb(new Error('just support request format like (msg, session, next):' + req.method));
      return;
    }

    method.call(service, msg, session, cb);
  }

  Dispatcher.prototype.route = function(tracer, msg, cb) {

    var self = this;
    var req = msg;
    var session = msg.args[1];
    var __route__ = [msg.serverType, msg.service, msg.method].join('.');
    msg = msg.args[0];
    msg.__route__ = __route__;
    msg.namespace = req.namespace;

    var originCB = cb;
    var cb = function(err, resp) {
      if (err) {
        var errorHandler = app.get('errorHandler');
        if (errorHandler) {
          errorHandler(err, msg, resp, session, function(err, resp) {
            originCB.apply(null, [err, resp].concat(Array.prototype.slice.call(arguments, 2)));
          });
          return;
        }
      }

      originCB.apply(null, Array.prototype.slice.call(arguments, 0));
    }

    var handle = function(err, resp) {
      if (!!err) {
        afterFilter(tracer, err, msg, session, resp, cb);
        return;
      }

      try {
        __route.call(self, tracer, req, msg, session, function(err, resp) {
          afterFilter(tracer, err, msg, session, resp, cb);
        });
      } catch (e) {
        console.error('catch remote error:', e, e.stack);
        afterFilter(tracer, e, msg, session, null, cb);
      }
    }

    beforeFilter(tracer, msg, session, handle);
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