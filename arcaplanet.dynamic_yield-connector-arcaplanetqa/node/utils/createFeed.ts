import { LINKED } from "@vtex/api";
import { defineDeltaFeed } from "../middlewares/createFeed";
import { getCurrentFeed } from "../middlewares/feed";
import { EMAIL_ENTITY } from "./constants";
import { processBatch, stringify } from "./feedutils";
import { getMemoryUsageInfo, getRandomReference } from "./functions";
import { getFranchiseAvailability } from "./generateFeed";

export async function createFeed({ ctx }: CreateFeedParams, deltaMode: boolean = false) {

  const {
    clients: { feedManager },
  } = ctx;

  ctx.state.operationId = getRandomReference();

  let previousFeedStatus: any = null;
  // For non-delta feeds, save directly to VBase in small chunks to reduce memory usage
  const vBase_ProductPaths: string[] = [];

  try {

    let feedStatus = await feedManager.getStatus();
    previousFeedStatus = feedStatus ? { ...feedStatus } : null;

    await feedManager.updateStatus({
      completed: false,
      error: false,
      startedAt: new Date().toISOString(),
    });

    let feedProducts: any = [];
    ctx.state.productsInError = [];

    let skuToSellers = new Map<string, string[]>()

    ctx.state.logger.info(
      `Generate feed - FORMATTING STARTED - (OperationID -> ${ctx.state.operationId}); Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
    );

    // process in batches
    const batchSize = 50;

    let SkuIds: string[] = [];
    let totalProcessed = 0;
    let vbaseIndex = 0;

    // 1) Franchise first (avoid holding the huge xmlData string in memory during franchise computation)
    if (ctx.state.adminSettings.dynamicYield.isFranchiseStock_Enabled) {

      // ___________________________________________________________________________________________
      // Fetch seller availability
      try {
        skuToSellers = await getFranchiseAvailability(ctx);
        ctx.state.logger.info(
          `Generate feed - FRANCHISE DATA FETCHED - (OperationID -> ${ctx.state.operationId}); Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        );
      } catch (franchiseError) {
        ctx.state.logger.error(
          `Generate feed - FRANCHISE FETCH FAILED - (OperationID -> ${ctx.state.operationId}); Error: ${stringify(franchiseError)}`
        );
        
        if (previousFeedStatus) {
          await feedManager.updateStatus(previousFeedStatus);
        }
        
        throw new Error(`Failed to fetch franchise availability: ${franchiseError.message}. Previous feed preserved.`);
      }

    }

    // 2) Fetch and process product XML using streaming
    // if it fails, do not overwrite the previous feed
    ctx.state.logger.info(
      `Generate feed - STARTING PRODUCT XML FETCH (STREAMING) - (OperationID -> ${ctx.state.operationId}); Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
    );
    
    let ongoingCount = 0;
    let hasProcessedAnyProducts = false;
    
    try {
      // Use streaming to process XML as it arrives, avoiding memory spike
      for await (const rawProductsBatch of ctx.clients.catalogSystem.fetchXML_ProductsStreaming(batchSize)) {

        if (rawProductsBatch.length === 0) continue; // Skip empty batches
        
        hasProcessedAnyProducts = true;
        
        if (ongoingCount % 2500 === 0) {
          ctx.state.logger.info(
            `Generate feed - FORMATTING DATA ONGOING ${ongoingCount} - (OperationID -> ${ctx.state.operationId}); Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
          );
        }
        const formattedProducts = await processBatch(ctx, rawProductsBatch, skuToSellers);
        ongoingCount += rawProductsBatch.length;

        totalProcessed += formattedProducts.length;
        SkuIds.push(...formattedProducts.map(product => product.sku));

        if (deltaMode) {
          // Only accumulate in memory if we need to compute delta later
          feedProducts.push(...formattedProducts);
        } else {
          // In non-delta mode, save incrementally and release memory immediately
          // Do NOT accumulate feedProducts to avoid memory leak
          const path = await ctx.clients.feedManager.saveFeedJSON(formattedProducts, vbaseIndex);
          vBase_ProductPaths.push(path);
          vbaseIndex++;
        }

        formattedProducts.length = 0;
      }
      
      ctx.state.logger.info(
        `Generate feed - PRODUCT XML STREAMING COMPLETED - (OperationID -> ${ctx.state.operationId}); totalBatches=${ongoingCount}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
      );
    } catch (fetchError) {
      // if the fetch/processing fails, do not overwrite the previous feed
      ctx.state.logger.error(
        `Generate feed - PRODUCT XML FETCH/PROCESSING FAILED - (OperationID -> ${ctx.state.operationId}); Error: ${stringify(fetchError)}`
      );
      
      // Restore the previous feed status
      if (previousFeedStatus) {
        await feedManager.updateStatus(previousFeedStatus);
      }
      
      throw new Error(`Failed to fetch/process product XML: ${fetchError.message}. Previous feed preserved.`);
    }

    // Check if at least some products were processed
    if (!hasProcessedAnyProducts || totalProcessed === 0) {
      ctx.state.logger.error(
        `Generate feed - NO PRODUCTS PROCESSED FROM XML - (OperationID -> ${ctx.state.operationId})`
      );
      
      if (previousFeedStatus) {
        await feedManager.updateStatus(previousFeedStatus);
      }
      
      throw new Error('No products were processed from XML stream. Previous feed preserved.');
    }

    skuToSellers.clear();

    if (totalProcessed === 0) {
      ctx.state.logger.error(
        `Generate feed - NO PRODUCTS PROCESSED - (OperationID -> ${ctx.state.operationId})`
      );
      
      if (previousFeedStatus) {
        await feedManager.updateStatus(previousFeedStatus);
      }
      
      throw new Error('No products were processed. Previous feed preserved.');
    }
    
    previousFeedStatus = null;

    ctx.state.logger.info(
      `Generate feed - FORMATTING END - (OperationID -> ${ctx.state.operationId}); totalProcessed=${totalProcessed}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
    );

    // Save the SkuIds in VBase to export
    await ctx.clients.vbase.saveJSON("dynamic-yield", "skuIds_active", SkuIds);

    // ___________________________________________________________________________________________
    // Define delta feed if deltaMode is enabled
    if (deltaMode) {
      const { ProductsToUpdate, ProductsToDelete } = defineDeltaFeed(await getCurrentFeed(ctx), feedProducts);
      
      ctx.state.logger.info(
        `Generate feed - DELTA MODE: Delta calculated - (OperationID -> ${ctx.state.operationId}); ProductsToUpdate: ${ProductsToUpdate.length}, ProductsToDelete: ${ProductsToDelete.length}`
      );
      
      ctx.state.updatedFeed = ProductsToUpdate;
      ctx.state.productsToDelete = ProductsToDelete;
      
      // Set a flag to explicitly indicate delta mode, even if no updates/deletes
      // This prevents updateProductData from treating empty updatedFeed as non-delta mode
      ctx.state.isDeltaMode = true;
    } else {
      // CRITICAL: In non-delta mode, save incrementally
      // The index MUST be saved ONLY if everything goes well, otherwise the saved chunks
      // are not accessible and the feed becomes inconsistent
      if (vBase_ProductPaths.length > 0 && totalProcessed > 0) {
        try {
          await ctx.clients.feedManager.saveFeedJSON_Index(vBase_ProductPaths);
        } catch (indexError) {
          // CRITICAL: If the index saving fails,
          // the saved chunks are not accessible -> feed inconsistent
          // Restore the previous feed status
          ctx.state.logger.error(
            `Generate feed - FAILED TO SAVE FEED INDEX - (OperationID -> ${ctx.state.operationId}); Error: ${stringify(indexError)}`
          );
          
          if (previousFeedStatus) {
            await feedManager.updateStatus(previousFeedStatus);
          }
          
          throw new Error(`Failed to save feed index: ${indexError.message}. Previous feed preserved.`);
        }
      }
      // CRITICAL: In non-delta mode, we DON'T load products in memory
      // updateDY_Bulk will load them lazily from VBase chunk by chunk
      // This avoids the memory spike of loading everything at once
      ctx.state.updatedFeed = [];
      ctx.state.productsToDelete = [];
      ctx.state.isDeltaMode = false; // Explicitly set to false for non-delta mode
    }

    // ___________________________________________________________________________________________
    // Save the feed in VBase
    if (deltaMode) {
      // Only in delta mode we still have the whole array in memory -> save chunked
      await (async () => {
        const paths: string[] = [];
        let idx = 0;
        for (let i = 0; i < feedProducts.length; i += 1000) {
          const path = await ctx.clients.feedManager.saveFeedJSON(feedProducts.slice(i, i + 1000), idx);
          paths.push(path);
          idx++;
        }
        if (paths.length) {
          await ctx.clients.feedManager.saveFeedJSON_Index(paths);
        }
      })();
      // Clear feedProducts after saving to free memory
      feedProducts = [];
    }

    ctx.state.logger.info(
      `Generate feed - OPERATION FINISHED SUCCESSFULLY - (OperationID -> ${ctx.state.operationId}); Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
    );

    await feedManager.updateStatus({
      ...feedStatus,
      completed: true,
      error: false,
      entries: deltaMode ? (ctx.state.updatedFeed?.length ?? 0) : totalProcessed,
      finishedAt: new Date().toISOString(),
    });


    if (ctx.state.productsInError.length) {

      if (!LINKED) {
        await ctx.clients.masterdata.createDocument({
          dataEntity: EMAIL_ENTITY,
          fields: {
            productIds: JSON.stringify(ctx.state.productsInError.map(productId => Number(productId))),
            sendEmail: true,
            emailSubject: "DYNAMIC_YIELD Connector - Errore in fase di generazione del feed",
            timestamp: new Date().toISOString(),
          }
        })
      }
    }

  } catch (error) {

    let msg = error.response?.data
      ? stringify(error.response?.data)
      : stringify(error);

    ctx.state.logger.error(
      `Generate feed - OperationID: ${ctx.state.operationId} - Error:` + msg
    );
    
    // CRITICAL: In non-delta mode, if we have saved chunks but not the index,
    // the feed is inconsistent (saved chunks but not accessible)
    // The old feed remains accessible because the previous index was not overwritten
    if (!deltaMode && vBase_ProductPaths.length > 0) {
      ctx.state.logger.warn(
        `Generate feed - Partial chunks saved but index not updated - (OperationID -> ${ctx.state.operationId}). Previous feed index remains valid.`
      );
    }
    
    // Update feed status to error state
    try {
      await feedManager.updateStatus({
        completed: false,
        error: true,
        finishedAt: new Date().toISOString(),
      });
    } catch (statusError) {
      ctx.state.logger.error(
        `Generate feed - Failed to update status after error: ${stringify(statusError)}`
      );
    }
    
    // Restore the previous feed status if available
    if (previousFeedStatus) {
      try {
        await feedManager.updateStatus(previousFeedStatus);
      } catch (restoreError) {
        ctx.state.logger.error(
          `Generate feed - Failed to restore previous status: ${stringify(restoreError)}`
        );
      }
    }
    
    ctx.status = 500;
    throw error;
  }

}


