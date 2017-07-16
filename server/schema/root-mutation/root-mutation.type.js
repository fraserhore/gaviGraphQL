const RootMutation = `
  input ItemInputType {
  	name: String!
	desc: String
	ownerId: ID!
  }

  input NodeInputType {
  	parentId: ID!
	authorId: ID!
	contentType: String!
	lang: String
	properties: String
	relationships: String
	versionName: String
	identityNamePattern: String
  }

  type RootMutation {
    addItem ( input: ItemInputType! ): Item
    createNode ( input: NodeInputType ): Node
    updateNode ( id: String!, input: NodeInputType ): Node
  }
`
export default RootMutation
