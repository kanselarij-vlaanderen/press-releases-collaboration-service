import { PREFIXES } from '../constants';
import { parseSparqlResult } from '../helpers/generic-helpers';
import { query, sparqlEscapeUri } from 'mu';

export async function getOrganizationFromHeaders(headers) {
  const sessionUri = headers['mu-session-id'];
  const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(sessionUri)} ext:sessionGroup ?uri .
        ?uri mu:uuid ?id .
    } LIMIT 1
    `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}

export async function getUserFromHeaders(headers) {
  const sessionUri = headers['mu-session-id'];
  const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri
    WHERE {
        ${sparqlEscapeUri(sessionUri)} session:account / ^foaf:account ?uri .
    } LIMIT 1
  `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}
