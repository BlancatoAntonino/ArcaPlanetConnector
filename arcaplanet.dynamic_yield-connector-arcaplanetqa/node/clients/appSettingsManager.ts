import { InstanceOptions, IOContext, VBase } from '@vtex/api'

import { DYNAMIC_YIELD_CONFIG, DYNAMIC_YIELD_INTEGRATION } from '../constants'


export class AppSettingsManager_Auth extends VBase {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(
      {
        ...ctx,
        authToken: ctx.adminUserAuthToken ?? "undefined" //useful to use VtexIdclientAutCookie to make request to Vbase instead the application one, so add auth
      },
      options
    )
  }

  public getAppSettings = (): Promise<AppSettings> =>
    this.getJSON(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_CONFIG, true)

  public saveAppSettings = (data: AppSettings) =>
    this.saveJSON(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_CONFIG, data)
}

export class AppSettingsManager extends VBase {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        vtexIdClientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public getAppSettings = (): Promise<AppSettings> =>
    this.getJSON(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_CONFIG, true)

  public saveAppSettings = (data: AppSettings) =>
    this.saveJSON(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_CONFIG, data)
}
