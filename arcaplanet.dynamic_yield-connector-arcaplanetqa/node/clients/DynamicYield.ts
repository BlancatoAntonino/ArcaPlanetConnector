import { ExternalClient, InstanceOptions, IOContext } from "@vtex/api";


export default class DynamicYield extends ExternalClient {
    //private memoryCache?: CacheLayer<string, any>;


    constructor(context: IOContext, options?: InstanceOptions) {

        const dy_settings: DynamicYieldSettings = JSON.parse(process.env[`${context.account}-DY`]!);

        super(dy_settings.hostName, context, {
            ...options,
            headers: { "dy-api-key": dy_settings.api_key }
        });

        //this.memoryCache = options && options?.memoryCache;

    }

    public async updateProduct_Bulk(
        feedId: string,
        request: any
    ): Promise<any> {


        return new Promise<any>((resolve, reject) => {
            this.http
                .post(
                    `/v2/feeds/${feedId}/bulk`,
                    request,
                    {
                        headers: {
                            ...this.options?.headers,
                            "accept": `application/json`,
                            "content-type": "application/json"
                        },
                    }
                )
                .then((res) => {
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

}
