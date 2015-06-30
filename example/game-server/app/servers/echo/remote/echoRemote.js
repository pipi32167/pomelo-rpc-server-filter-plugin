'use strict';

var exp = module.exports;

exp.echo = function(msg, session, next) {
	console.log(arguments);

	next(null, {
		code: 0,
		msg: msg.msg
	});
}

exp.error = function(msg, session, next) {
	throw new Error('test error');
}

exp.error2 = function(msg, session, next) {
	next(null, {
		code: 0
	});
}