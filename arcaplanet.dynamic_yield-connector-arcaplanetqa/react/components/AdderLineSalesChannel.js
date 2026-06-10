import React, { Component, Fragment } from 'react'
import { FormattedMessage } from 'react-intl'
import { ButtonWithIcon, IconPlusLines, Input, Toggle, Dropdown } from 'vtex.styleguide'
import LineSalesChannel from './LineSalesChannel'
import '../global.css'

const plus = <IconPlusLines />

export default class AdderLineSalesChannel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            numSalesChannel: 0
        }
    }

    handleAddLine = () => {
        this.props.onChangeArray('salesChannel',null,{id:'1',name:''},"create")
    }

    render() {
        return (
            <Fragment>
                <div className="flex">
                    <div className="mt-auto mb-auto mr-auto">{ <FormattedMessage id="admin/dynamic_yield-connector.config-sales-channels" /> }</div>
                    <div className="ml4">
                        <ButtonWithIcon icon={plus} variation="primary" onClick={() => this.handleAddLine()} />
                    </div>
                </div>
                {this.props.salesChannelConfig.map((item, index) =>
                    <LineSalesChannel
                        key={index}
                        lineId={index}
                        onChangeArray={this.props.onChangeArray}
                        salesChannel={this.props.salesChannel}
                        saleChannel={item} />

                )}


            </Fragment>
        )
    }
}