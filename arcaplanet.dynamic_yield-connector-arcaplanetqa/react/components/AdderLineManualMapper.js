import React, { Component, Fragment } from 'react'
import { ButtonWithIcon, IconPlusLines } from 'vtex.styleguide'

import '../global.css'
import ManualMapperLine from './ManualMapperLine'

export default class AdderLineManualMapper extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Fragment>
        <div className="flex">
          <div className="mt-auto mb-auto mr-auto">
            {this.props.componentName}
          </div>
          <div className="ml4">
            <ButtonWithIcon
              icon={<IconPlusLines />}
              variation="primary"
              onClick={() =>
                this.props.onAddLineSpec(
                  this.props.specName,
                  this.props.specCounterName
                )
              }
            />
          </div>
        </div>
        {this.props.specs.map((item, index) => (
          <ManualMapperLine
            key={index}
            lineId={index}
            onChangeArray={this.props.onChangeArray}
            item={item}
            specName={this.props.specName}
          />
        ))}
      </Fragment>
    )
  }
}
