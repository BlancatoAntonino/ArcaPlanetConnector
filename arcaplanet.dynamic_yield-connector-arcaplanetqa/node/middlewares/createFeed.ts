import { diff } from 'json-diff-ts';
import { createFeed as createFeedUtil } from '../utils/createFeed';
import { stringify } from '../utils/functions';

export async function createFeed(ctx: Context, next: () => Promise<void>) {
  const {
    vtex: { logger },
  } = ctx
  try {

    await createFeedUtil({ ctx })

    await next()
  } catch (error) {

    logger.error({
      message: 'In createFeed.ts. CATCH ERROR',
      detail: {
        data: error.message,
      },
    })
    ctx.status = 404
    ctx.body = `Error: ${error.message}`

  }
}

// Duplicate function to create a delta feed
// This function is used to define the delta feed based on the current and updated feeds
//
export async function createDeltaFeed(ctx: Context, next: () => Promise<void>) {

  const {
    query: { delta = 'true' },
    state: { adminSettings: { vtexSettings: { fullHours } } }
  } = ctx

  try {

    const currentHour = JSON.stringify((new Date().getHours()) + 2);
    const isDelta = fullHours?.split(",")?.includes(currentHour) ? false : (delta === "true")

    await createFeedUtil({ ctx }, isDelta)
    await next()

  } catch (error) {

    ctx.state.logger.error(
      `Generate feed - OperationID: ${ctx.state.operationId} - Error:` + stringify(error)
    );
    ctx.status = 404
    ctx.body = `Error: ${error.message}`

  }
}

export function defineDeltaFeed(currentFeed: any[], updatedFeed: any[]) {

  try {

    // Crea una mappa SKU -> prodotto per il feed corrente
    const currentMap = new Map<string, any>();
    for (const product of currentFeed) {
      if (product?.sku) currentMap.set(product.sku, product);
    }

    // Crea una mappa SKU -> prodotto per il feed aggiornato
    const updatedMap = new Map<string, any>();
    for (const product of updatedFeed) {
      if (product?.sku) updatedMap.set(product.sku, product);
    }

    const ProductsToUpdate: any[] = [];
    const ProductsToDelete: any[] = [];

    // Prodotti da aggiornare/inserire
    for (const [sku, updatedProduct] of updatedMap.entries()) {
      const oldProduct = currentMap.get(sku);
      if (!oldProduct || diff(oldProduct, updatedProduct).length > 0) {
        ProductsToUpdate.push(updatedProduct);
      }
    }

    // Prodotti da eliminare
    for (const [sku, oldProduct] of currentMap.entries()) {
      if (!updatedMap.has(sku)) {
        ProductsToDelete.push(oldProduct);
      }

    }

    // Svuota le mappe per liberare memoria
    currentMap.clear();
    updatedMap.clear();

    return { ProductsToUpdate, ProductsToDelete };

  } catch (error) {

    throw new Error(`Error defining delta feed: ${error.message}`);

  }
}