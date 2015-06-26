'use strict';

module.exports = function(app, http) {
	http.get('/echo', function(req, res) {
		console.log('begin');
		app.rpc.echo.echoRemote.echo({}, req.body.msg, function(err, resp) {
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
		app.rpc.echo.echoRemote.error({}, req.body.msg, function(err, resp) {
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
}