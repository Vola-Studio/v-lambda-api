var Router = require('routes')
var http = require('http')
var https = require('https')
var url = require('url')
var require_ = path => require('require-without-cache')(path, require)
var fs = require('fs')
var buildins = require('./lib/buildin.providers.js')
var configPath = process.argv[2] || require('application-config-path')('v-lambda-api.json')

var _ = {config: require_(configPath),router: new Router()}
var DI = require('./lib/DI')
var di = DI(_.config.services)(Object.assign(_.config.providers, buildins))

function reloadConfig() {
	try {
		_.config = require_(configPath)
		di = DI(_.config.services)(Object.assign(_.config.providers, buildins))
	} catch (e) {
		setTimeout(() => reloadConfig(), 1000)
	}
}
fs.watch(configPath, reloadConfig)

_.router.addRoute('/:ns/*?', a => {})

function execute (fn, url, req, res) {
	var cr = require('./lib/buildin.status.js').CustomResponse
	var he = require('./lib/buildin.status.js').HTTPError
	var send = defaultCode => result => {
		if(result instanceof cr || result instanceof he) {
			res.statusCode = result.code
			res.end(result.message)
		} else {
			res.statusCode = defaultCode
			res.end(JSON.stringify(result))
		}
	}
	try {
		var result = di(fn, req, res)
		if (result instanceof Promise) result.then(send(200), send(500))
		else send(200)(result)
	} catch (e) {
		send(500)({error: _.config.outputErrors ? e.toString() : 'Server Internal Error'})
	}
}

function onRequest(req, res) {
	var match = _.router.match(url.parse(req.url).pathname) || {params: {ns: ''}, splats: []}
	var ns = match.params.ns
	var other = match.splats[0] || ''

	if (_.config.namespaces[ns]) execute(_.config.namespaces[ns], other, req, res)
	else {
		res.statusCode = 501
		res.end(JSON.stringify({error: 'Service not found'}))
	}
}

(_.config.https ?
    https.createServer({
        key: fs.readFileSync(_.config.https.key),
        cert: fs.readFileSync(_.config.https.cert)
    }, onRequest) :
    
    http.createServer(onRequest)
)
.listen(
    _.config.port || (_.config.https ? 443 : 80),
    _.config.listen || '0.0.0.0'
)
