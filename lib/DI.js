var path = require('path')
var require_ = _path => require('require-without-cache')(path.resolve(process.cwd(), _path), require)

var Services = {} // shared
var Providers = {}

var ARROW_ARG = /^([^\(]+?)=>/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function extractArgs(fn) {
	var fnText = Function.prototype.toString.call(fn).replace(STRIP_COMMENTS, '')
	var args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS)
	return args[1].replace(/ /g, '').split(',').filter(x => x.length)
}
function getInjection(req, res) {
	return inj => {
		if (typeof Providers[inj] === typeof '') Providers[inj] = require_(Providers[inj])
		if (typeof Services[inj] === typeof '') Providers[inj] = new (require_(Providers[inj]))
		if (Providers[inj]) return Providers[inj](req, res)
		if (Services[inj]) return Services[inj]
		
		if (require('../config').restrictedDependencies === false) return require(inj)
		throw new Error('Dependence ' + inj + ' not found')
	}
}

module.exports = _Services => _Providers => {
	Providers = _Providers || {}
	Services = _Services || {}
	return (fn, req, res) => {
		if (typeof fn === typeof '') fn = require_(fn)
		var injs = extractArgs(fn)
		return injs.length ?
			Promise.all(
				injs.map(getInjection(req, res))
			).then(
				args => fn(...args),
				reject => {throw reject}
			) : fn()
	}
}