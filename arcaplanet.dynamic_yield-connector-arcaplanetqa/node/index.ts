import {
  ClientsConfig,
  LRUCache,
  ParamsContext,
  RecorderState,
  Service,
  ServiceContext,
  method,
} from '@vtex/api'

import { CustomLogger } from '../node/utils/Logger'
import { Clients } from './clients'
import { getAdminSettings, getAppSettings } from './middlewares/appSettings'
import { asyncRequest } from './middlewares/asyncRequest'
import { createCronJob } from './middlewares/createCronJob'
import { createDeltaFeed, createFeed } from './middlewares/createFeed'
import { feed } from './middlewares/feed'
import { getFeedStatus } from './middlewares/getFeedStatus'
import { initLogger } from './middlewares/initLogger'
import { updateFranchiseAccountAvailability } from './middlewares/manageFranchise'
import { ping } from './middlewares/ping'
import { sendResponse } from './middlewares/sendResponse'
import { setDefaultHeaders } from './middlewares/setDefaultHeaders'
import { getActiveSkuIds } from './middlewares/updateBaseProductIds'
import { updateDY_Bulk } from './middlewares/updateProductData'
import { resolvers } from './resolvers'


const TIMEOUT_MS = 10000

const memoryCache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('status', memoryCache)

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    status: {
      memoryCache,
    },
  },
}

declare global {
  type Context = ServiceContext<Clients, State>

  interface State extends RecorderState {
    appSettings: AppSettings
    adminSettings: AdminSettings
    currentFeed: any[]
    updatedFeed: any[],
    productsToDelete: any[],
    productIds: string[]
    logger: CustomLogger
    operationId: string
    productsInError: string[]
    isDeltaMode?: boolean
  }
}

export default new Service<Clients, State, ParamsContext>({
  clients,
  routes: {
    ping: method({
      POST: [ping],
    }),
    feed: method({
      GET: [
        initLogger,
        setDefaultHeaders,
        getAppSettings,
        feed
      ],
      POST: [
        initLogger,
        asyncRequest,
        setDefaultHeaders,
        getAppSettings,
        getAdminSettings,
        getFeedStatus,
        createFeed,
        sendResponse
      ]
    }),
    updateProduct_Bulk: method({
      POST: [
        initLogger,
        asyncRequest,
        getAppSettings,
        getAdminSettings,
        getFeedStatus,
        createDeltaFeed,
        updateDY_Bulk
      ]
    }),
    updateFranchiseAccountAvailability: method({
      POST: [initLogger, asyncRequest, getAdminSettings, updateFranchiseAccountAvailability]
    }),
    getActiveSkuIds: method({
      GET: [initLogger, getActiveSkuIds]
    }),
    crateUpdateCronJob: method({
      POST: [initLogger, createCronJob]
    })
  },
  graphql: {
    resolvers
  }
})
