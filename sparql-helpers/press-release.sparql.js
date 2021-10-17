import { sparqlEscapeUri, query } from 'mu';
import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import {
  parseSparqlResult,
  toInsertQuery,
  toStatements,
  isInverse,
  normalizePredicate, toDeleteQuery,
} from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import RESOURCE_CONFIG from '../config.json';

export async function getPressReleaseCreator(pressReleaseURI) {
  const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?uri.
        ?uri                                    mu:uuid             ?id.
    }
    `);
  return parseSparqlResult(queryResult.results.bindings);
}

export async function copyPressReleaseToTemporaryGraph(pressReleaseURI, tempGraphURI, metaOnly) {
  let resources = RESOURCE_CONFIG.resources;
  if (metaOnly) {
    resources = resources.filter(resource => resource.isMetadata);
  }

  for (const resourceConfig of resources) {
    const properties = await getProperties(pressReleaseURI, resourceConfig);
    if (properties.length) {
      const statements = toStatements(properties);
      const insertQuery = toInsertQuery(statements, tempGraphURI);
      await updateSudo(insertQuery);
    }
  }
}

export async function deletePressReleaseFromGraph(pressReleaseURI, graphURI, metaOnly) {
  let resources = RESOURCE_CONFIG.resources;
  if (metaOnly) {
    resources = resources.filter(resource => resource.isMetadata);
  }
  for (const resourceConfig of resources) {
    const properties = await getProperties(pressReleaseURI, resourceConfig, graphURI);
    if (properties.length) {
      const statements = toStatements(properties);
      const insertQuery = toDeleteQuery(statements, graphURI);
      await updateSudo(insertQuery);
    }
  }
}

async function getProperties(pressReleaseURI, resourceConfig, graph) {
  let properties = [];

  // Direct properties
  const directProperties = resourceConfig.properties.filter(p => !isInverse(p));
  if (directProperties.length) {
    let pathToPressRelease;
    if (resourceConfig.path) {
      pathToPressRelease = `${sparqlEscapeUri(pressReleaseURI)} ${resourceConfig.path}   ?subject .`;
    } else {
      pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseURI)} as ?subject)`;
    }
    const values = directProperties.map((i) => sparqlEscapeUri(i)).join('\n');

    const authorizedQuery = graph ? querySudo : query;
    const result = await authorizedQuery(`
            ${PREFIXES}
            SELECT ?subject ?predicate ?object
            WHERE {
                ${graph ? `GRAPH ${sparqlEscapeUri(graph)} {` : ''}
                    ${sparqlEscapeUri(pressReleaseURI)} a fabio:PressRelease.
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
      pathToPressRelease = `${sparqlEscapeUri(pressReleaseURI)} ${resourceConfig.path}   ?object .`;
    } else {
      pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseURI)} as ?object)`;
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
                    ${sparqlEscapeUri(pressReleaseURI)} a fabio:PressRelease.
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
