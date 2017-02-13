export = {
	POST: (body) => {
		return {echo: body}
	},
	GET: (HTTPError) => new HTTPError(404)
}