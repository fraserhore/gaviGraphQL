import { addNewItem, createNode, updateNode } from '../../db'

const rootMutationResolvers = {
  // this corresponds to the `RootMutation.addItem` type
  async addItem (rootObj, { name, desc, ownerId }) {
    // you'd have to implement this method yourself, would insert the item into a db
    return await addNewItem({ name, desc, ownerId })
  },

  async createNode (rootObj, { input: {parentId, authorId, contentType, lang, properties, relationships, versionName, identityNamePattern} }) {

  	return await createNode({ input: {parentId, authorId, contentType, lang, properties, relationships, versionName, identityNamePattern} })
  },

  async updateNode (rootObj, { id: id, input: {parentId, authorId, contentType, lang, properties, relationships, versionName, identityNamePattern} }) {

  	return await updateNode({ id: id, input: {parentId, authorId, contentType, lang, properties, relationships, versionName, identityNamePattern} })
  }

}

export default rootMutationResolvers
