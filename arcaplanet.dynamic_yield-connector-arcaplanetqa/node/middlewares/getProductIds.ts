import { getProductIdsFromXML, stringify } from '../utils/feedutils'
import { getProductsXML } from '../utils/tempFeedUtil'

export async function getProductIds(ctx: Context, next: () => Promise<void>) {
  const {
    clients: { feedManager },
  } = ctx

  try {
    let productIds = await feedManager.getProductIds()
    
    if (!productIds?.length) {
      const xmlDataResponse = await getProductsXML(ctx)
      productIds = getProductIdsFromXML(xmlDataResponse)

      await feedManager.saveProductIds(productIds)
    }

    if (!productIds) {
      throw new Error("Error generating the feed. There's no product ids on XML data")
    }
    ctx.state.productIds = productIds

    await next()

  } catch (error) {

    let msg = error.response?.data ? (stringify(error.response?.data)) : (stringify(error));

    ctx.state.logger.error(`Get productIds - Error:` + msg);
    ctx.status = 500;
  }

}
