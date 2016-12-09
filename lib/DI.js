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

function fget(fn, pre) {
	var name = fn
	if(fn instanceof Function) return [fn, extractArgs(fn), Function]
	if(pre[fn])
		return [pre[fn], []]

	if(typeof Providers[fn] == 'string') Providers[fn] = require_(Providers[fn])
	if(Providers[fn])
		return [Providers[fn], extractArgs(Providers[fn]), Function]

	if(typeof Services[fn] == 'string') Services[fn] = new (require_(Services[fn]))
	if(Services[fn])
		return [Services[fn], []]

	if(require('../config').restrictedDependencies == false)
		return [require(fn), []]

	throw new ReferenceError('No provider, service or npm module called "' + name + '"')
}

function rier(dep, tree, pre, doNotRecord) {
	//if(tree.indexOf(dep) !== -1)
	//	throw new ReferenceError('Can not resolve the dependence tree: ' + tree.join(' > ') + dep)
	
	tree = tree.copyWithin()
	!doNotRecord && tree.push(dep)

	dep = fget(dep, pre)
	return dep[2] === Function ? 
		Promise.all(dep[1].map(dep => rier(dep, tree, pre)))
				.then(data => dep[0](...data), reject => {throw reject})
		: dep[0]
}
module.exports = _Services => _Providers => {
	Providers = _Providers || {}
	Services = _Services || {}
	return (fn, req, res) => rier(
		require_(fn), [], {
			request: req,
			resolve: res
		}, true
	)
}