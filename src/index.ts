import Router = require('routes')
import { createServer as httpCreateServer, ServerResponse, IncomingMessage, STATUS_CODES } from 'http'
import { createServer as httpsCreateServer } from 'https'
import { parse } from 'url'
import { watch, readFileSync } from 'fs'
import require_without_cache = require('require-without-cache')

import { DI } from './lib/DI'
import * as preBuilds from './lib/buildin'

const reRequire = (path: string) => require_without_cache(path, require)

/* Load config */
const configPath = process.argv[2] || require('application-config-path')('v-lambda-api.json')

let _ = {
	config: reRequire(configPath),
	router: new Router()
}
let di = new DI(_.config.services, Object.assign(_.config.providers, preBuilds))

function reloadConfig() {
	try {
		_.config = reRequire(configPath)
		di = new DI(_.config.services, Object.assign(_.config.providers, preBuilds))
	} catch (e) {
		setTimeout(() => reloadConfig(), 1000)
	}
}
watch(configPath, reloadConfig)

/* HTTP Server here */
_.router.addRoute('/:ns/*?', a => {})

async function executeApp (fn: Function, request: IncomingMessage, response: ServerResponse, name: string) {
	const result = await di.resolve(fn, {request, response, _this: name})
	if (result instanceof Error) {
		throw result
	} else if (!(result instanceof Buffer)) {
		response.statusCode = 200
		response.end(JSON.stringify(result))
	} else {
		response.statusCode = 200
		response.end(result)
	}
}

async function onRequest(req: IncomingMessage, res: ServerResponse) {
	const match = _.router.match(parse(req.url).pathname) || {params: {ns: ''}, splats: []}
	
	const ns = match.params.ns
	// const restUrl = match.splats[0] || ''

	try {
		if (_.config.namespaces[ns]) {
			let app = reRequire(_.config.namespaces[ns])

			// Support for REST
			if(app[req.method] instanceof Function) app = app[req.method]
			else if (!(app instanceof Function)) throw new preBuilds._HTTPError(405)
			
			await executeApp(app, req, res, ns)
		} else throw new preBuilds._HTTPError(502)
	} catch(e) {
		if(e instanceof preBuilds._HTTPError) {
			res.statusCode = e.code
			res.end(JSON.stringify({error: e.message}))
		}
		else {
			res.statusCode = 500
			res.end(JSON.stringify({error: _.config.outputErrors ? e.toString() : STATUS_CODES[500]}))
		}
	}
}

// Start Server
(_.config.https ?
    httpsCreateServer({
        key: readFileSync(_.config.https.key),
        cert: readFileSync(_.config.https.cert)
    }, onRequest) :
    
    httpCreateServer(onRequest)
).listen(
    _.config.port || (_.config.https ? 443 : 80),
    _.config.listen || '0.0.0.0'
)
