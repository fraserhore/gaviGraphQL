// Require the neo4j graph database connector
const neo4jBolt = require('neo4j-driver').v1;
const local = require('./local');
const driver = neo4jBolt.driver("bolt://"+local.neo4j.host, neo4jBolt.auth.basic(local.neo4j.user, local.neo4j.password));

const ITEMS = [
  {
    id: 1,
    name: 'Test Item',
    description: 'This is a test item',
    ownerId: 234
  },
  {
    id: 2,
    name: 'Test Item 2',
    description: 'This is a test item 2',
    ownerId: 234
  }
]

export async function getNode (id) {
  const session = driver.session();
  const options = {id: id};
  const query = 'MATCH (node) WHERE node.uuid = {id} RETURN node';
  try {
    const result = await session.run(query, options);
    const record = result.records[0];
    session.close();
    return record.get('node').properties;
  } catch (error) {
      session.close();
      console.log(error);
      return error;
      throw error;
  }
}

export function getNodes () {
  return ITEMS
}

export async function getCreator (id) {
  const session = driver.session();
  const options = {id: id};
  const query = 'MATCH (node)-[created:CREATED]-(creator) WHERE node.uuid = {id} RETURN creator';
  try {
    const result = await session.run(query, options);
    const record = result.records[0];
    session.close();
    return record.get('creator').properties;
    } catch (error) {
        session.close();
        console.log(error);
        return error;
        throw error;
    }
}

export async function getVersion (id, versionName, versionValidityDate, lang) {
  const session = driver.session();
  const options = {id: id};
  options.lang = lang || "en-gb";
  let versionMatch = "";
  if(versionName) {
      versionMatch = ' AND version.versionName = "' + versionName + '"';
  } else if(versionValidityDate) {
      versionMatch += " AND version.from <= " + versionValidityDate + " AND version.to >= " + versionValidityDate;
  } else {
      versionMatch += " AND version.to = 9007199254740991";
  }
  const query = 'MATCH (node)-[version:VERSION {lang:{lang}}]->(versionNode) WHERE node.uuid = {id} ' + versionMatch + ' RETURN versionNode';

  try {
    const result = await session.run(query, options);
    console.log(result);
    const record = result.records[0];
    session.close();
    return record.get('versionNode').properties;
    } catch (error) {
        session.close();
        console.log(error);
        return error;
        throw error;
    }
}

export function getItem (id) {
  let target = null

  ITEMS.some((item) => {
    if (item.id == id) {
      target = item
      return true
    }
  })

  return target
}

export function getItems () {
  return ITEMS
}

export function getUser () {
  return {
    id: 234,
    username: 'test'
  }
}

export function addNewItem (input) {
  const item = {
    id: (ITEMS.length + 1),
    name,
    desc,
    ownerId
  }

  ITEMS.push(item)

  return item
}

export async function createNode ({input}) {

  console.log(input);

  const session = driver.session();
  const options = input;
  const properties = options.properties;
  const relationships = options.relationships;
  let relationshipsStatement = '';
  options.versionName = options.versionName || "initial";
  console.log(options.properties);
  options.properties = options.properties ? JSON.parse(options.properties) : undefined;
  options.relationships = options.relationships ? JSON.parse(options.relationships) : undefined;
  options.identityNamePattern = options.identityNamePattern ? options.identityNamePattern : 'childversion.' + (options.properties.name ? 'name' : options.properties.title ? 'title' : options.properties.term ? 'term' : options.properties.identifier ? 'identifier' : 'name');

  if(relationships.length) {
      var matchRelated = ' MATCH ',
          whereRelated = ' WHERE ',
          createRelationships = '';
      for (var i = relationships.length - 1; i >= 0; i--) {
         //console.log(relationships[i]);
          var relationshipName = relationships[i].relationshipName.toUpperCase(),
              direction = relationships[i].direction,
              inboundSymbol = direction === 'inbound' ? '<' : '',
              outboundSymbol = direction === 'outbound' ? '>' : '',
              relatedNode = relationships[i].relatedNode,
              relatedNodeId = relatedNode.properties.uuid,
              relatedIdentifier = 'node' + relatedNodeId.replace(/-/g, '');
          
          matchRelated += '(' + relatedIdentifier + ')';
          whereRelated += relatedIdentifier + '.uuid = "' + relatedNodeId + '"';
          if(i) {
              matchRelated += ', ';
              whereRelated += ', ';
          } 
          createRelationships += ' CREATE (childidentity)' + inboundSymbol + '-[:' + relationshipName + ' {from:timestamp(), to:9007199254740991}]-' + outboundSymbol + '(' + relatedIdentifier + ')';
          //console.log(matchRelated);
      };
      relationshipsStatement = ' WITH parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, author' 
                               + matchRelated
                               + whereRelated 
                               + createRelationships;
  }
  console.log(relationshipsStatement);
  const query =  // Match path from root to parent so we can use it later to create the URL alias.
     ' MATCH p = (a:Root)-[:CONTAINS*]->(parent)'
    // Match on parent uuid and author uuid
    +' WHERE parent.uuid = {parentId}'
    // Create new identity and version
    +' CREATE (parent)-[:CONTAINS {from:timestamp(), to:9007199254740991, versionNumber:1, versionName:{versionName}}]->'
    +       '(childidentity:Identity:ContentObject {contentType:{contentType}})'
    +       '-[:VERSION {from:timestamp(), to:9007199254740991, versionNumber:1, versionName:{versionName}, lang:{lang}}]->'
    +       '(childversion:Version)'
    // Create URL alias identity and version
    +' CREATE (childidentity)-[:URL_ALIAS {from:timestamp(), to:9007199254740991, versionNumber:1, versionName:{versionName}}]->'
    +       '(urlAliasIdentity:Identity:UrlAlias {contentType:"urlAlias"})'
    +       '-[:VERSION {from:timestamp(), to:9007199254740991, versionNumber:1, versionName:{versionName}, lang:{lang}}]->'
    +       '(urlAliasVersion:Version)'
    // Set properties
    +' SET childidentity:' + options.contentType
    +' SET childversion = {properties}'
    +' SET childidentity.name = ' + options.identityNamePattern

    +' WITH parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, reduce(urlAlias = "", n IN nodes(p)| urlAlias + "/" + replace(n.name," ", "-") + "/" + replace(childversion.name," ", "-")) AS urlAlias'
    +' MATCH (author)'
    +' WHERE author.uuid = {authorId}'
    // Create relationshps from author to identity nodes and version nodes
    +' CREATE (author)-[:CREATED {timestamp:timestamp()}]->(childidentity)'
    +' CREATE (author)-[:CREATED {timestamp:timestamp()}]->(childversion)'
    +' CREATE (author)-[:CREATED {timestamp:timestamp()}]->(urlAliasIdentity)'
    +' CREATE (author)-[:CREATED {timestamp:timestamp()}]->(urlAliasVersion)'
    // Set URL Alias
    +' SET urlAliasIdentity.name = urlAlias'
    +' SET urlAliasVersion.urlAlias = urlAlias'
    // Set uuids
    +' WITH parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, author'
    +' CALL apoc.create.uuids(4) YIELD uuid'
    +' WITH parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, author, collect(uuid) as uuids'
    +' SET childidentity.uuid = uuids[0]'
    +' SET childversion.uuid = uuids[1]'
    +' SET urlAliasIdentity.uuid = uuids[2]'
    +' SET urlAliasVersion.uuid = uuids[3]'

    // Create relationships if there are any
    +  relationshipsStatement

    // Create relationship to content type
    +' WITH parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, author'
    +' MATCH (contentType:ContentType)-[:VERSION {to:9007199254740991}]->(contentTypeVersion)'
    +' WHERE contentTypeVersion.identifier = {contentType}'
    +' CREATE (childidentity)-[:INSTANCE_OF]->(contentType)'

    // Return results
    +' RETURN parent, childidentity, childversion, urlAliasIdentity, urlAliasVersion, author';
  console.log(query);

  try {
    const result = await session.run(query, options);
    const record = result.records[0];
    const payload = {
              'parent': record.get('parent'),
              'identityNode': record.get('childidentity'), 
              'versionNode': record.get('childversion'),
              'authorNode': record.get('author'),
              'urlAliasIdentity': record.get('urlAliasIdentity'),
              'urlAliasVersion': record.get('urlAliasVersion')
          };
    session.close();
    console.log(record.get('childidentity').properties);
    return record.get('childidentity').properties;
  } catch (error) {
      session.close();
      console.log(error);
      return error;
      throw error;
  }
}

export function updateNode (id, input) {

  console.log(id);

}

