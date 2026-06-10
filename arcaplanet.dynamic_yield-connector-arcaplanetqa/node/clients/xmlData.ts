import { ACCOUNT, InstanceOptions, IOContext, JanusClient } from '@vtex/api'

const BASE_URL = `http://${ACCOUNT}.vtexcommercestable.com.br`

export class XmlData extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        vtexIdClientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public getProductsXML = async (): Promise<string> =>
    this.http.get(`${BASE_URL}/XMLData/lengow_connector.xml`, {
      metric: 'xml-data-get-products',
    })
}
