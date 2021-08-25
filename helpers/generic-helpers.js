import { query, sparqlEscapeUri } from 'mu';
import { PREFIXES, SESSION_GRAPH } from '../sparql-helpers/constants.sparql';

export function handleGenericError(e, next) {
    console.error(e);
    e.status = 500;
    return next(e);
}

export function mapBindingValue(binding) {
    const result = {};
    for (let key in binding) {
        result[key] = binding[key].value;
    }
    return result;
}

export async function getOrganizationIdFromHeaders(headers) {
    const sessionURI = headers['mu-session-id'];
    const queryResult = await query(`
    ${PREFIXES}
    SELECT ?organisationId
    WHERE {
        ${sparqlEscapeUri(sessionURI)}  session:account / ^foaf:account / ^foaf:member / mu:uuid ?organisationId.
    }
    `);

    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0].organisationId : null;
}
