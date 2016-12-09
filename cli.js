#!/usr/bin/env node

var argv = process.argv.slice(2)
var conf
try {conf = JSON.parse(require('fs').readFileSync(__dirname + '/config.json'))} catch (e) {
	conf = {restrictedDependencies: false, namespaces: {}, providers: {}, outputErrors: false, services: {}, https: false}
}

function resolve (x) {return require('path').resolve(process.cwd(), x)}
function gen(t) {
	return {
		mount: save((name, path) => conf[t][name] = resolve(path)),
		unmount: save(name => conf[t][name] = undefined),
		list: name => {
			for(var k in conf[t]) console.log(k, ' ', conf[t][k])
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
listen ip\
'.split(',').forEach(h => console.log(h))
}
var commands = {
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
		on: save(() => conf.restrictedDependencies = conf.restrictedDependencies || []),
		/*mount: name => conf.restrictedDependencies && conf.restrictedDependencies.push(name),
		unmount: name => {
			if (conf.restrictedDependencies)
				conf.restrictedDependencies = conf.restrictedDependencies.filter(v => v == name)
			else console.log('Restricted Dependencies is not on')
		},
		list: name => conf.restrictedDependencies.forEach(v => console.log(v))*/
	},
	port: save(i => conf.port = parseInt(i)),
	https: {
		set: save((k, c) => conf.https = {key: resolve(k), cert: resolve(c)}),
		off: save(() => conf.https = false)
	},
	listen: save(i => conf.listen = listen),
	show: () => console.log(conf)
}

var exec = () => console.log('help')
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
		require('fs').writeFileSync(__dirname + '/config.json', JSON.stringify(conf))
	}	
}