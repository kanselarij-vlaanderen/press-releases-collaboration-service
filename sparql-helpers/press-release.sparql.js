import { sparqlEscapeUri, query } from 'mu';
import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { parseSparqlResult, toStatements, isInverse, normalizePredicate } from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import RESOURCE_CONFIG from '../config.json';

export async function getPressReleaseCreator(pressReleaseUri) {
  const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(pressReleaseUri)} a fabio:PressRelease ;
            dct:creator ?uri .
        ?uri mu:uuid ?id .
    } LIMIT 1
  `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}

/**
 * Collect all data for the given press-release to the given graph. The data that needs
 * to be collected is described in a resource configuration.
 *
 * Depending whether the user currently holds the edit token of the press-release all data
 * or only approvals- and historic-activities are collected in the graph
*/
export async function copyPressReleaseToGraph(pressReleaseUri, graph, isClaimedByUser) {
  let resources = RESOURCE_CONFIG.resources;
  // explicitely check on 'false' because value of isClaimedByUser may also be undefined
  // in which case all resources needs to be copied
  if (isClaimedByUser === false) {
    // if press-release is not claimed by the current user, the 'core' content of the press-release
    // will not be copied, since it cannot be changed.
    resources = resources.filter(resource => !resource.isClaimable);
  }

  for (const resourceConfig of resources) {
    const properties = await getProperties(pressReleaseUri, resourceConfig);
    if (properties.length) {
      const statements = toStatements(properties);
      await updateSudo(`
        ${PREFIXES}
        INSERT DATA {
            GRAPH ${sparqlEscapeUri(graph)}{
                ${statements}
            }
        }
      `);
    }
  }
}

/**
 * Delete all data for the given press-release from the given graph.
 * Depending whether the user currently holds the edit token of the press-release all data
 * or only approvals- and historic-activities are deleted from the graph
*/
export async function deletePressReleaseFromGraph(pressReleaseUri, graph, isClaimedByUser) {
  let resources = RESOURCE_CONFIG.resources;
  if (!isClaimedByUser) {
    // if press-release is not claimed by the current user, the core content of the press-release
    // will not be removed, since it cannot be changed.
    resources = resources.filter(resource => !resource.isClaimable);

    // sort the resources to delete the resource with the deepest path (containing '/') relative to the press-release first
    resources = resources.sort((a, b) => {
      const aLength = a.path ? (a.path.match(/\//g) || []).length : -1;
      const bLength = b.path ? (b.path.match(/\//g) || []).length : -1;
      return bLength - aLength;
    });
  }
  await deleteResources(pressReleaseUri, resources, graph);
}

/**
 * Delete all collaboration data for the given press-release from the given graph,
 * but not the press-release itself.
*/
export async function deleteCollaborationResourcesFromGraph(pressReleaseUri, graph) {
  const resources = RESOURCE_CONFIG.resources.filter(resource => [
    'ext:CollaborationActivity',
    'ext:ApprovalActivity'
  ].includes(resource.type));
  await deleteResources(pressReleaseUri, resources, graph);
}

/**
 * Delete all data related to the given press-release from the given graph.
 * The data that needs to be deleted is described in a resource configuration.
*/
async function deleteResources(pressReleaseUri, resources, graph) {
  for (const resourceConfig of resources) {
    const properties = await getProperties(pressReleaseUri, resourceConfig, graph);
    if (properties.length) {
      const statements = toStatements(properties);
      await updateSudo(`
        ${PREFIXES}
        DELETE DATA {
            GRAPH ${sparqlEscapeUri(graph)}{
                ${statements}
            }
        }`);
    }
  }
}

/**
 * Get all properties of a resource related to the given press-release.
 * The resourceConfig contains all properties (direct and reverse) that need to be retrieved.
 *
 * Note: depending whether a graph is passed as 3rd argument the queries to retrieve the properties
 * are executed on behalf of the user or using a sudo-query.
*/
async function getProperties(pressReleaseUri, resourceConfig, graph) {
  let properties = [];

  // Direct properties
  const directProperties = resourceConfig.properties.filter(p => !isInverse(p));
  if (directProperties.length) {
    let pathToPressRelease;
    if (resourceConfig.path) {
      pathToPressRelease = `${sparqlEscapeUri(pressReleaseUri)} ${resourceConfig.path}   ?subject .`;
    } else {
      pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseUri)} as ?subject)`;
    }
    const values = directProperties.map((i) => sparqlEscapeUri(i)).join('\n');

    const authorizedQuery = graph ? querySudo : query;
    const result = await authorizedQuery(`
            ${PREFIXES}
            SELECT ?subject ?predicate ?object
            WHERE {
                ${graph ? `GRAPH ${sparqlEscapeUri(graph)} {` : ''}
                    ${sparqlEscapeUri(pressReleaseUri)} a fabio:PressRelease.
                    ${pathToPressRelease}
                    ?subject ?predicate ?object .
                    VALUES ?predicate {
                       ${values}
                    }
                ${graph ? `}` : ''}
           }`);
    properties = properties.concat(result.results.bindings);
  }

  // Inverse properties
  const inverseProperties = resourceConfig.properties.filter(p => isInverse(p));
  if (inverseProperties.length) {
    let pathToPressRelease;
    if (resourceConfig.path) {
      pathToPressRelease = `${sparqlEscapeUri(pressReleaseUri)} ${resourceConfig.path}   ?object .`;
    } else {
      pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseUri)} as ?object)`;
    }
    const values = inverseProperties.map((i) => {
      const predicate = normalizePredicate(i);
      return sparqlEscapeUri(predicate);
    }).join('\n');

    const authorizedQuery = graph ? querySudo : query;
    const result = await authorizedQuery(`
            ${PREFIXES}
            SELECT ?subject ?predicate ?object
            WHERE {
                ${graph ? `GRAPH ${sparqlEscapeUri(graph)} {` : ''}
                    ${sparqlEscapeUri(pressReleaseUri)} a fabio:PressRelease.
                    ${pathToPressRelease}
                    ?subject ?predicate ?object .
                    VALUES ?predicate {
                       ${values}
                    }
                ${graph ? `}` : ''}
           }`);
    properties = properties.concat(result.results.bindings);
  }

  return properties;
}
