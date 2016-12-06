const path = require('path')
const require_ = _path => require('require-without-cache')(path.resolve(process.cwd(), _path), require)

let Services = {} // shared
let Providers = {}

const ARROW_ARG = /^([^\(]+?)=>/;
const FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function extractArgs(fn) {
	const fnText = Function.prototype.toString.call(fn).replace(STRIP_COMMENTS, '')
	const args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS)
	return args[1].replace(' ', '').split(',').filter(x => x.length)
}
function getInjection(req, res) {
	return inj => {
		if (typeof Providers[inj] === typeof '') Providers[inj] = require_(Providers[inj])
		if (typeof Services[inj] === typeof '') Providers[inj] = new (require_(Providers[inj]))
		if (Providers[inj]) return Providers[inj](req, res)
		if (Services[inj]) return Services[inj]
		
		if (require('../config').restrictedDependencies === false
		 || require('../config').restrictedDependencies.indexOf(inj) !== -1) return require(inj)
		throw new Error('Dependence ' + inj + ' not found')
	}
}

module.exports = _Services => _Providers => {
	Providers = _Providers || {}
	Services = _Services || {}
	return (fn, req, res) => {
		if (typeof fn === typeof '') fn = require_(fn)
		const injs = extractArgs(fn)
		return injs.length ? fn(...injs.map(getInjection(req, res))) : fn()
	}
}