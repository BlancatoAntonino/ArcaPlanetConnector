import { IOClients } from '@vtex/api'

import { AppSettingsManager, AppSettingsManager_Auth } from './appSettingsManager'
import { CatalogSystem } from './catalogSystem'
import { FeedManager } from './feedManager'
import { LogsManager } from './logsManager'
import { XmlData } from './xmlData'
import Cron from './Cron'
import DynamicYield from './DynamicYield'

export class Clients extends IOClients {

  public get appSettingsManager_auth() {
    return this.getOrSet('appSettingsManager_auth', AppSettingsManager_Auth)
  }

  public get appSettingsManager() {
    return this.getOrSet('appSettingsManager', AppSettingsManager)
  }

  public get catalogSystem() {
    return this.getOrSet('catalogSystem', CatalogSystem)
  }

  public get feedManager() {
    return this.getOrSet('feedManager', FeedManager)
  }

  public get logsManager() {
    return this.getOrSet('logsManager', LogsManager)
  }

  public get xmlData() {
    return this.getOrSet('xmlData', XmlData)
  }

  public get Cron() {
    return this.getOrSet('Cron', Cron)
  }

  public get DynamicYield() {
    return this.getOrSet('DynamicYield', DynamicYield)
  }


}
