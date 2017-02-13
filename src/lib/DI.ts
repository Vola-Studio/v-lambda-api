import { resolve } from 'path'
import rqwc = require('require-without-cache')

const reRequire = path => rqwc(resolve(process.cwd(), path), require)

const ARROW_ARG = /^([^\(]+?)=>/
const FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
function extractArgs(fn) {
	// Remove comments
	const fnText: string = Function.prototype.toString.call(fn).replace(STRIP_COMMENTS, '')

	// Get Args from "=>" or "function () {}"
	let args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS)
	return args[1].replace(/ /g, '').split(',').filter(x => x.length)
}

export class DI {
	constructor (public Services, public Providers) {}
	async resolve(fn: Function | string, preDefinedInjections: Object) {
		let [[body, resolved], needFuther] = this.__resolveHelper(fn, preDefinedInjections)

		if (needFuther) {
			let data: Array<any> = await Promise.all(resolved.map(dep => this.resolve(dep, preDefinedInjections)))
			return await body(...data)
		}
		else return body
	}

	providerResolver(provider: string): [Function, string[]] {
		if(typeof this.Providers[provider] == 'string')
			this.Providers[provider] = reRequire(this.Providers[provider])
		if(this.Providers[provider])
			return [this.Providers[provider], extractArgs(this.Providers[provider])]
		else return null
	}

	serviceResolver(service: string): [Function, undefined[]] {
		if(typeof this.Services[service] == 'string')
			this.Services[service] = new (reRequire(this.Services[service]))
		if(this.Services[service])
			return [this.Services[service], []]
		else return null
	}

	appResolver(app: Function): [Function, string[]] {
		return [app, extractArgs(app)]
	}

	// Pre-defined deps and Services can not have dependencies
	// Resolve order: Function > Pre-defined > Providers > Services
	__resolveHelper(fn: Function | string, preDefinedInjections: Object): [[Function, string[]], Boolean] {
		let result

		if(fn instanceof Function) return [this.appResolver(fn), true]
		if(preDefinedInjections[fn]) return [[preDefinedInjections[fn], []], false]
		if(result = this.providerResolver(fn)) return [result, true]
		if(result = this.serviceResolver(fn)) return [result, false]

		throw new ReferenceError(`No provider or service called "${fn}"`)
	}
}
