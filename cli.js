#!/usr/bin/env node

var argv = process.argv.slice(2)
var conf = require('./config.json')

function resolve (x) {return require('path').resolve(process.cwd(), x)}
function gen(t) {
	return {
		mount: (name, path) => conf[t][name] = resolve(path),
		unmount: name => conf[t][name] = undefined,
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
deps [on|off]\
'.split(',').forEach(h => console.log(h))
}
var commands = {
	help: help,
	debug: {
		off: () => conf.outputErrors = false,
		on: () => conf.outputErrors = true
	},
	provider: gen('providers'),
	app: gen('namespaces'),
	service: gen('services'),
	deps: {
		off: () => conf.restrictedDependencies = false,
		on: () => conf.restrictedDependencies = conf.restrictedDependencies || [],
		/*mount: name => conf.restrictedDependencies && conf.restrictedDependencies.push(name),
		unmount: name => {
			if (conf.restrictedDependencies)
				conf.restrictedDependencies = conf.restrictedDependencies.filter(v => v == name)
			else console.log('Restricted Dependencies is not on')
		},
		list: name => conf.restrictedDependencies.forEach(v => console.log(v))*/
	}
}

var exec = () => console.log('help')
if (!(argv[0] in commands)) argv[0] = 'help'
while (argv[0] in commands) {
	if (typeof commands[argv[0]] == 'function') {
		commands[argv[0]].apply(undefined, argv.slice(1))
		require('fs').writeFileSync('./config.json', JSON.stringify(conf))
		argv = []
		break
	}
	commands = commands[argv[0]]
	argv = argv.slice(1)
}
if (argv.length) help()