import { ACCOUNT, APP } from '@vtex/api'
import { LOGGER_ENTITY } from '../utils/constants'
import { stringify, wait } from '../utils/functions'

export async function updateFranchiseAccountAvailability(ctx: Context, next: () => Promise<void>) {

    const {
        state: { adminSettings },
    } = ctx

    try {

        let promise: Promise<any>[] = []

        if (adminSettings.vtexSettings.isRangeFetch_Enabled) {

            for (
                let i = ctx.state.adminSettings.vtexSettings.sellerIndex_Start;
                i <= ctx.state.adminSettings.vtexSettings.sellerIndex_End;
                i++
            ) {

                const franchise_accountId = ACCOUNT == `arcaplanet` ? `arcaplanetseller${i}` : `arcaplanetqasellerwl${i}`

                promise.push(ctx.clients.catalogSystem.updateFranchiseAvailability(franchise_accountId));
                if (promise.length == ctx.state.adminSettings.vtexSettings.batchSellerSize || i == ctx.state.adminSettings.vtexSettings.sellerIndex_End) {
                    let res = await Promise.all(promise);
                    res.forEach((r) => {
                        if (!r?.success) {

                            ctx.clients.masterdata.createDocument({
                                dataEntity: LOGGER_ENTITY,
                                fields: {
                                    app: APP.NAME,
                                    message: `Error updating franchise availability for account ${r?.accountId}: ${r?.errorMessage}`,
                                    sendAlert: true,
                                    severity: 'error',
                                }
                            })

                        }
                    })

                    await wait(1000); // Wait for 1 second to avoid rate limiting
                    promise = [];

                }

            }
        }

        ctx.status = 200
        ctx.body = 'Franchise stock availability updated successfully'

    } catch (error) {

        const msg = 'Error updating franchise stock availability -- Details: ' + (error?.message ?? stringify(error))

        ctx.status = 500
        ctx.body = msg

        ctx.state.logger.error(msg)

    }

    await next()
}