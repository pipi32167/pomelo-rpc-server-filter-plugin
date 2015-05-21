var pomelo = require('pomelo');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'example');

// app configuration
app.configure('production|development', 'connector', function() {
	var httpPlugin = require('pomelo-http-plugin');
	var httpConfig = app.require('./config/http.json')[app.get('env')].connector;
	app.use(httpPlugin, {
		http: httpConfig
	});
});

app.configure('production|development', 'echo', function() {

	var rpcServerFilterPlugin = require('../../index');
	// just use the default Dispatcher
	app.use(rpcServerFilterPlugin);
	// or use the specified Dispatcher
	//app.use(rpcServerFilterPlugin, {
	//  plugin: {
	//    Dispatcher: app.require('node_modules/pomelo/node_modules/pomelo-rpc/lib/rpc-server/dispatcher.js'), 
	//  }
	//}); 

	app.rpcServerBefore(function(msg, next) {
		console.log('rpc server before filter 1:', app.getServerId(), msg);
		next();
	});

	app.rpcServerAfter(function(msg, resp, next) {
		console.log('rpc server after filter 1:', app.getServerId(), msg, resp);
		next();
	});

	var RpcServerFilter = function() {

	}

	RpcServerFilter.prototype.before = function(msg, next) {
		console.log('rpc server before filter 2:', app.getServerId(), msg);
		next();
	}

	RpcServerFilter.prototype.after = function(msg, resp, next) {
		console.log('rpc server after filter 2:', app.getServerId(), msg, resp);
		next();
	}

	app.rpcServerFilter(new RpcServerFilter());
});
// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});