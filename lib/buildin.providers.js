module.exports = {
	body: request => new Promise(resolve => {
		var body = ''
		if (request.method == 'POST') {
			request.on('data', (data) => {
				body += data
				if (body.length > 1e7) request.connection.destroy()
				// 10 mb
			})

			request.on('end', () => {
				try {body = JSON.parse(body)} catch (e) {
					body = require('querystring').parse(body)
				}
				resolve(body)
			})
		} else resolve({})
	})
}