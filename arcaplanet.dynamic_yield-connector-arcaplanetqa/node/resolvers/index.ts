import axios from 'axios'

export const resolvers = {
  Mutation: {
    saveAppSettings: async (_: any, { config }: any, ctx: Context) => {

      const {
        clients: { appSettingsManager_auth },
      } = ctx

      try {
        await appSettingsManager_auth.saveAppSettings(config)

        return config
      } catch (error) {
        return error
      }

    },
  },
  Query: {
    appSettings: async (_: any, __: any, ctx: Context) => {
      const {
        clients: { appSettingsManager_auth }
      } = ctx

      try {
        const appSettings = await appSettingsManager_auth.getAppSettings()

        return appSettings
      } catch (error) {
        return error
      }
    },
    salesChannels: async (_: any, __: any, ctx: Context) => {
      const {
        vtex: { account, authToken },
      } = ctx

      const optionsClientInfo = {
        url: `http://${account}.vtexcommercestable.com.br/api/catalog_system/pvt/saleschannel/list`,
        headers: {
          VtexIdclientAutCookie: authToken,
          'Proxy-Authorization': authToken,
          'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
        },
      }

      const response: any = await axios
        .get(optionsClientInfo.url, { headers: optionsClientInfo.headers })
        .catch(error => {
          console.error('ERROR?: ', error)
        })

      return response.data
    },
    locales: async (_: any, __: any, ctx: Context) => {
      const {
        vtex: { account, authToken },
      } = ctx

      const optionsClientInfo = {
        url: `http://portal.vtexcommercestable.com.br/api/tenant/tenants?q=${account}`,
        headers: {
          VtexIdclientAutCookie: authToken,
          'Proxy-Authorization': authToken,
          'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
        },
      }

      const response: any = await axios
        .get(optionsClientInfo.url, { headers: optionsClientInfo.headers })
        .catch(error => {
          console.error('ERROR?: ', error)
        })

      const locales: any = []

      if (response?.data?.bindings?.length) {
        const bindings = response.data.bindings.filter(
          (item: any) => item.targetProduct === 'vtex-storefront'
        )

        bindings.forEach((binding: any) => {
          locales.push(binding.defaultLocale)
        })
      }

      const uniqueLocales = locales.filter(function (elem: any, pos: any) {
        return locales.indexOf(elem) === pos
      })

      return uniqueLocales
    },
    hosts: async (_: any, __: any, ctx: Context) => {
      const {
        vtex: { account, authToken },
      } = ctx

      const optionsClientInfo = {
        url: `http://${account}.vtexcommercestable.com.br/api/vlm/account/stores`,
        headers: {
          'Content-Type': 'application/json',
          VtexIdclientAutCookie: authToken,
          'Proxy-Authorization': authToken,
          'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
        },
      }

      const response: any = await axios
        .get(optionsClientInfo.url, { headers: optionsClientInfo.headers })
        .catch(error => {
          console.error(error)
        })

      let returnData = [`${account}.myvtex.com`]

      if (response?.data?.length) {
        response.data.forEach((accountData: any) => {
          if (accountData.name === account) {
            returnData = [...returnData, ...accountData.hosts]
          }
        })
      }

      return returnData
    },
    appLogs: async (_: any, __: any, ctx: Context) => {
      const {
        clients: { logsManager },
      } = ctx

      try {
        const response = await logsManager.getLogs()
        return response
      } catch (e) {
        return []
      }
    },
  },
}
