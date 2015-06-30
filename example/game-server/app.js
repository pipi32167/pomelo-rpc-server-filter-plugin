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

	app.rpcServerBefore(function(msg, session, next) {
		console.log('rpc server before filter 1:', app.getServerId(), msg, session);
		next();
	});

	app.rpcServerAfter(function(err, msg, resp, session, next) {
		console.log('rpc server after filter 1:', app.getServerId(), err, msg, session, resp);
		next(err);
	});

	app.rpcServerBefore(function(msg, session, next) {
		if (msg.__route__ !== 'echo.echoRemote.error2') {
			next();
			return;
		}
		console.log('rpc server before filter 2:', app.getServerId(), msg, session);
		next(new Error('error2.1'), {
			code: 2
		});
	});

	app.rpcServerAfter(function(err, msg, session, resp, next) {
		if (msg.__route__ !== 'echo.echoRemote.error2') {
			next(err);
			return;
		}
		console.log('rpc server after filter 2:', app.getServerId(), err, msg, session, resp);
		next(new Error('error2.2'));
	});

	var RpcServerFilter = function() {

	}

	RpcServerFilter.prototype.before = function(msg, session, next) {
		console.log('rpc server before filter 3:', app.getServerId(), msg, session);
		next();
	}

	RpcServerFilter.prototype.after = function(err, msg, resp, session, next) {
		console.log('rpc server after filter 3:', app.getServerId(), err, msg, session, resp);
		next(err);
	}

	app.rpcServerFilter(new RpcServerFilter());
});
// start app
app.start();

// app.set('errorHandler', function (err, msg, resp, session, cb) {
// 	console.error('errorHandler', err, msg, resp, session, cb);
// 	cb(null, resp || {
// 		code: 100
// 	});
// })

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});