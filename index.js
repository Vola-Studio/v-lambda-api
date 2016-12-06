const Router = require('routes')
const http = require('http')
const https = require('https')
const url = require('url')

const require_ = path => require('require-without-cache')(path, require)

let lastLoadTime = new Date(0), configCache
const _ = {
	get mods() {
		if (lastLoadTime.getTime() + (_.settings.reloadDuration || 1000) < new Date().getTime()) {
			lastLoadTime = new Date()
			configCache = require_('./config')
		}
		return configCache
	},
	settings: require('./settings'),
	router: new Router()
}
_.router.addRoute('/:ns/*?', a => {})
const DI = require('./lib/DI')(_.settings.services)

function execute (fn, url, req, res) {
	const send = code => result => {
		if (!res.statusCode) res.statusCode = code
		res.end(JSON.stringify(result))
	}
	try {
		const result = DI(_.mods.providers)(fn, req, res)
		if (result instanceof Promise) result.then(t => send(200), r => send(400))
		else send(200)(result)
	} catch (e) {
		send(500)({error: _.mods.outputErrors ? e.toString() : 'Server Internal Error'})
	}
}

function onRequest(req, res) {
	const match = _.router.match(url.parse(req.url).pathname) || {params: {ns: ''}, splats: []}
	const ns = match.params.ns
	const other = match.splats[0] || ''

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