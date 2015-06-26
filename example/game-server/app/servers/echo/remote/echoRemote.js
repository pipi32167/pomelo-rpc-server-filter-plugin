'use strict';

var exp = module.exports;

exp.echo = function(msg, cb) {

	cb(null, msg);
}

exp.error = function(cb) {
	throw new Error('test error');
}