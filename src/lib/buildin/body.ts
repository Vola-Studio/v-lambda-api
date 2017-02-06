import { IncomingMessage } from 'http'
import { parse } from 'querystring'

export const body = (request: IncomingMessage) => new Promise(resolve => {
	let body = ''
	if (request.method == 'POST') {
		request.on('data', (data) => {
			body += data
			if (body.length > 1e7) request.connection.destroy()
			// 10 mb
		})

		request.on('end', () => {
			try {body = JSON.parse(body)} catch (e) {
				body = parse(body)
			}
			resolve(body)
		})
	} else resolve({})
})
