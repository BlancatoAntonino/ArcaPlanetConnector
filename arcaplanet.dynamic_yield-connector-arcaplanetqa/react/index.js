import { compose } from 'ramda'
import { Component } from 'react'
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl'
import {
  ActionMenu,
  Button,
  ButtonGroup,
  Tab,
  Tabs,
  ToastConsumer,
  ToastProvider,
} from 'vtex.styleguide'

import GET_HOSTS from './queries/getHosts.gql'
import GET_LOCALES from './queries/getLocales.gql'
import GET_APP_SETTINGS from './queries/dyConfig.gql'
import GET_SALES_CHANNELS from './queries/salesChannel.gql'
import SAVE_APP_SETTINGS from './queries/saveDYConfig.gql'

import DY_Logs from './components/DY_Logs'
import DY_Config from './components/DY_Config'

class AdminPanel extends Component {
  constructor(props) {
    super(props)

    this.state = {
      appSettings: {
        account: '',
        apiKey: '',
        apiSecret: '',
        vtexApiKey: '',
        vtexApiToken: '',
        prefixAffiliateID: 'LNG',
        domainShop: '',
        boolSandbox: false,
        salesChannel: [],
        locales: [],
        flagFirstLevelCategoryAsKeyword: false,
        productDataCustomFields: [],
        productSpecifications: [],
        skuSpecifications: [],
        flagExportDisableSKU: false,
        flagExportOutOfStockSKU: false,
        listExludedSkus: '',
        feedFormat: 'xml',
      },
      numProductSpecifications: 1,
      numSkuSpecifications: 1,
      loading: this.props.appSettings.loading,
      disabled_save: false,
      currentTab: 1,
    }

    this.handleTabChange = this.handleTabChange.bind(this)
  }

  handleInputChange = (name, value) => {
    const updatedAppSettings = {
      ...this.state.appSettings,
      [name]: value,
    }

    this.setState({ appSettings: updatedAppSettings })
  }

  handleInputChangeArray = (name, key, value, operation) => {
    const updatedAppSettings = { ...this.state.appSettings }
    switch (operation) {
      case 'create':
        updatedAppSettings[name].push(value)
        break
      case 'update':
        updatedAppSettings[name][key] = value
        break
      case 'delete':
        updatedAppSettings[name].splice(key, 1)
        break
    }
    this.setState({ appSettings: updatedAppSettings })
  }

  saveProductForm = showToast => {
    this.setState({ disabled_save: true })
    window.postMessage({ action: { type: 'START_LOADING' } }, '*')

    const updatedAppSettings = {
      ...this.state.appSettings,
      salesChannel: JSON.stringify(this.state.appSettings.salesChannel),
      productDataCustomFields: JSON.stringify(
        this.state.appSettings.productDataCustomFields
      ),
      productSpecifications: JSON.stringify(
        this.state.appSettings.productSpecifications
      ),
      skuSpecifications: JSON.stringify(
        this.state.appSettings.skuSpecifications
      ),
    }

    const options = {
      variables: {
        data: updatedAppSettings,
      },
    }
    this.props.saveAppSettings(options).then(res => {
      this.setState({ disabled_save: false })
    })

    window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')

    showToast({
      message: <FormattedMessage id="admin/dynamic_yield-connector.config-saved" />,
      horizontalPosition: 'right',
    })
  }

  componentDidUpdate(nextProps) {
    if (
      nextProps.appSettings.appSettings &&
      this.props.appSettings.appSettings
    ) {
      if (!nextProps.appSettings.loading && this.state.loading) {
        const updatedAppSettings = nextProps.appSettings.appSettings

        if (updatedAppSettings) {
          try {
            if (!updatedAppSettings.salesChannel) {
              updatedAppSettings.salesChannel = []
            } else {
              updatedAppSettings.salesChannel = JSON.parse(
                updatedAppSettings.salesChannel
              )
            }
            if (!Array.isArray(updatedAppSettings.salesChannel)) {
              updatedAppSettings.salesChannel = []
            }
          } catch (e) {
            updatedAppSettings.salesChannel = []
          }
          try {
            if (!updatedAppSettings.productDataCustomFields) {
              updatedAppSettings.productDataCustomFields = []
            } else {
              updatedAppSettings.productDataCustomFields = JSON.parse(
                updatedAppSettings.productDataCustomFields
              )
            }
            if (!Array.isArray(updatedAppSettings.productDataCustomFields)) {
              updatedAppSettings.productDataCustomFields = []
            }
          } catch (e) {
            updatedAppSettings.productDataCustomFields = []
          }
          try {
            if (!updatedAppSettings.productSpecifications) {
              updatedAppSettings.productSpecifications = []
            } else {
              updatedAppSettings.productSpecifications = JSON.parse(
                updatedAppSettings.productSpecifications
              )
            }
            if (!Array.isArray(updatedAppSettings.productSpecifications)) {
              updatedAppSettings.productSpecifications = []
            }
          } catch (e) {
            updatedAppSettings.productSpecifications = []
          }
          try {
            if (!updatedAppSettings.skuSpecifications) {
              updatedAppSettings.skuSpecifications = []
            } else {
              updatedAppSettings.skuSpecifications = JSON.parse(
                updatedAppSettings.skuSpecifications
              )
            }
            if (!Array.isArray(updatedAppSettings.skuSpecifications)) {
              updatedAppSettings.skuSpecifications = []
            }
          } catch (e) {
            updatedAppSettings.skuSpecifications = []
          }

          this.setState({
            appSettings: updatedAppSettings,
            loading: nextProps.appSettings.appSettings.loading,
            numProductSpecifications:
              updatedAppSettings.productSpecifications.length + 1,
            numSkuSpecifications:
              updatedAppSettings.skuSpecifications.length + 1,
          })
        } else {
          this.setState({ loading: nextProps.appSettings.appSettings.loading })
        }
      }
    }
  }

  handleTabChange(tabIndex) {
    this.setState({ currentTab: tabIndex })
  }

  handleAddLineSpecifications = (name, counterName) => {
    this.handleInputChangeArray(
      `${name}`,
      null,
      { id: `${name}-${this.state[counterName]}`, specName: '', specXML: '' },
      'create'
    )
    this.state[counterName] += 1
  }

  render() {
    if (this.state.loading) {
      return <FormattedMessage id="admin/dynamic_yield-connector.loading" />
    }

    const locales =
      this.props.locales.locales?.map(item => ({
        label: item,
        value: item,
      })) ?? []

    const configLocales = JSON.parse(this.state.appSettings.locales)

    const showFeedButtonOptions = configLocales.map(locale => ({
      label: `View feed for ${locale.label}`,
      onClick: () => {
        window.open(
          `/_v/arc/dynamic-yield/connector/feed/localize?locale=${locale.value}`,
          '_blank'
        )
      },
    }))

    return (
      <ToastProvider>
        <ToastConsumer>
          {({ showToast }) => (
            <div className="font-display dark-gray flex flex-wrap justify-center">
              <div className="w-60-l w-60-ns pv7">
                <Tabs fullWidth>
                  <Tab
                    className="t-heading-2"
                    label={
                      <FormattedMessage id="admin/dynamic_yield-connector.config-tab-label" />
                    }
                    active={this.state.currentTab === 1}
                    onClick={() => this.handleTabChange(1)}
                  >
                    <div className="w-100 center pv7">
                      <DY_Config
                        dyConfig={this.state.appSettings}
                        salesChannel={this.props.salesChannels.salesChannels}
                        locales={locales}
                        hosts={this.props.hosts.hosts}
                        onChangeArray={this.handleInputChangeArray}
                        onAddLineSpec={this.handleAddLineSpecifications}
                        onChange={this.handleInputChange}
                        saveProductForm={this.saveProductForm}
                      />
                      <div className="center flex pv7">
                        <div className="ma5">
                          <Button
                            disabled={this.state.disabled_save}
                            className="tc pa2 t-heading-4"
                            onClick={() => {
                              this.saveProductForm(showToast)
                            }}
                          >
                            <FormattedMessage id="admin/dynamic_yield-connector.config-save-config-button" />
                          </Button>
                        </div>

                        <div className="ma5">
                          <ButtonGroup
                            buttons={[
                              <Button
                                variation="secondary"
                                isGrouped
                                onClick={() =>
                                  fetch(
                                    `/_v/arc/dynamic-yield/connector/feed?force=true`,
                                    {
                                      method: 'POST',
                                    }
                                  )
                                }
                              >
                                <FormattedMessage id="admin/dynamic_yield-connector.config-create-feed-button" />
                              </Button>,
                              <ActionMenu
                                isLastOfGroup
                                buttonProps={{
                                  variation: 'secondary',
                                }}
                                options={configLocales.map(locale => ({
                                  label: `Localize feed for ${locale.label}`,
                                  onClick: () => {
                                    showToast({
                                      message: `Feed generation for ${locale.label} initiated`,
                                      horizontalPosition: 'right',
                                    })

                                    fetch(
                                      `/_v/arc/dynamic-yield/connector/feed/localize?locale=${locale.value}&force=true`,
                                      {
                                        method: 'POST',
                                      }
                                    )
                                  },
                                }))}
                              />,
                            ]}
                          />
                        </div>

                        <div className="ma5">
                          <ButtonGroup
                            buttons={[
                              <Button
                                variation="secondary"
                                isGrouped
                                onClick={() =>
                                  window.open(
                                    `/_v/arc/dynamic-yield/connector/feed`,
                                    '_blank'
                                  )
                                }
                              >
                                <FormattedMessage id="admin/dynamic_yield-connector.config-show-feed-button" />
                              </Button>,
                              <ActionMenu
                                buttonProps={{
                                  variation: 'secondary',
                                }}
                                options={showFeedButtonOptions}
                              />,
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </Tab>
                  
                  <Tab
                    className="t-heading-2"
                    label={
                      <FormattedMessage id="admin/dynamic_yield-connector.logs-tab-label" />
                    }
                    active={this.state.currentTab === 3}
                    onClick={() => this.handleTabChange(3)}
                  >
                    <DY_Logs />
                  </Tab>
                </Tabs>
              </div>
            </div>
          )}
        </ToastConsumer>
      </ToastProvider>
    )
  }
}

export default compose(
  graphql(GET_APP_SETTINGS, { options: { ssr: false }, name: 'appSettings' }),
  graphql(GET_SALES_CHANNELS, {
    options: { ssr: false },
    name: 'salesChannels',
  }),
  graphql(GET_LOCALES, { options: { ssr: false }, name: 'locales' }),
  graphql(GET_HOSTS, { options: { ssr: false }, name: 'hosts' }),
  graphql(SAVE_APP_SETTINGS, {
    options: { ssr: false },
    name: 'saveAppSettings',
  })
)(AdminPanel)
