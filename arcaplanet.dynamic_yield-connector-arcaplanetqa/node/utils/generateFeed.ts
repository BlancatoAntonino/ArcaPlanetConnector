import { ACCOUNT } from "@vtex/api";
import { PRODUCT_CHUNK_SIZE_SAVE_JSON } from "./constants";
import { getMemoryUsageInfo, wait } from "./functions";
import { safeLogToMasterdata } from "./functions";

// This function fetches the franchise availability data
export async function getFranchiseAvailability(ctx: Context) {

    try {

        let sellerData: any[] = [];
        type SellerPromise = { accountId: string; promise: Promise<any> }
        let promise: SellerPromise[] = [];
        let processedSellers = 0;

        let BackUp_SellerData: any[] | null = null

        const skuToSellers = new Map<string, string[]>()
        if (ctx.state.adminSettings.vtexSettings.isRangeFetch_Enabled) {
            
            for (
                let i = ctx.state.adminSettings.vtexSettings.sellerIndex_Start;
                i <= ctx.state.adminSettings.vtexSettings.sellerIndex_End;
                i++
            ) {

                const franchise_accountId = ACCOUNT == `arcaplanet` ? `arcaplanetseller${i}` : `arcaplanetqasellerwl${i}`
                
                promise.push({
                  accountId: franchise_accountId,
                  promise: ctx.clients.catalogSystem.fetchSellerAvailability(franchise_accountId),
                });

                if (promise.length == ctx.state.adminSettings.vtexSettings.batchSellerSize || i == ctx.state.adminSettings.vtexSettings.sellerIndex_End) {

                    const settled = await Promise.allSettled(promise.map(p => p.promise))
                    let batchSellerData = settled.map((r, idx) => {
                      const accountId = promise[idx].accountId
                      if (r.status === "fulfilled") return r.value
                      return {
                        failed: true,
                        accountId,
                        errorMessage: (r.reason as any)?.message ?? String(r.reason),
                      }
                    })

                    sellerData.push(...batchSellerData);
                    processedSellers += batchSellerData.length;

                    if (processedSellers % 200 === 0) {
                      ctx.state.logger.info(`Franchise availability - Processed ${processedSellers} sellers; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);
                    }

                    for (const sd of batchSellerData) {
                      if (sd?.failed) {
                        if (!BackUp_SellerData) {
                          BackUp_SellerData = await loadFranchiseBackup(ctx)
                        }
                        const currentSD = BackUp_SellerData?.find((buSeller: any) => buSeller.accountId === sd?.accountId);
                        currentSD ? (sellerData[sellerData.indexOf(sd)] = currentSD) : sellerData.splice(sellerData.indexOf(sd), 1);

                        await safeLogToMasterdata(ctx, `Error fetching franchise availability for account ${sd?.accountId}: ${sd?.errorMessage}; `)
                      }
                    }

                    batchSellerData = [];
                    await wait(1000);
                    promise = [];
                }
            }
        } else {
            const accountIds = ctx.state.adminSettings.vtexSettings.sellerIndexToFetch.split(",").map(id => {
            return (ACCOUNT == `arcaplanet` ? `arcaplanetseller${id}` : `arcaplanetqasellerwl${id}`);
            });

            while (accountIds.length > 0) {
                const batch = accountIds.splice(0, ctx.state.adminSettings.vtexSettings.batchSellerSize);
                for (const accountId of batch) {
                    promise.push({
                      accountId,
                      promise: ctx.clients.catalogSystem.fetchSellerAvailability(accountId),
                    });
                }

                const settled = await Promise.allSettled(promise.map(p => p.promise))
                let batchSellerData = settled.map((r, idx) => {
                  const accountId = promise[idx].accountId
                  if (r.status === "fulfilled") return r.value
                  return {
                    failed: true,
                    accountId,
                    errorMessage: (r.reason as any)?.message ?? String(r.reason),
                  }
                })

                sellerData.push(...batchSellerData);
                processedSellers += batchSellerData.length;

                if (processedSellers % 200 === 0) {
                  ctx.state.logger.info(`Franchise availability - Processed ${processedSellers} sellers; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);
                }

                for (const sd of batchSellerData) {
                  if (sd?.failed) {
                    if (!BackUp_SellerData) {
                      BackUp_SellerData = await loadFranchiseBackup(ctx)
                    }

                    const currentSD = BackUp_SellerData?.find((buSeller: any) => buSeller.accountId === sd?.accountId);
                    currentSD ? (sellerData[sellerData.indexOf(sd)] = currentSD) : sellerData.splice(sellerData.indexOf(sd), 1);
                  }
                }

                batchSellerData = [];
                await wait(1000);
                promise = [];
            }
        }

        BackUp_SellerData = null;

        ctx.state.logger.info(`Franchise availability - Starting data processing - ${sellerData.length} sellers, Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);

        const startSort = Date.now();
        ctx.state.logger.info(`Franchise availability - Starting sort of ${sellerData.length} sellers...`);

        sellerData.sort((a, b) => {
            if (a.seller < b.seller) return -1;
            if (a.seller > b.seller) return 1;
            return 0;
        });

        const sortTime = Date.now() - startSort;
        ctx.state.logger.info(`Franchise availability - Sort completed in ${sortTime}ms, Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);

        const MAP_CHUNK_SIZE = 50;
        const totalSellers = sellerData.length;
        ctx.state.logger.info(`Franchise availability - Starting SKU map building in chunks of ${MAP_CHUNK_SIZE} sellers...`);

        for (let chunkStart = 0; chunkStart < totalSellers; chunkStart += MAP_CHUNK_SIZE) {
            const chunkEnd = Math.min(chunkStart + MAP_CHUNK_SIZE, totalSellers);

            for (let i = chunkStart; i < chunkEnd; i++) {
            const sd = sellerData[i];

            const list: string[] = Array.isArray(sd?.notAvailableSku) ? sd.notAvailableSku : []
            for (const sku of list) {
              let sellers = skuToSellers.get(sku)
              if (!sellers) {
                sellers = []
                skuToSellers.set(sku, sellers)
              }
              sellers.push(sd.seller)
            }
            }

            if ((chunkEnd % 200 === 0) || (chunkEnd === totalSellers)) {
            ctx.state.logger.info(`Franchise availability - Processed ${chunkEnd}/${totalSellers} sellers, ${skuToSellers.size} SKUs, Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);
            }
        }

        ctx.state.logger.info(`Franchise availability - SKU map completed - ${skuToSellers.size} SKUs, Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`);

        // Backup (chunked): avoid huge single-document VBase payloads.
        const BACKUP_CHUNK_SIZE_SELLERS = 100
        const backupPaths: string[] = []

        ctx.state.logger.info(
          `Franchise availability - Backup starting (chunked) - sellers=${sellerData.length} chunkSize=${BACKUP_CHUNK_SIZE_SELLERS}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        )

        for (let start = 0, chunkIndex = 0; start < sellerData.length; start += BACKUP_CHUNK_SIZE_SELLERS, chunkIndex++) {
          const chunk = sellerData.slice(start, start + BACKUP_CHUNK_SIZE_SELLERS)
          const path = `BackUp_SellerData_${String(chunkIndex).padStart(4, "0")}`

          await ctx.clients.vbase.saveJSON("dynamic-yield", path, chunk)
          backupPaths.push(path)

          ctx.state.logger.info(
            `Franchise availability - Backup ongoing - chunk=${chunkIndex + 1}, sellersSaved=${Math.min(start + BACKUP_CHUNK_SIZE_SELLERS, sellerData.length)}/${sellerData.length}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
          )
        }

        await ctx.clients.vbase.saveJSON("dynamic-yield", "BackUp_SellerData_Index", backupPaths)

        ctx.state.logger.info(
          `Franchise availability - Backup completed (chunked) - chunks=${backupPaths.length}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        )

        sellerData = [];
        
        // Force explicit cleanup - help GC by clearing references
        ctx.state.logger.info(
          `Franchise availability - Memory cleanup after backup - Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        );

        return skuToSellers;

    } catch (error: any) {
        ctx.state.logger.error(`Error while fetching franchise availability: ${error?.message}`);
        throw new Error(`Error while fetching franchise availability: ${error?.message}`);
        }
    }

    export async function saveNewFeed(ctx: Context, updatedFeed: any) {

    try {

        const {
            clients: { feedManager }
        } = ctx;

        let vBase_ProductPaths: any[] = [];

        // Key that differentiate chunks in VBase path
        let index = 0;
        ctx.state.logger.info(
            `Generate feed - SAVING STARTED - (OperationID -> ${ctx.state.operationId}) --Details: Product to be saved = ${updatedFeed.length} / PRODUCT_CHUNK_SIZE = ${PRODUCT_CHUNK_SIZE_SAVE_JSON}; Mem: ${JSON.stringify(getMemoryUsageInfo(), null, 2)}`
        );

        // Save all product chunks in different VBase documents
        for (
            let i = 0;
            i < updatedFeed.length;
            i += PRODUCT_CHUNK_SIZE_SAVE_JSON
        ) {
            let path = await feedManager.saveFeedJSON(
                updatedFeed.slice(i, i + PRODUCT_CHUNK_SIZE_SAVE_JSON),
                index
            );
            vBase_ProductPaths.push(path);

            index++;
        }

        // Save paths (documentId in VBase) for each chunk,
        // useful to retrieve all products in getFeed.
        await feedManager.saveFeedJSON_Index(vBase_ProductPaths);

    } catch (error) {
        throw new Error(error)
    }

}

async function loadFranchiseBackup(ctx: Context): Promise<any[] | null> {
  try {
    const index = await ctx.clients.vbase.getJSON("dynamic-yield", "BackUp_SellerData_Index", true) as any;

    if (Array.isArray(index) && index.length > 0) {
      // CRITICAL: Load chunks sequentially instead of all at once to reduce memory peak
      // Promise.all loads all chunks in memory simultaneously, causing memory spikes
      const merged: any[] = [];
      
      for (const path of index) {
        try {
          const chunk = await ctx.clients.vbase.getJSON("dynamic-yield", path, true);
          if (Array.isArray(chunk)) {
            merged.push(...chunk);
          }
          // Clear chunk reference immediately after processing to help GC
        } catch (chunkError) {
          ctx.state.logger.warn(`Failed to load backup chunk ${path}: ${(chunkError as any)?.message}`);
        }
      }

      return merged.length > 0 ? merged : null;
    }
  } catch (error) {
    ctx.state.logger.warn(`Failed to load chunked backup: ${(error as any)?.message}`);
    // ignore and fall back to legacy below
  }

  try {
    const legacy = await ctx.clients.vbase.getJSON("dynamic-yield", "BackUp_SellerData", true) as any;
    return Array.isArray(legacy) && legacy.length > 0 ? legacy : null;
  } catch {
    return null;
  }
}