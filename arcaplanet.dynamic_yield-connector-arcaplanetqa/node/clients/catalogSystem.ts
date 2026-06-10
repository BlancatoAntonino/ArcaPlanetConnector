import { ACCOUNT, InstanceOptions, IOContext, JanusClient, WORKSPACE } from '@vtex/api'
import { MAX_RETRIES, MAX_TIME } from '../utils/constants'
import { stringify, wait } from '../utils/functions'
import { Readable } from 'stream'

const BASE_URL = `http://${ACCOUNT}.vtexcommercestable.com.br/api/catalog_system/pub/products/search?`

export class CatalogSystem extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        vtexIdClientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public searchProducts = (productId: string, sc: string): Promise<unknown> =>
    this.http.get(BASE_URL, {
      params: {
        fq: `productId:${productId}`,
        sc,
      },
      metric: 'catalog-system-search-products',
    })

  public fetchSellerAvailability = (accountId: string, retry = 0): Promise<unknown> => {

    return this.http.get(`http://${accountId}.myvtex.com/app/product_availability/export/feed`, {}).catch(async (error) => {

      if (retry < MAX_RETRIES) {
        await wait(MAX_TIME * retry);
        return this.fetchSellerAvailability(accountId, retry + 1).then(res => { return res }).catch(err => { return err });
      } else {
        return { failed: true, errorMessage: `${error?.response?.data ?? stringify(error)}) - Status: ${error?.response?.status}}`, accountId: accountId }
      }
    })
  }

  public updateFranchiseAvailability = (accountId: string, retry = 0): Promise<unknown> => {

    return this.http.post(`http://${accountId}.myvtex.com/app/product_availability/retrieve`, {
    }).then(() => { return { success: true } }).catch(async (error) => {

      if (retry < MAX_RETRIES) {
        await wait(MAX_TIME * retry);
        return this.updateFranchiseAvailability(accountId, retry + 1).then(res => { return res }).catch(err => { return err });
      } else {
        return { success: false, errorMessage: `${error?.response?.data ?? stringify(error)}) - Status: ${error?.response?.status}}`, accountId: accountId }
      }

    })
  }

  
  /**
   * Fetch XML products using streaming
   * Returns an async generator that yields product batches as they're parsed from the stream.
   */
  public async* fetchXML_ProductsStreaming(batchSize: number = 50): AsyncGenerator<any[], void, unknown> {
    let retry = 0
    while (retry <= MAX_RETRIES) {
      try {
        const res = await this.http.getRaw(
          `http://${WORKSPACE}--${ACCOUNT}.myvtex.com/app/catalog-export/connector/feed`,
          { 
            responseType: 'stream' as any
          }
        )
        
        const stream = res.data as Readable
        yield* this.processXMLStream(stream, batchSize)
        return // Success, exit retry loop
      } catch (error) {
        if (retry < MAX_RETRIES) {
          await wait(MAX_TIME * Math.max(1, retry))
          retry++
          continue
        }

        // Build a concise, informative error
        const status = (error as any)?.response?.status
        const statusText = (error as any)?.response?.statusText
        const data = (error as any)?.response?.data
        const message = (error as Error)?.message

        const detail = status
          ? `HTTP ${status} ${statusText || ''}`.trim()
          : message || 'Unknown error'

        throw new Error(
          `Fetching products from catalog export after ${retry} retries: ${detail}${data ? ` - ${String(data).slice(0, 300)}` : ''}`
        )
      }
    }
  }

  /**
   * Process XML stream in chunks, yielding product batches as complete <products> tags are found.
   * This avoids loading the entire XML into memory.
   */
  private async* processXMLStream(stream: Readable, batchSize: number): AsyncGenerator<any[], void, unknown> {
    let buffer = ''
    let collectedXmlNodes: string[] = []
    const productTagRegex = /<products\b[\s\S]*?<\/products>/g

    for await (const chunk of stream) {
      buffer += chunk.toString('utf8')
      
      // Extract all complete product tags from buffer
      let match: RegExpExecArray | null
      const lastMatchEnd = { index: 0 }
      
      // Reset regex lastIndex to ensure we process from start of buffer
      productTagRegex.lastIndex = 0
      
      while ((match = productTagRegex.exec(buffer)) !== null) {
        collectedXmlNodes.push(match[0])
        lastMatchEnd.index = match.index + match[0].length
        
        if (collectedXmlNodes.length >= batchSize) {
          yield this.parseProductBatch(collectedXmlNodes)
          collectedXmlNodes = []
        }
      }
      
      // Keep only unprocessed portion of buffer (after last complete tag)
      // This handles cases where a <products> tag is split across chunks
      if (lastMatchEnd.index > 0) {
        buffer = buffer.substring(lastMatchEnd.index)
      } else {
        // No complete tags found, but might have partial tag at end
        // Keep reasonable buffer size to avoid memory growth
        // Look for last <products> start tag
        const lastProductsStart = buffer.lastIndexOf('<products')
        if (lastProductsStart > 0) {
          // Keep from last <products> tag onwards (might be incomplete)
          buffer = buffer.substring(lastProductsStart)
        } else if (buffer.length > 100000) {
          // Buffer too large without finding tags - likely malformed XML
          // Keep only last 50KB to prevent memory leak
          buffer = buffer.substring(buffer.length - 50000)
        }
      }
    }

    // Process any remaining complete tags in final buffer
    if (buffer) {
      productTagRegex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = productTagRegex.exec(buffer)) !== null) {
        collectedXmlNodes.push(match[0])
      }
    }

    // Yield final batch if any
    if (collectedXmlNodes.length > 0) {
      yield this.parseProductBatch(collectedXmlNodes)
    }
  }

  /**
   * Parse a batch of XML product nodes into JS objects
   */
  private parseProductBatch(xmlNodes: string[]): any[] {
    const { convertXmlToJsonV2 } = require('../utils/feedutils')
    const miniXml = `<?xml version="1.0" encoding="utf-8"?><catalogue>${xmlNodes.join('')}</catalogue>`
    const parsed = convertXmlToJsonV2(miniXml) as any
    const products = Array.isArray(parsed?.catalogue?.products)
      ? parsed.catalogue.products
      : parsed?.catalogue?.products
        ? [parsed.catalogue.products]
        : []
    return products
  }

  /**
   * Legacy method: fetch entire XML as string (kept for backward compatibility)
   * @deprecated Use fetchXML_ProductsStreaming for better memory efficiency
   */
  public fetchXML_Products = async (retry = 0): Promise<string> => {
    try {
      const res = await this.http.getRaw(
        `http://${WORKSPACE}--${ACCOUNT}.myvtex.com/app/catalog-export/connector/feed`,
        { 
          responseType: 'text' as any
        }
      )
      return res.data as unknown as string
    } catch (error) {
      if (retry < MAX_RETRIES) {
        await wait(MAX_TIME * Math.max(1, retry))
        return this.fetchXML_Products(retry + 1)
      }

      const status = (error as any)?.response?.status
      const statusText = (error as any)?.response?.statusText
      const data = (error as any)?.response?.data
      const message = (error as Error)?.message

      const detail = status
        ? `HTTP ${status} ${statusText || ''}`.trim()
        : message || 'Unknown error'

      throw new Error(
        `Fetching products from catalog export after ${retry} retries: ${detail}${data ? ` - ${String(data).slice(0, 300)}` : ''}`
      )
    }
  }
}
