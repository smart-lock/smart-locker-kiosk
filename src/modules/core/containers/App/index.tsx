import React from 'react'
import { ApolloProvider } from 'react-apollo'
import { LockerCluster } from 'locker-cluster/containers/LockerCluster';
import { client } from 'system/apollo';
import mqtt from 'mqtt'



const mqttConfig = {
  host: 'm15.cloudmqtt.com',
  sslPort: 34771,
  user: 'lbwcbjvj',
  password: 'eND_kmHSQTYb'
}
const client  = mqtt.connect(`wss://${mqttConfig.user}:${mqttConfig.password}@${mqttConfig.host}:${mqttConfig.sslPort}`)

client.on('connect', function () {
  client.subscribe('locker/1/dht')
  client.subscribe('locker/1/button')
})



export class App extends React.Component<{}, {h: number, t: number, buttonPressed: boolean, lastUpdate: Date | null}> {
  constructor(props) {
    super(props)
    this.state = {
      h: 0,
      t: 0,
      buttonPressed: false,
      lastUpdate: null,
    }
  }
  handleDHT = (topic: string, message: string) => {
    const [ h, t ] = message.split(':').map(Number)
    this.setState({
      h,
      t,
      lastUpdate: new Date()
    })
  }

  handleButton = (topic: string, message: string) => {
    const buttonPressed = message === '0' ? true : false
    this.setState({
      buttonPressed
    })
  }
  componentDidMount() {
    client.on('message', (topic, data) => {
      const message = data.toString()
      switch (topic) {
        case 'locker/1/dht':
          this.handleDHT(topic, message)
          break;
        case 'locker/1/button':
        this.handleButton(topic, message)
          break;
      }
    })   
  }
  render() {
    const {
      buttonPressed,
      lastUpdate
    } = this.state
    const backgroundColor = buttonPressed ? 'tomato' : 'steelblue'
    return (
      <ApolloProvider client={client}>
        <div style={{height: '100%', width: '100%', backgroundColor }}>
          <h1 style={{color: '#FFF'}}>Humidity: {this.state.h} / Temp: {this.state.t}</h1>
          <h3>Last update: {lastUpdate ? lastUpdate.toString() : 'Loading...'}</h3>
        </div>
      </ApolloProvider>
      
    )
  }
}