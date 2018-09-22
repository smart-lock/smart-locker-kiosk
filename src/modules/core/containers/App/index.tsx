import React from 'react'
import { ApolloProvider } from 'react-apollo'
import { LockerCluster } from 'locker-cluster/containers/LockerCluster';
import mqtt from 'mqtt'
import { client as apolloClient } from 'system/apollo';

const CMD_CLAIM = '1';
const CMD_UNCLAIM = '2';
const CMD_DEACTIVATE_ALARM = '3';
const CMD_LOCK ='4';
const CMD_UNLOCK = '5';
const CMD_SUDO_DEACTIVATE_ALARM ='6';

const mqttConfig = {
  host: 'm15.cloudmqtt.com',
  sslPort: 34771,
  user: 'lbwcbjvj',
  password: 'eND_kmHSQTYb'
}
const mqttUri = `wss://${mqttConfig.user}:${mqttConfig.password}@${mqttConfig.host}:${mqttConfig.sslPort}`
console.log(mqttUri)
const client = mqtt.connect(mqttUri)

const randomBool = () => Math.random() > 0.5
const booleanToInt = (bool: boolean) => bool ? 1 : 0;

client.on('connect', function () {
  console.log('connected')
  client.subscribe('locker/1/closed')
  client.subscribe('locker/1/busy')
  client.subscribe('locker/1/alarm')
  client.subscribe('locker/1/locked')
  client.subscribe('locker/1/error')
})
client.on('error', (error) => {
  console.log(error)
})

const LOCKED_SRC = 'https://image.flaticon.com/icons/svg/26/26053.svg'
const UNLOCKED_SRC = 'https://image.flaticon.com/icons/svg/158/158599.svg'

export interface IProps {
  lastUpdate: Date | null,
  closed: boolean,
  locked: boolean,
  busy: boolean,
  alarm: boolean,
  macAddress: string,
  lockerIndex: string,
}
export class App extends React.Component<{}, IProps> {
  constructor(props: IProps) {
    super(props)
    this.state = {
      lastUpdate: null,
      closed: false,
      locked: false,
      busy: false,
      alarm: false,
      macAddress: '2C:3A:E8:2F:06:BB',
      lockerIndex: '0',
    }
  }
  private statusToBoolean = (status: string): boolean => status === '1'

  handleClosed = (topic: string, message: string) => {
    const closed= this.statusToBoolean(message)
    this.setState({
      closed
    })
  }

  private handleLocked = (topic: string, message: string) => {
    const locked = this.statusToBoolean(message)
    this.setState({
      locked,
    })
  }

  private handleBusy = (topic: string, message: string) => {
    const busy = this.statusToBoolean(message)
    this.setState({
      busy,
    })
  }

  private handleAlarm = (topic: string, message: string) => {
    const alarm = this.statusToBoolean(message)
    this.setState({
      alarm,
    })
  }
  private handleError = (topic: string, message: string) => {
    console.log(message);
  }
  componentDidMount() {
    client.on('message', (topic, data) => {
      const message = data.toString()
      switch (topic) {
        case 'locker/1/closed':
        this.handleClosed(topic, message)
          break;
        case 'locker/1/locked':
        this.handleLocked(topic, message)
          break;
        case 'locker/1/busy':
        this.handleBusy(topic, message)
          break;
        case 'locker/1/alarm':
        this.handleAlarm(topic, message)
          break;
        case 'locker/1/error':
        this.handleError(topic, message)
          break;
      }
    })   
  }
  render() {
    const {
      lastUpdate,
      closed,
      locked,
      busy,
      alarm,
      macAddress,
      lockerIndex,
    } = this.state
    const imgSrc = locked ? LOCKED_SRC : UNLOCKED_SRC;

    const topic = `lockers/${macAddress}`
    const cmdPrefix = `${lockerIndex}`

    return (
      <ApolloProvider client={apolloClient}>
        <div style={{height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
          <div>
            MAC-ADDRESS: <input type="text" value={macAddress} onChange={(e) => this.setState({
              macAddress: e.target.value,
            })} />  
          </div>
          <div>
            LOCKER_INDEX: <input type="text" value={lockerIndex} onChange={(e) => this.setState({
              lockerIndex: e.target.value,
            })} />
          </div>
          <hr />
          <img src={imgSrc} style={{width: 200, height: 200, marginBottom: 20}}/>
          <span style={{marginBottom: 20}}>{closed ? 'A porta está FECHADA' : 'A porta está ABERTA'}</span>
          <span style={{marginBottom: 20}}>{locked ? 'A trava BLOQUEADA' : 'A trava LIVRE'}</span>
          <span style={{marginBottom: 20}}>{busy ? 'O armário está OCUPADO' : 'O armário está LIVRE'}</span>
          <span style={{marginBottom: 20}}>{alarm ? 'O alarme está ATIVO' : 'O alarme está INATIVO'}</span>

          <div style={{display: 'flex', flexDirection: 'row'}}>
            <button
              onClick={() => {
                client.publish(topic, `${cmdPrefix}${CMD_CLAIM}`)
              }}>
              CLAIM
            </button>

            <button
              onClick={() => {
                client.publish(topic, `${cmdPrefix}${CMD_UNCLAIM}`)
              }}>
              UNCLAIM
            </button>

            <button
              onClick={() => {
                client.publish(topic, `${cmdPrefix}${CMD_DEACTIVATE_ALARM}`)
              }}>
              DISABLE ALARM
            </button>
            <button
              onClick={() => {
                client.publish(topic, `${cmdPrefix}${CMD_SUDO_DEACTIVATE_ALARM}`)
              }}>
              SUDO DISABLE ALARM
            </button>

            <button
              onClick={() => {
                console.log(topic)
                client.publish(topic, `${cmdPrefix}${CMD_LOCK}`)
              }}>
              LOCK
            </button>

            <button
              onClick={() => {
                client.publish(topic, `${cmdPrefix}${CMD_UNLOCK}`)
              }}>
              UNLOCK
            </button>

            <button
              onClick={() => {
                const payload = [0,0,0,0].map(randomBool).map(booleanToInt).join(':')
                console.log(payload)
                client.publish(`lockers/${macAddress}/${lockerIndex}/report`, payload)
              }}>
              FAKE REPORT
            </button>
          </div>
          
        </div>
      </ApolloProvider>
      
    )
  }
}