'use strict';

module.exports = function(app, http) {
	http.get('/echo', function(req, res) {
		console.log('begin');
		var session = {};
		var msg = req.body;
		app.rpc.echo.echoRemote.echo(session, msg, session, function(err, resp) {
			console.log(err, resp);

			if (!!err) {
				res.send({
					error: err
				});
				return;
			}

			console.log('end');
			res.send(resp);
		});
	})

	http.get('/error', function(req, res) {
		console.log('begin');
		var session = {};
		var msg = {};
		app.rpc.echo.echoRemote.error(session, msg, session, function(err, resp) {
			if (!!err) {
				console.error(err);
				res.send({
					code: 1
				});
				return;
			}

			console.log('end');
			res.send(resp);
		});
	})

	http.get('/error2', function(req, res) {
		console.log('begin');
		var session = {};
		var msg = {};
		app.rpc.echo.echoRemote.error2(session, msg, session, function(err, resp) {
			if (!!err) {
				console.error(err);

				if (resp) {
					res.send(resp);
				} else {
					res.send({
						code: 1
					});
				}
			}

		});
	})

}