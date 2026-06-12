interface AppSettings {
  account: string
  apiKey: string
  apiSecret: string
  vtexApiKey: string
  vtexApiToken: string
  prefixAffiliateID: string
  boolSandbox: boolean
  salesChannel: string
  locales: string
  productSpecifications: string
  skuSpecifications: string
  flagExportDisableSKU: boolean
  flagExportOutOfStockSKU: boolean
  flagCheckValidGTIN: boolean
  listExludedSkus: string
  feedFormat: string
  domainShop: string
}

interface DynamicYieldSettings {
  hostName: string
  feedId: string
  dynamicYieldSectionId: string
  api_key: string
  productBatchSize: number
  isFranchiseStock_Enabled: boolean
}

interface VtexSettings {
  batchSellerSize: number
  sellerIndex_Start: number
  sellerIndex_End: number
  isRangeFetch_Enabled: boolean
  sellerIndexToFetch: string
  fullHours: string
}
interface AdminSettings {
  vtexSettings: VtexSettings
  dynamicYield: DynamicYieldSettings
}
