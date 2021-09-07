import { PREFIXES } from '../constants';
import { mapBindingValue } from '../helpers/generic-helpers';
import { query, sparqlEscapeUri } from 'mu';

export async function getOrganizationFromHeaders(headers) {
    const sessionURI = headers['mu-session-id'];
    const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(sessionURI)}  session:account / ^foaf:account / ^foaf:member ?uri.
        ?uri mu:uuid ?id.
    }
    `);

    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function getUserFromHeaders(headers) {
    const sessionURI = headers['mu-session-id'];
    const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri
    WHERE {
        ${sparqlEscapeUri(sessionURI)}  session:account / ^foaf:account ?uri.
    }
    `);

    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}