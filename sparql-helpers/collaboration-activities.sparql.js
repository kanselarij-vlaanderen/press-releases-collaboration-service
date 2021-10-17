import { sparqlEscapeString, sparqlEscapeUri, query } from 'mu';
import { parseSparqlResult } from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import { updateSudo } from '@lblod/mu-auth-sudo';

export async function getCollaborationActivityById(id) {
  const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?pressReleaseUri ?tokenClaimUri
    WHERE {
        ?uri a ext:CollaborationActivity;
             mu:uuid ${sparqlEscapeString(id)};
             prov:used ?pressReleaseUri.
        OPTIONAL { ?uri prov:generated ?tokenClaimUri }
    }
    LIMIT 1
    `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}

export async function getCollaborators(collaborationActivityURI) {
  const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(collaborationActivityURI)}    a                           ext:CollaborationActivity;
                                                        prov:wasAssociatedWith      ?uri.
        ?uri                                            a                           vcard:Organization;
                                                        mu:uuid                     ?id.
    }
    `);
  return queryResult.results.bindings.map(parseSparqlResult);
}

export async function deleteCollaborationActivityFromGraph(uri, graph) {
  return await updateSudo(`
    ${PREFIXES}

    DELETE {
       GRAPH ${sparqlEscapeUri(graph)}{
            ${sparqlEscapeUri(uri)}    a                           ext:CollaborationActivity;
                                       ?p                          ?o.
        }
    }
    WHERE {
       GRAPH ${sparqlEscapeUri(graph)}{
            ${sparqlEscapeUri(uri)}    a                           ext:CollaborationActivity;
                                       ?p                          ?o.
        }
    }
    `);
}
