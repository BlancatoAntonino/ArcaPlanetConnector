import PropTypes from 'prop-types'

export const DY_Config = PropTypes.shape({
	account: PropTypes.string,
	apiKey: PropTypes.string,
	apiSecret: PropTypes.string,
	vtexApiKey: PropTypes.string,
	vtexApiToken: PropTypes.string,
	prefixAffiliateID: PropTypes.string,
	boolSandbox: PropTypes.bool,
	salesChannel: PropTypes.string,
	productSpecifications: PropTypes.string,
	skuSpecifications: PropTypes.string,
	flagExportDisableSKU: PropTypes.bool,
	flagExportOutOfStockSKU: PropTypes.bool,
	flagCheckValidGTIN: PropTypes.bool,
	listExludedSkus: PropTypes.string,
	feedFormat: PropTypes.string,
	lastDateGenerated: PropTypes.string,
	domainShop: PropTypes.string,
	xmlProductIds: PropTypes.string

})

export const DY_ConfigInput = PropTypes.shape({
	account: PropTypes.string,
	apiKey: PropTypes.string,
	apiSecret: PropTypes.string,
	vtexApiKey: PropTypes.string,
	vtexApiToken: PropTypes.string,
	prefixAffiliateID: PropTypes.string,
	boolSandbox: PropTypes.bool,
	salesChannel: PropTypes.string,
	productSpecifications: PropTypes.string,
	skuSpecifications: PropTypes.string,
	flagExportDisableSKU: PropTypes.bool,
	flagExportOutOfStockSKU: PropTypes.bool,
	listExludedSkus: PropTypes.string,
	flagCheckValidGTIN: PropTypes.bool,
	feedFormat: PropTypes.string,
	domainShop: PropTypes.string,
	xmlProductIds: PropTypes.string
})

export const OrderLengow = PropTypes.shape({
	orderID: PropTypes.string,
	marketPlace: PropTypes.string,
	total: PropTypes.number,
	date: PropTypes.string
})

export const LogDY = PropTypes.shape({
	orderID: PropTypes.string,
	type: PropTypes.string,
	msg: PropTypes.string,
	date: PropTypes.string
})

export const LengowSKU = PropTypes.shape({
	id: PropTypes.number, 
	sku: PropTypes.string
})

export const SalesChannel = PropTypes.shape({
	Id: PropTypes.number,
	Name: PropTypes.string
})


export const Query = PropTypes.shape({
  	DY_Config: DY_Config,
	salesChannel: [SalesChannel],
	accountDomainHosts: [String],
	logsDY: [LogDY]
})

export const Mutation = PropTypes.shape({
	saveDynamicYieldConfig(config)
})

