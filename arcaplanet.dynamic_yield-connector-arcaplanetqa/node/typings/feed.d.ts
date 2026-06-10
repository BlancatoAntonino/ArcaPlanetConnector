interface ConvertedXMLData {
  products: {
    product: XMLDataProduct[]
  }
}

interface XMLDataProduct {
  id_product: { _cdata: string }
  availability: { _cdata: string }
  status: { _cdata: string }
  [key: string]: { _cdata?: string }
}

interface FeedStatus {
  completed: boolean
  error: boolean
  locale?: string
  entries?: number
  startedAt?: string
  finishedAt?: string
}

interface SalesChannel{
  id: string
  name: string
}

interface CreateFeedParams {
  ctx: Context
}
