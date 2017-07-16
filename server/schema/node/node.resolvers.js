import { getCreator, getVersion } from '../../db'

// must match the field names in the Node type for field data
// that cannot be obtained at the parent level (eg RootQuery#node())
// meaning not every field needs a resolver implementation
const nodeResolvers = {
  // this is the resolver for Node.creator
  // the first param represents the parent object, which in this case, would be the database results
  // that were mapped to the Node fields
  async id (node) {
    return node.uuid
  },

  async creator (node) {
    return await getCreator(node.uuid)
  },

  async version (node, args) {
    console.log(args);
    return await getVersion(node.uuid, args.versionName, args.versionValidityDate, args.lang)
  }

}

export default nodeResolvers
