import { Component } from 'react'
import { FormattedMessage } from 'react-intl'

import {
  Dropdown,
  EXPERIMENTAL_Select,
  Input,
  Toggle,
  Checkbox
} from 'vtex.styleguide'
import AdderLineManualMapper from './AdderLineManualMapper'
import AdderLineSalesChannel from './AdderLineSalesChannel'

export default class DY_Config extends Component {
  constructor(props) {
    super(props)
  }

  handleInputChange = (event, objectName = null) => {
    const dy_config = this.props.dyConfig

    if (event.target.type == 'checkbox') {
      this.props.onChange(objectName, !dy_config[objectName])
    } else {
      this.props.onChange(event.target.name, event.target.value)
    }
  }

  componentDidUpdate(nextProps) {
    if (nextProps.dyConfig) {
    }
  }

  render() {
    const dy_config = this.props.dyConfig

    const currentLocales = JSON.parse(dy_config.locales)
    const hosts = this.props.hosts

    const locales =
      this.props.locales.length > 0 ? this.props.locales : currentLocales

    return (
      <div className="w-100-ns center">
        <div>
          <h3>{<FormattedMessage id="admin/dynamic_yield-connector.config-title" />}</h3>
        </div>
        <div className="mb5">
          <Input
            className="tc pa2"
            label={<FormattedMessage id="admin/dynamic_yield-connector.config-affiliate-id" />}
            type="text"
            id="prefixAffiliateID"
            name="prefixAffiliateID"
            value={dy_config.prefixAffiliateID}
            onChange={this.handleInputChange}
          />
        </div>

        <div className="mb5">
          {hosts ? (
            <Dropdown
              className="tc pa2"
              options={hosts.map(item => {
                return { value: item, label: item }
              })}
              label={<FormattedMessage id="admin/dynamic_yield-connector.config-shop-domain" />}
              id="domainShop"
              name="domainShop"
              value={dy_config.domainShop}
              initialValue={dy_config.domainShop}
              placeholder="Select Domain"
              onChange={this.handleInputChange}
            />
          ) : (
            <Dropdown
              className="tc pa2"
              // //options={ hosts.map((item) => {console.log("ITEM ", item); return {value: item, label: item}})}
              label={<FormattedMessage id="admin/dynamic_yield-connector.config-shop-domain" />}
              id="domainShop"
              name="domainShop"
              value={dy_config.domainShop}
              initialValue={dy_config.domainShop}
              placeholder="Select Domain"
              onChange={this.handleInputChange}
            />
          )}
        </div>

        <div>
          <h3>
            {
              <FormattedMessage id="admin/dynamic_yield-connector.config-sales-channel-mapping" />
            }
          </h3>
        </div>
        <div className="mb5">
          <AdderLineSalesChannel
            salesChannel={this.props.salesChannel}
            salesChannelConfig={dy_config.salesChannel}
            onChangeArray={this.props.onChangeArray}
          />
        </div>

        <div>
          <h3>{<FormattedMessage id="admin/dynamic_yield-connector.config-locale" />}</h3>
        </div>
        <div className="mb5">
          <EXPERIMENTAL_Select
            label="Available locales"
            options={locales ?? []}
            multi={true}
            defaultValue={currentLocales?.length > 0 ? currentLocales : []}
            onChange={values => {
              // //console.log(values);
              this.props.onChange('locales', JSON.stringify(values))
            }}
          />
        </div>

        <div>
          <h3>
            {
              <FormattedMessage id="admin/dynamic_yield-connector.config-specifications-mapping" />
            }
          </h3>
        </div>

        <div className="mb5">
          <AdderLineManualMapper
            componentName={
              <FormattedMessage id="admin/dynamic_yield-connector.config-mapper-product-data" />
            }
            specName="productDataCustomFields"
            specCounterName="numProductData"
            onAddLineSpec={this.props.onAddLineSpec}
            specs={dy_config.productDataCustomFields}
            onChangeArray={this.props.onChangeArray}
          />
        </div>

        <div className="mb5">
          <AdderLineManualMapper
            componentName={
              <FormattedMessage id="admin/dynamic_yield-connector.config-mapper-product-specs" />
            }
            specName="productSpecifications"
            specCounterName="numProductSpecifications"
            onAddLineSpec={this.props.onAddLineSpec}
            specs={dy_config.productSpecifications}
            onChangeArray={this.props.onChangeArray}
          />
        </div>

        <div className="mb5">
          <AdderLineManualMapper
            componentName={
              <FormattedMessage id="admin/dynamic_yield-connector.config-mapper-sku-specs" />
            }
            specName="skuSpecifications"
            specCounterName="numSkuSpecifications"
            onAddLineSpec={this.props.onAddLineSpec}
            specs={dy_config.skuSpecifications}
            onChangeArray={this.props.onChangeArray}
          />
        </div>
        <div>
          <h3>
            {<FormattedMessage id="admin/dynamic_yield-connector.config-additional-settings" />}
          </h3>
        </div>
        <div className="mb5">
          <Dropdown
            className="tc pa2"
            options={
              new Array(
                { value: 'json', label: 'json' },
                { value: 'xml', label: 'xml' },
                { value: 'csv', label: 'csv' }
              )
            }
            label={<FormattedMessage id="admin/dynamic_yield-connector.config-feed-format" />}
            id="feedFormat"
            name="feedFormat"
            value={dy_config.feedFormat}
            initialValue={dy_config.feedFormat}
            placeholder="Select Format"
            onChange={this.handleInputChange}
          />
        </div>

        <div className="mb5">
          <Toggle
            className="tc pa2"
            label={<FormattedMessage id="admin/dynamic_yield-connector.config-out-of-stock" />}
            id="flagExportOutOfStockSKU"
            name="flagExportOutOfStockSKU"
            checked={dy_config.flagExportOutOfStockSKU}
            onChange={e => this.handleInputChange(e, 'flagExportOutOfStockSKU')}
          />
        </div>

        <div className="mb5">
          <Toggle
            className="tc pa2"
            label={<FormattedMessage id="admin/dynamic_yield-connector.config-valid-gtin" />}
            id="flagCheckValidGTIN"
            name="flagCheckValidGTIN"
            checked={dy_config.flagCheckValidGTIN}
            onChange={e => this.handleInputChange(e, 'flagCheckValidGTIN')}
          />
        </div>
      </div>
    )
  }
}
