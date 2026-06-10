import { APP, ExternalClient, InstanceOptions, IOContext } from "@vtex/api";
import { CreateCronJobReq, CronJobItemRes } from "../typings/cron";
import { stringify } from "../utils/feedutils";


export default class Cron extends ExternalClient {

  //@ts-ignore
  constructor(context: IOContext, options?: InstanceOptions) {

    options!.headers = {
      ...options?.headers,
      ...{ VtexIdclientAutCookie: context.authToken },
    };
    super(
      `http://${context.account}.vtexcommercestable.com.br`,
      context,
      options
    );
  }

  public getCronJobs = async (): Promise<CronJobItemRes[]> => {
    return new Promise<CronJobItemRes[]>((resolve, reject) => {
      this.http
        .get(
          `/api/scheduler/${this.context.workspace}/${APP.NAME}?version=4`,
          this.options
        )
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject({
            msg: `Error while retrieving cron jobs --details: ${JSON.stringify(
              err
            )}`,
          })
        }
        );
    });
  };

  private createCronJob = async (
    pingUrl: string,
    pingMethod: string,
    CronJobExpression: string
  ): Promise<any> => {
    return new Promise<any>((resolve, reject) => {

      let body: CreateCronJobReq = {
        request: {
          uri: pingUrl,
          method: pingMethod,
          headers: {

          },
          body: {},
        },
        scheduler: {
          endDate: new Date(
            new Date().getFullYear() + 2,
            0,
            1,
            1
          ).toISOString(),
          expression: CronJobExpression,
        },
        retry: {
          delay: {
            addMinutes: 1,
            addHours: 0,
            addDays: 0,
          },
          times: 1,
          backOffRate: 1.0,
        },
      };
      this.http
        .post(
          `/api/scheduler/${this.context.workspace}/${APP.NAME}?version=4`,
          body,
          this.options
        )
        .then((res) => resolve(res))
        .catch((err) => {
          reject({
            msg: `Error while creating cron job --details: ${stringify(
              err
            )}`,
          })
        }
        );
    });
  };

  public createCronJobIfNotExist = async (
    url: string,
    method: string,
    CronJobExpression: string
  ): Promise<any> => {


    return new Promise<any>(async (resolve, reject) => {

      try {

        const completeUrl = `https://${this.context.workspace}--${this.context.account}.myvtex.com${url}`;

        let jobs = await this.getCronJobs();
        let job = jobs.find(
          (j) =>
            j.app == APP.NAME &&
            j.request.uri == completeUrl &&
            j.request.method == method &&
            j.endDate > new Date().toISOString()
        );
        if (!job) {
          
          const crRes = await this.createCronJob(completeUrl, method, CronJobExpression);
          resolve(crRes?.id);

        } else {
          resolve(false);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  public async deleteCronJob(cronJobId: string) {
    return new Promise<any>((resolve, reject) => {
      this.http
        .delete(`/${cronJobId}`, {
          params: {
            version: 4,
          },
        })
        .then((res) => resolve(res))
        .catch((err) =>
          reject({
            msg: `Error while deleting cron job -- details: ${JSON.stringify(
              err
            )}`,
          })
        );
    });
  }
}
