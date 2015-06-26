
##Usage

change app.js:
```
app.configure(function() {

  var rpcServerFilterPlugin = require('pomelo-rpc-server-filter-plugin');
  // just use the default Dispatcher
  app.use(rpcServerFilterPlugin); 
  // or use the specified Dispatcher
  //app.use(rpcServerFilterPlugin, {
  //  plugin: {
  //    Dispatcher: app.require('node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/dispatcher.js'), 
  //  }
  //}); 

  app.rpcServerBefore(function(msg, next) {
    logger.debug('rpc server before filter 1:', app.getServerId(), msg);
    next();
  });

  app.rpcServerAfter(function(err, msg, resp, next) {
    logger.debug('rpc server after filter 1:', app.getServerId(), err, msg, resp);
    next();
  });

  var RpcServerFilter = function() {

  }

  RpcServerFilter.prototype.before = function(msg, next) {
    logger.debug('rpc server before filter 2:', app.getServerId(), msg);
    next();
  }

  RpcServerFilter.prototype.after = function(err, msg, resp, next) {
    logger.debug('rpc server after filter 2:', app.getServerId(), err, msg, resp);
    next();
  }

  app.rpcServerFilter(new RpcServerFilter());
});
```