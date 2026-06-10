import { getProductIdsFromXML, stringify } from '../utils/feedutils'
import { getProductsXML } from '../utils/tempFeedUtil'

export async function updateBaseProductIds(ctx: Context) {
  const {
    clients: { feedManager },
  } = ctx

  let productIds: string[] = []

  try {
    const xmlDataResponse = await getProductsXML(ctx)

    productIds = getProductIdsFromXML(xmlDataResponse)

    ctx.state.logger.info(`Update productBase feed - STARTED --Details: Product to be processed = ${productIds.length}`)

    const removedDuplicates = productIds.filter((element, index) => {
      return productIds.indexOf(element) === index
    })

    feedManager.saveProductIds(removedDuplicates)

    ctx.status = 200

  } catch (error) {
    let msg = error.response?.data ? (stringify(error.response?.data)) : (stringify(error));

    ctx.state.logger.error(`Update productBase - Error:` + msg);
    ctx.status = 500;
  }

}

export async function getActiveSkuIds(ctx: Context, next: () => Promise<void>) {

  try {

    const data = await ctx.clients.vbase.getJSON("dynamic-yield", "skuIds_active");

    ctx.set("cache-control", "s-maxage=120, stale-while-revalidate=5400");

    ctx.body = data;
    ctx.status = 200;

    await next()

  } catch (error) {
    let msg = error.response?.data ? (stringify(error.response?.data)) : (stringify(error));

    ctx.state.logger.error(`Get Active SkuIds - Error:` + msg);
    ctx.status = 500;
  }
}