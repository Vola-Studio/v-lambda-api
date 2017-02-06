import Router from 'routes'
import { createServer as httpCreateServer, ServerResponse, IncomingMessage, STATUS_CODES } from 'http'
import { createServer as httpsCreateServer } from 'https'
import { parse } from 'url'
import { watch, readFileSync } from 'fs'
import require_without_cache from 'require-without-cache'

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

async function executeApp (fn: Function, request: IncomingMessage, response: ServerResponse) {
	const result = await di.resolve(fn, {request, response})
	if (result instanceof preBuilds.ExtendableError) {
		throw result
	} else {
		response.statusCode = 200
		response.end(JSON.stringify(result))
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
			else if (!(app instanceof Function)) throw new preBuilds.HTTPError(405)
			
			await executeApp(app, req, res)
		} else throw new preBuilds.HTTPError(502)
	} catch(e) {
		if(e instanceof preBuilds.HTTPError) {
			res.statusCode = e.code
			res.end({error: e.message})
		}
		res.statusCode = 500
		res.end({error: _.config.outputErrors ? e.toString() : STATUS_CODES[500]})
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
