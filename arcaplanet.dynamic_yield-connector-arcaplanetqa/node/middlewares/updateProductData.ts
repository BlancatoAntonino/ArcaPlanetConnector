import { getMemoryUsageInfo, stringify, wait } from "../utils/functions";
import { MAX_RETRIES, MAX_TIME } from "../utils/constants";

export async function updateDY_Bulk(ctx: Context, next: () => Promise<void>) {
    try {
        interface Items {
            action: string;
            id: string;
            body?: {
                data: any;
            };
        }

        // Helper function to get chunk with retry
        async function getChunkWithRetry(path: string, retry = 0): Promise<any[]> {
            try {
                const chunk = await ctx.clients.feedManager.getFeedJSON(path);
                if (!Array.isArray(chunk)) {
                    throw new Error(`Chunk ${path} is not an array`);
                }
                return chunk;
            } catch (error) {
                if (retry < MAX_RETRIES) {
                    await wait(MAX_TIME * retry);
                    return getChunkWithRetry(path, retry + 1);
                }
                // After max retries, throw error - better to crash than send incomplete feed
                throw new Error(
                    `Failed to load chunk ${path} after ${MAX_RETRIES} retries: ${(error as any)?.message}`
                );
            }
        }

        // Lazy iterator that loads products from VBase chunk by chunk
        // This avoids loading all products in memory at once
        async function* productsFromVBaseIterator() {
            const vBase_ProductPaths = await ctx.clients.feedManager.getFeedJSON_Index();
            if (!vBase_ProductPaths || vBase_ProductPaths.length === 0) {
                throw new Error('No chunked feed index found. Feed may not be generated yet.');
            }

            // Load chunks sequentially to avoid memory spike
            for (const path of vBase_ProductPaths) {
                const chunk = await getChunkWithRetry(path);
                for (const product of chunk) {
                    yield product;
                }
            }
        }

        async function* allItemsIterator() {
            if (ctx.state.isDeltaMode === true) {   
                yield* updateItemsIterator(ctx.state.updatedFeed || []);
                if (ctx.state.productsToDelete && ctx.state.productsToDelete.length > 0) {
                    yield* deleteItemsIterator(ctx.state.productsToDelete);
                }
            } else {
                yield* updateItemsIteratorFromVBase();
            }
        }

        async function* updateItemsIteratorFromVBase() {
            for await (const product of productsFromVBaseIterator()) {
                yield {
                    action: "update",
                    id: (product as any).sku,
                    body: { data: product }
                };
            }
        }

        const batchSize = ctx.state.adminSettings.dynamicYield.productBatchSize;
        const itemsIterator = allItemsIterator();
        let batch: Items[] = [];
        let count = 0;

        for await (let item of itemsIterator) {
            batch.push(item);

            if (batch.length === batchSize) {

                await ctx.clients.DynamicYield.updateProduct_Bulk(
                    ctx.state.adminSettings.dynamicYield.feedId,
                    { requests: batch }
                );
                batch = [];
                count += batchSize;

            }
        }
        // Invia l'ultimo batch se presente
        if (batch.length > 0) {
            await ctx.clients.DynamicYield.updateProduct_Bulk(
                ctx.state.adminSettings.dynamicYield.feedId,
                { requests: batch }
            );

            count += batch.length;
            batch = [];
        }

        ctx.state.logger.info({
            message: `Products updated in Dynamic Yield - OperationID: ${ctx.state?.operationId}, updatedItems: ${count}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        });

        await next();

    } catch (error) {
        let msg = error.response?.data
            ? stringify(error.response?.data)
            : stringify(error);

        ctx.state.logger.error(
            `Generate feed - OperationID: ${ctx.state?.operationId} - Error:` + msg
        );
        ctx.status = 500;
    }
}

// Genera iteratori per evitare array temporanei grandi
function* updateItemsIterator(products: any[]) {
    for (const product of products) {
        yield {
            action: "update",
            id: product.sku,
            body: { data: product }
        };
    }
}
function* deleteItemsIterator(products: any[]) {
    for (const product of products) {
        yield {
            action: "delete",
            id: product.sku
        };
    }
}