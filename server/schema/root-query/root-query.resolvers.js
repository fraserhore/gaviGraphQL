import {
  getItem,
  getItems,
  getNode
} from '../../db'

// must match the field items in RootQuery
const rootQueryResolvers = {
  // this is the resolver for RootQuery.item
  // the first param represents the parent object, which in this case, would be the RootQuery
  // the second param is incoming parameters
  async item (rootObj, { id }) {
    // returns an object that matches the ItemType fields
    return await getItem(id)
  },
  // this is the resolver for RootQuery.items
  async items () {
    // would return an array of Item
    return await getItems()
  },

  // this is the resolver for RootQuery.node
  // the first param represents the parent object, which in this case, would be the RootQuery
  // the second param is incoming parameters
  async node (rootObj, { id }) {
    // returns an object that matches the NodeType fields
    return await getNode(id)
  },
  // this is the resolver for RootQuery.nodes
  async nodes () {
    // would return an array of Nodes
    return await getNodes()
  }
}

export default rootQueryResolvers
