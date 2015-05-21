'use strict';

var exp = module.exports;

exp.echo = function(msg, cb) {

	cb(null, msg);
}