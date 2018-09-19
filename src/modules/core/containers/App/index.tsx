import React from 'react'
import { ApolloProvider } from 'react-apollo'
import { LockerCluster } from 'locker-cluster/containers/LockerCluster';
import mqtt from 'mqtt'
import { client as apolloClient } from 'system/apollo';


const mqttConfig = {
  host: 'm15.cloudmqtt.com',
  sslPort: 34771,
  user: 'lbwcbjvj',
  password: 'eND_kmHSQTYb'
}
const client = mqtt.connect(`wss://${mqttConfig.user}:${mqttConfig.password}@${mqttConfig.host}:${mqttConfig.sslPort}`)

client.on('connect', function () {
  console.log('subscribing')
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
  alarm: boolean
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
    console.log('here')
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
    } = this.state
    const imgSrc = locked ? LOCKED_SRC : UNLOCKED_SRC;
    return (
      <ApolloProvider client={apolloClient}>
        <div style={{height: '100%', width: '100%' }}>
          <img src={imgSrc} style={{width: 200, height: 200}}/>
          <h3>{closed ? 'A porta está FECHADA' : 'A porta está ABERTA'}</h3>
          <h3>{locked ? 'A trava BLOQUEADA' : 'A trava LIVRE'}</h3>
          <h3>{busy ? 'O armário está OCUPADO' : 'O armário está LIVRE'}</h3>
          <h3>{alarm ? 'O alarme está ATIVO' : 'O alarme está INATIVO'}</h3>
          <button
            onClick={() => {
              client.publish('inTopic', '1')
            }}>
            CLAIM
          </button>

          <button
            onClick={() => {
              client.publish('inTopic', '2')
            }}>
            UNCLAIM
          </button>

          <button
            onClick={() => {
              client.publish('inTopic', '3')
            }}>
            DISABLE ALARM
          </button>
          <button
            onClick={() => {
              client.publish('inTopic', '6')
            }}>
            SUDO DISABLE ALARM
          </button>

          <button
            onClick={() => {
              client.publish('inTopic', '4')
            }}>
            LOCK
          </button>

          <button
            onClick={() => {
              client.publish('inTopic', '5')
            }}>
            UNLOCK
          </button>
        </div>
      </ApolloProvider>
      
    )
  }
}