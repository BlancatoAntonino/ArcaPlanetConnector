import { isValid, stringify } from "../utils/functions";
import { CRON_JOB_SERVICES } from "../utils/constants";

//create a cronJob if not exist
export async function createCronJob(
  ctx: Context | any,
  next: () => Promise<any>
) {
  try {

    const {
      query: { cronType }
    } = ctx
    let cronIds = []

    if(isValid(cronType)){
      for (const service of CRON_JOB_SERVICES) {
        if (service.type === cronType) {
          const cronId = await ctx.clients.Cron.createCronJobIfNotExist(
            service.url,
            service.method,
            service.expression
          );
          cronIds.push(cronId);
          ctx.state.logger.info({ message: `CronJob created: ${cronId}, cronType: ${cronType}` });
        }
      }
    }

    ctx.status = 200;
    ctx.body = {
      cronJob_Ids: cronIds
    }
    
    await next();

  } catch (err) {
    let msg = err.response?.data ? stringify(err.response?.data) : stringify(err)
    ctx.status = 500;
    ctx.body = msg;
  }

}
