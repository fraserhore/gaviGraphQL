const queryEntryPoints = `
  type RootQuery {
    # get an item
    item(id: String!): Item,
    # returns an array of items
    items: [Item],
    # get a node
    node(id: String!): Node,
    # returns an array of nodes
    nodes: [Node]
  }
`

export default queryEntryPoints
