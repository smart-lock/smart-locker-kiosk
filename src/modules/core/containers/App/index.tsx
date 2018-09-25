import React from 'react'
import { ApolloProvider } from 'react-apollo'
import mqtt from 'mqtt'
import {  apolloClient } from 'system/apollo';
import gql from 'graphql-tag';

const CMD_CLAIM = '1';
const CMD_UNCLAIM = '2';
const CMD_DEACTIVATE_ALARM = '3';
const CMD_LOCK ='4';
const CMD_UNLOCK = '5';
const CMD_SUDO_DEACTIVATE_ALARM ='6';

const cmds = {
  [CMD_CLAIM]: 'CMD_CLAIM',
  [CMD_UNCLAIM]: 'CMD_UNCLAIM',
  [CMD_DEACTIVATE_ALARM]: 'CMD_DEACTIVATE_ALARM',
  [CMD_LOCK]: 'CMD_LOCK',
  [CMD_UNLOCK]: 'CMD_UNLOCK',
  [CMD_SUDO_DEACTIVATE_ALARM]: 'CMD_SUDO_DEACTIVATE_ALARM',
}
const mqttConfig = {
  host: 'm15.cloudmqtt.com',
  sslPort: 34771,
  user: 'lbwcbjvj',
  password: 'eND_kmHSQTYb'
}
const mqttUri = `wss://${mqttConfig.user}:${mqttConfig.password}@${mqttConfig.host}:${mqttConfig.sslPort}`
const client = mqtt.connect(mqttUri)

const randomBool = () => Math.random() > 0.5
const booleanToInt = (bool: boolean) => bool ? 1 : 0;

client.on('connect', function () {
  console.log('connected')
  client.subscribe('lockers/2C:3A:E8:2F:06:BB')
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
      lockerIndex: '1',
    }
  }
  private statusToBoolean = (status: string): boolean => status === '1'

  reportState = () => {
    const {
      macAddress,
      lockerIndex,
      busy,
      locked,
      closed,
      alarm,
    } = this.state
    const payload = [busy,locked,closed,alarm].map(booleanToInt).join(':')
    console.log(payload)
    console.log({
      busy,
      locked,
      closed,
      alarm
    })
    client.publish(`lockers/${macAddress}/${lockerIndex}/report`, payload)
  }
  componentDidMount() {
    client.on('message', (topic, data) => {
      const message = data.toString()
      const lockerIndex = message[0]
      const cmd = message[1]

      console.log(lockerIndex, (cmds as any)[cmd])
      switch (cmd) {
        case CMD_CLAIM:
          this.setState({
            busy: true,
          }, this.reportState)
          break;
        case CMD_UNCLAIM:
          this.setState({
            busy: false,
          }, this.reportState)
          break;
        case CMD_DEACTIVATE_ALARM:
          this.setState({
            alarm: false,
          }, this.reportState)
          break;
        case CMD_LOCK:
          this.setState({
            locked: true,
          }, this.reportState)
          break;
        case CMD_UNLOCK:
          this.setState({
            locked: false,
          }, this.reportState)
          break;
        case CMD_SUDO_DEACTIVATE_ALARM:
          this.setState({
            alarm: false,
          }, this.reportState)
          break;
      }
    })

    this.fetchBusyState()
  }

  private openDoor = () => {
    this.setState({
      closed: false
    }, this.reportState)
  }

  private closeDoor = () => {
    this.setState({
      closed: true,
    }, this.reportState)
  }

  private activateAlarm = () => {
    this.setState({
      alarm: true,
    }, this.reportState)
  }

  private selectLocker = () => {
    console.log('publishing')
    client.publish('lockers/2C:3A:E8:2F:06:BB', '17');
  }

  private claimLocker = () => {
    client.publish('lockers/2C:3A:E8:2F:06:BB', '11');
  }

  private unclaimLocker = () => {
    client.publish('lockers/2C:3A:E8:2F:06:BB', `1${CMD_UNCLAIM}`);
  }

  private fetchBusyState = () => {
    apolloClient.query<any>({
      query: gql`query {
      lockerClusterByMacAddress(macAddress: "2C:3A:E8:2F:06:BB") {
        id
        lockers {
          id
          idInCluster
          busy
        }
      }
    }`})
    .then((response) => {
      console.log(response)
      const firstLocker = response.data.lockerClusterByMacAddress.lockers[0]
      this.setState({
        busy: firstLocker.busy,
      }, this.reportState)
    })
  }
  render() {
    const {
      closed,
      locked,
      busy,
      alarm,
      macAddress,
      lockerIndex,
    } = this.state
    const imgSrc = locked ? LOCKED_SRC : UNLOCKED_SRC;

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
          <span style={{marginBottom: 20}}>{locked ? 'A trava TRAVADA' : 'A trava DESTRAVADA'}</span>
          <span style={{marginBottom: 20}}>{busy ? 'O armário está OCUPADO' : 'O armário está LIVRE'}</span>
          <span style={{marginBottom: 20}}>{alarm ? 'O alarme está ATIVO' : 'O alarme está INATIVO'}</span>

          <div style={{display: 'flex', flexDirection: 'row'}}>
            <button
              onClick={this.openDoor}>
              OPEN DOOR
            </button>

            <button
              onClick={this.closeDoor}>
              CLOSE DOOR
            </button>

            <button
              onClick={this.activateAlarm}>
              ALARM!
            </button>

            <button
              onClick={this.selectLocker}>
              SELECT LOCKER 1
            </button>

            <button
              onClick={this.claimLocker}>
              CLAIM
            </button>

            <button
              onClick={this.unclaimLocker}>
              UNCLAIM
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