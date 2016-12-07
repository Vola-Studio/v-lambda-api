var Router = require('routes')
var http = require('http')
var https = require('https')
var url = require('url')

var require_ = path => require('require-without-cache')(path, require)

var lastLoadTime = new Date(0), configCache, settingsCache
var _ = {
	get mods() {
		if (lastLoadTime.getTime() + (_.settings.reloadDuration || 1000) < new Date().getTime()) {
			lastLoadTime = new Date()
			configCache = require_('./config')
		}
		return configCache
	},
	get settings() {
		if (lastLoadTime.getTime() + 1000 * 60 * 60 < new Date().getTime()) {
			lastLoadTime = new Date()
			settingsCache = require_('./config')
		}
		return settingsCache
	},
	router: new Router()
}
_.router.addRoute('/:ns/*?', a => {})
var DI = require('./lib/DI')(_.settings.services)

function execute (fn, url, req, res) {
	var send = code => result => {
		if (!res.statusCode) res.statusCode = code
		res.end(JSON.stringify(result))
	}
	try {
		var result = DI(_.mods.providers)(fn, req, res)
		if (result instanceof Promise) result.then(t => send(200), r => send(400))
		else send(200)(result)
	} catch (e) {
		send(500)({error: _.mods.outputErrors ? e.toString() : 'Server Internal Error'})
	}
}

function onRequest(req, res) {
	var match = _.router.match(url.parse(req.url).pathname) || {params: {ns: ''}, splats: []}
	var ns = match.params.ns
	var other = match.splats[0] || ''

	if (_.mods.namespaces[ns]) execute(_.mods.namespaces[ns], other, req, res)
	else {
		res.statusCode = 501
		res.end(JSON.stringify({error: 'Service not found'}))
	}
}

(_.settings.https ?
    https.createServer({
        key: fs.readFileSync(_.settings.https.key),
        cert: fs.readFileSync(_.settings.https.cert)
    }, onRequest) :
    
    http.createServer(onRequest)
)
.listen(
    _.settings.port || _.settings.https ? 443 : 80,
    _.settings.listen || '0.0.0.0'
)