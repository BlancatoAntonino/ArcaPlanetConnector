import axios from 'axios'

export const getProductsXML = async (ctx: Context) => {
  const {
    vtex: { account, authToken },
  } = ctx

  const response = await axios.get(
    `http://${account}.myvtex.com/XMLData/lengow_connector.xml`,
    {
      headers: {
        'Proxy-Authorization': authToken,
        'X-Vtex-Proxy-To': `http://${account}.myvtex.com`,
      },
    }
  )

  if (!response || !response.data) {
    return null
  }

  return response.data
}

export const getProductsFromCatalog = async (
  ctx: Context,
  productId: string,
  sc: string
) => {
  const {
    vtex: { account, authToken },
  } = ctx

  const response = await axios.get(
    `http://${account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?fq=productId:${productId}&sc=${sc}`,
    {
      headers: {
        'Proxy-Authorization': authToken,
        'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      },
    }
  )

  if (!response || !response.data) {
    return null
  }

  return response.data
}
