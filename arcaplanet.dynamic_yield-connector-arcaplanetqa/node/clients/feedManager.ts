import { InstanceOptions, IOContext, VBase } from '@vtex/api'

import {
  FEED_PRODUCT_IDS,
  FEED_STATUS,
  DYNAMIC_YIELD_FEED_JSON,
  DYNAMIC_YIELD_FEED_JSON_INDEX,
  DYNAMIC_YIELD_FEED_XML,
  DYNAMIC_YIELD_INTEGRATION,
} from '../constants'
import { ProductData } from '../typings/types'

export class FeedManager extends VBase {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        vtexIdClientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public getStatus = (locale?: string) =>
    this.getJSON<FeedStatus>(
      DYNAMIC_YIELD_INTEGRATION,
      `${FEED_STATUS}${locale && `_${locale}`}`,
      true
    )

  public updateStatus = (data: FeedStatus, locale?: string) =>
    this.saveJSON(
      DYNAMIC_YIELD_INTEGRATION,
      `${FEED_STATUS}${locale && `_${locale}`}`,
      data
    )

  public getFeedJSON = async (path: string = DYNAMIC_YIELD_FEED_JSON, locale?: string) => {

    if (locale) {
      path += `_${locale}`
    }

    let productData: ProductData[] = await this.getJSON<ProductData[]>(DYNAMIC_YIELD_INTEGRATION, path, true)

    return productData
  }



  public saveFeedJSON = async (data: ProductData[], index: number = 0, locale?: string) => {

    try {

      let path = DYNAMIC_YIELD_FEED_JSON + `_${index}`

      if (locale) {
        path += `_${locale}`
      }

      await this.saveJSON(DYNAMIC_YIELD_INTEGRATION, path, data)

      return path

    } catch (error) {
      throw new Error(error)
    }


  }

  public saveFeedJSON_Index = (data: string[], locale?: string) => {

    try {
      let path = DYNAMIC_YIELD_FEED_JSON_INDEX

      if (locale) {
        path += `_${locale}`
      }

      return this.saveJSON(DYNAMIC_YIELD_INTEGRATION, path, data)

    } catch (error) {
      throw new Error(error)
    }

  }


  public getFeedJSON_Index = (locale?: string) => {

    let path = DYNAMIC_YIELD_FEED_JSON_INDEX

    if (locale) {
      path += `_${locale}`
    }

    return this.getJSON<string[]>(DYNAMIC_YIELD_INTEGRATION, path, true);

  }

  public getFeedXML = (
    locale?: string
  ): Promise<{ feed: string; updated: boolean }> => {
    let path = DYNAMIC_YIELD_FEED_XML

    if (locale) {
      path += `_${locale}`
    }

    return this.getJSON(DYNAMIC_YIELD_INTEGRATION, path, true)
  }

  public saveFeedXML = (data: unknown, locale?: string) => {
    let path = DYNAMIC_YIELD_FEED_XML

    if (locale) {
      path += `_${locale}`
    }

    return this.saveJSON(DYNAMIC_YIELD_INTEGRATION, path, data)
  }

  public getProductIds = (): Promise<string[]> =>
    this.getJSON(DYNAMIC_YIELD_INTEGRATION, FEED_PRODUCT_IDS, true)

  public saveProductIds = (data: string[]) =>
    this.saveJSON(DYNAMIC_YIELD_INTEGRATION, FEED_PRODUCT_IDS, data)
}
