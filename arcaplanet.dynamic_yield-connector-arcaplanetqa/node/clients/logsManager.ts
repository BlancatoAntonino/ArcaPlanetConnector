import { InstanceOptions, IOContext, VBase } from '@vtex/api'

import { DYNAMIC_YIELD_LOGS, DYNAMIC_YIELD_INTEGRATION } from '../constants'

export class LogsManager extends VBase {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        vtexIdClientAutCookie: ctx.adminUserAuthToken ?? ctx.authToken,
      },
    })
  }

  public getLogs = () =>
    this.getJSON<unknown[]>(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_LOGS, true)

  public saveLogs = (data: unknown) =>
    this.saveJSON(DYNAMIC_YIELD_INTEGRATION, DYNAMIC_YIELD_LOGS, data)
}
