export = class Service {
	time: Date
	constructor() {
		this.time = new Date()
		console.log("Service constructed.")
	}
	hey() {
		return `This service is created ${new Date().getTime() - this.time.getTime()}ms ago`
	}
}