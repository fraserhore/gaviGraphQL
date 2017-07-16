const nodeType = `
  type Node {
  id: ID!
  name: String!
  contentType: String!
  creator: Node
  version(versionName: String, versionValidityDate: Int, lang: String = "en-gb"): Node
}
`

export default nodeType
