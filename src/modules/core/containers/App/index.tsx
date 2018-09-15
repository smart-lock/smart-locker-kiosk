import React from 'react'
import { ApolloProvider } from 'react-apollo'
import { LockerCluster } from 'locker-cluster/containers/LockerCluster';
import { client } from 'system/apollo';

export class App extends React.Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <LockerCluster />
      </ApolloProvider>
      
    )
  }
}