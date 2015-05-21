'use strict';

module.exports = function(app, http) {
	http.get('/echo', function(req, res) {
		app.rpc.echo.echoRemote.echo({}, req.body.msg, function(err, resp) {
			if (!!err) {
				res.send({
					error: err
				});
				return;
			}

			res.send(resp);
		});
	})
}