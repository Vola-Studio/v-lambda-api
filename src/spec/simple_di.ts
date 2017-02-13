import { IncomingMessage } from 'http';
export = (request: IncomingMessage, body) => Object.assign(request.headers, {url: request.url, data: body})