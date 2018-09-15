import { gql } from 'apollo-boost'
import React from 'react'
import { Query } from 'react-apollo'

const GET_LOCKER_CLUSTER = gql`
query getLockerCluster($id: ID!) {
  user (where: {
		id: $id
  }) {
    id
  }
}
`

export class LockerCluster extends React.Component {
  public render() {
    return (
      <Query
        query={GET_LOCKER_CLUSTER}
        variables={{
          id: 'cjm3npxgo000n0942apox4t4r',
        }}>
        {({ data }) => (
          <div>
            {JSON.stringify(data)}
          </div>
        )}
      </Query>
    )
  }
}
