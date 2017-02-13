import { STATUS_CODES } from 'http'
export class _ExtendableError extends Error {
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
export const ExtendableError = () => _ExtendableError

export const HTTPError = () => _HTTPError
export class _HTTPError extends _ExtendableError {
	code: number
	constructor(code, message?) {
		super(message || STATUS_CODES[code])
		this.code = code
	}
}
