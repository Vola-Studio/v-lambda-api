import { STATUS_CODES } from 'http'
export class ExtendableError extends Error {
	constructor(message) {
		super(message)
		this.name = this.constructor.name
		this.message = message
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor)
		} else { 
			this.stack = (new Error(message)).stack 
		}
	}
}

export class HTTPError extends ExtendableError {
	code: number
	constructor(code, message?) {
		super(message || STATUS_CODES[code])
		this.code = code
	}
}
