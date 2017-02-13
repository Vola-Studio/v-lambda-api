#!/usr/bin/env node

let argv = process.argv.slice(2)
let configPath

if(argv[0] == '-c') {
	configPath = argv[1]
	argv = argv.slice(2)
} else configPath = require('application-config-path')('v-lambda-api.json')
let conf
try {conf = JSON.parse(require('fs').readFileSync(configPath))} catch (e) {
	console.log('No config file found. Make some changes and we will save it.')
	conf = {restrictedDependencies: false, namespaces: {}, providers: {}, outputErrors: false, services: {}, https: false}
}

function resolve (x) {return require('path').resolve(process.cwd(), x)}
function gen(t) {
	return {
		mount: save((name, path) => conf[t][name] = resolve(path)),
		unmount: save(name => conf[t][name] = undefined),
		list: name => {
			for(let k in conf[t]) console.log(k, ' ', conf[t][k])
		}
	}
}
function help() {
'Available commands:,\
help,\
debug [on|off],\
[app|provider|service] mount name path,\
[app|provider|service] unmount name,\
[app|provider|service] list,\
deps [on|off],\
port portNumber,\
https set key cert,\
https off,\
listen ip,\
config\
'.split(',').forEach(h => console.log(h))
}
let commands = {
	help: help,
	debug: {
		off: save(() => conf.outputErrors = false),
		on: save(() => conf.outputErrors = true)
	},
	provider: gen('providers'),
	app: gen('namespaces'),
	service: gen('services'),
	deps: {
		off: save(() => conf.restrictedDependencies = false),
		on: save(() => conf.restrictedDependencies = conf.restrictedDependencies || [])
	},
	port: save(i => conf.port = parseInt(i)),
	https: {
		set: save((k, c) => conf.https = {key: resolve(k), cert: resolve(c)}),
		off: save(() => conf.https = false)
	},
	listen: save(i => conf.listen = i),
	show: () => {
		console.log('Store at: ' + configPath)
		console.log(conf)
	},
	config: () => {
		console.log('Config file will be stored at:')
		console.log(configPath)
	}
}

let exec = () => console.log('help')
if (!(argv[0] in commands)) argv[0] = 'help'
while (argv[0] in commands) {
	if (typeof commands[argv[0]] == 'function') {
		commands[argv[0]].apply(undefined, argv.slice(1))
		argv = []
		break
	}
	commands = commands[argv[0]]
	argv = argv.slice(1)
}
if (argv.length) help()

function save(fn) {
	return (...args) => {
		fn(...args)
		require('fs').writeFileSync(configPath, JSON.stringify(conf))
	}	
}