import { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { compose, graphql } from 'react-apollo'
import { DatePicker } from 'vtex.styleguide'
import moment from 'moment';
import { withRuntimeContext } from 'vtex.render-runtime'

import logsDY from '../queries/logsDY.gql'

let masterLogsData = new Array;

class DY_Logs extends Component {
    constructor(props) {
        super(props),
        this.state = {
            startDate: new Date(),
            logsData: masterLogsData
        }

        this.handleStartDate = this.handleStartDate.bind(this)
        this.getLogData = this.getLogData.bind(this);

        if (!this.props.logsDY.loading) {
            masterLogsData = this.props.logsDY.logsDY;
            this.getLogData()
        }
    }

    handleStartDate(date) {
        this.setState({
            startDate: date
        }, () => { this.props.logsDY.refetch();  
            
            if(this.props.logsDY.logsDY){
                masterLogsData = this.props.logsDY.logsDY; 
            }
            
            this.getLogData() });
    }

    componentDidMount() {
        this.getLogData()
    }

    componentDidUpdate(nextProps) {
        if (!nextProps.logsDY.loading && this.props.logsDY.loading) {
            masterLogsData = nextProps.logsDY.logsDY;
            this.getLogData()
        }
    }

    getLogData() {
        if(masterLogsData){
            let startDate = (moment(this.state.startDate).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })).format()
            let endDate = (moment(this.state.startDate).set({ hour: 23, minute: 59, second: 59, millisecond: 999 })).format()

            let newLogData = masterLogsData.filter(
                item => item.date > startDate && item.date < endDate
            );

            this.setState( { logsData:  newLogData } );
        }
    }

    render()
    {
        const colorError = ($type) => {
            switch($type){
                case 'error':
                    return 'red'
                    break
                case 'warning':
                    return 'yellow'
                    break
                case 'success':
                    return 'green'
                    break
                default:
                    return ''
            }
        }
        
        return (
            <div className="w-100-ns center">
                <div >
                    <h3>{ <FormattedMessage id="admin/dynamic_yield-connector.logs-select-date" /> }</h3>
                    {
                        this.datePickerWithLocale(
                            <FormattedMessage id="admin/dynamic_yield-connector.logs-log-date" />,
                            this.state.startDate,
                            this.handleStartDate
                        )
                    }
                </div>

                <div>
                    <h3>{ <FormattedMessage id="admin/dynamic_yield-connector.logs-title" /> }</h3>   
                    {this.state.logsData && this.state.logsData.length >0 && this.state.logsData.map((item,key) => {
                        let class_name = `${colorError(item.type)} lengow-${item.type}`;
                        return (
                            <p key={key} className={class_name}> {item.date} - #{item.orderID}# - {item.type}: {item.msg} </p>
                        )
                    })}
                    {this.props.logsDY.loading && 
                        <p> { <FormattedMessage id="admin/dynamic_yield-connector.loading" /> } </p>
                    }
                    {this.state.logsData &&  this.state.logsData.length == 0 && !this.props.logsDY.loading &&
                        <p> { <FormattedMessage id="admin/dynamic_yield-connector.logs-no-results" /> } </p> 
                     }
                </div>
            </div>
        )
    }
    
    datePickerWithLocale = (labelDP, valueDP, onChangeDP) => {
        const {
          culture: { locale },
        } = this.props.runtime
        
        return (
            <DatePicker
                label= { labelDP }
                value={ valueDP }
                onChange={ onChangeDP }
                locale={ locale }
            />
        )
    }
}

export default compose(
    withRuntimeContext ,
    graphql(logsDY, { options: { ssr: false }, name: 'logsDY' })
)(DY_Logs)