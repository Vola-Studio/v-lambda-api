class ExtendableError extends Error {
	constructor(message, ...args) {
		super(message, ...args)
		this.name = this.constructor.name
		this.message = message
		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor)
		} else { 
			this.stack = (new Error(message)).stack 
		}
	}
}

module.exports.HTTPError = class HTTPError extends ExtendableError {
	constructor(code, message, ...args) {
		super(message, ...args)
		this.code = code
	}
}

module.exports.CustomResponse = class CustomResponse {
	constructor(code, message, headers) {
		this.code = code
		this.headers = headers
		this.message = message
	}
}
