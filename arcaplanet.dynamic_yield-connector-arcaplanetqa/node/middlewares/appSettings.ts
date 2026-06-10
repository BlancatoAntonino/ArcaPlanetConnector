import { UserInputError } from '@vtex/api'

export async function getAppSettings(ctx: Context, next: () => Promise<void>) {
  const {
    clients: { appSettingsManager },
  } = ctx
  try {
    let appSettings = await appSettingsManager.getAppSettings()

    if (!appSettings) {
      throw new UserInputError('App settings not found')
    }
    ctx.state.appSettings = appSettings
    await next()

  } catch (err) {
    let msg = err.message ? err.message : JSON.stringify(err);

    (ctx as Context).status = 500;
    (ctx as Context).body = msg;

    ctx.state.logger.error(`${getAppSettings.name} --Details: ${msg}`);
  }
}

import { APP } from "@vtex/api"
import { MAX_RETRIES, MAX_TIME } from "../utils/constants"

export async function getAdminSettings(ctx: Context, next: () => Promise<any>) {
  try {

    ctx.state.adminSettings = await getAdminSettingsWithRetry((ctx as Context));

    process.env[`${ctx.vtex.account}-DY`] = JSON.stringify(
      ctx.state.adminSettings.dynamicYield
    );

    await next();

  } catch (err) {
    let msg = err.message ? err.message : JSON.stringify(err);

    (ctx as Context).status = 500;
    (ctx as Context).body = msg;

    ctx.state.logger.error(`${getAdminSettings.name} --Details: ${msg}`);

  }
}

async function getAdminSettingsWithRetry(
  ctx: Context,
  retry: number = 0
): Promise<AdminSettings> {
  return new Promise<AdminSettings>((resolve, reject) => {
    ctx.clients.apps
      .getAppSettings(APP.ID)
      .then((res) => {
        return resolve(res)
      })
      .catch(async (err) => {
        if (retry < MAX_RETRIES) {
          await wait(MAX_TIME);
          return getAdminSettingsWithRetry(ctx, retry + 1)
            .then((res0) => resolve(res0))
            .catch((err0) => reject(err0));
        } else {
          reject({
            message:
              "error while retrieving app settings --details: " +
              JSON.stringify(err.response?.data ? err.response.data : err),
          });
        }
      });
  });
}

export async function wait(time: number): Promise<Boolean> {
  return new Promise<Boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}
