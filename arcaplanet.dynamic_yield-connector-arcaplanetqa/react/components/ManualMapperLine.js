import React, { Component, Fragment } from 'react'
import { ButtonWithIcon, IconDelete, Input, Checkbox, Dropdown } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'


const remove = <IconDelete />

export default class ManualMapperLine extends Component {
    constructor(props) {
        super(props)
    }

    handleInputSpecName = (event, id) => {
        this.props.onChangeArray(this.props.specName, id, {
            id: this.props.item.id,
            specName: event.target.value,
            specXML: this.props.item.specXML,
            flagShowKeyword: this.props.item.flagShowKeyword,
            flagCustomProp: this.props.item.flagCustomProp
        }, "update")
    }

    handleInputSpecXML = (event, id) => {
        this.props.onChangeArray(this.props.specName, id, {
            id: this.props.item.id,
            specName: this.props.item.specName,
            specXML: event.target.value,
            flagShowKeyword: this.props.item.flagShowKeyword,
            flagCustomProp: this.props.item.flagCustomProp
        }, "update")
    }

    handleInputShowKeyword = (event, id) => {
        this.props.onChangeArray(this.props.specName, id, {
            id: this.props.item.id,
            specName: this.props.item.specName,
            specXML: this.props.item.value,
            flagShowKeyword: event.target?.checked,
            flagCustomProp: this.props.item.flagCustomProp
        }, "update")
    }

    handleInputIsCustomProp = (event, id) => {
        this.props.onChangeArray(this.props.specName, id, {
            id: this.props.item.id,
            specName: this.props.item.specName,
            specXML: this.props.item.value,
            flagShowKeyword: this.props.item.flagShowKeyword,
            flagCustomProp: event.target?.checked
        }, "update")
    }

    handleDeleteLine = (name, id, key) => {
        this.props.onChangeArray(name, key, null, "delete")
    }

    render() {
        return (
            <div className="flex mt3" data-line={this.props.lineId}>
                <div className="w-50">
                    <Input
                        name="specName"
                        onChange={(event) => this.handleInputSpecName(event, this.props.lineId)}
                        value={this.props.item.specName}
                        placeholder="VTEX specificaction"
                    />
                </div>
                <div className="w-50">
                    <Input
                        name="specXML"
                        onChange={(event) => this.handleInputSpecXML(event, this.props.lineId)}
                        value={this.props.item.specXML}
                        placeholder="Dynamic Yields specification"
                    />
                </div>
                <div className="ml3 w-30">
                    <div className="">
                        <Checkbox
                            className="tc pa2"
                            label={<FormattedMessage id="admin/dynamic_yield-connector.config-show-as-keyword" />}
                            id="flagShowKeyword"
                            name="flagShowKeyword"
                            checked={this.props.item.flagShowKeyword}
                            onChange={e => this.handleInputShowKeyword(e, this.props.lineId, 'flagShowKeyword')}
                        />
                    </div>
                    <div className="">
                        <Checkbox
                            className="tc pa2"
                            label={<FormattedMessage id="admin/dynamic_yield-connector.config-is-custom-prop" />}
                            id="flagCustomProp"
                            name="flagCustomProp"
                            checked={this.props.item.flagCustomProp}
                            onChange={e => this.handleInputIsCustomProp(e, this.props.lineId, 'flagCustomProp')}
                        />
                    </div>
                </div>
                <div className="ml4">
                    <ButtonWithIcon icon={remove} variation="danger" onClick={() => this.handleDeleteLine(this.props.specName, this.props.item.id, this.props.lineId)} />
                </div>
            </div>
        )
    }
}