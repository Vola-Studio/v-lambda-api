export = (base, provider2, service, _this) => {
	return {
		base, provider2, service, value: service.value, hey: service.hey(), _this
	}
}