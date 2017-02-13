function wait(second: number) {
	return new Promise(resolve => setTimeout(resolve, second * 1000))
}
export = async () => {
	await wait(2)
	return 'Promise OK'
}
