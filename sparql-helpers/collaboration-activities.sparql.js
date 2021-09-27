import { sparqlEscapeString, sparqlEscapeUri, query } from 'mu';
import { mapBindingValue } from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';

export async function getCollaborationActivityById(id) {
    const queryResult = await query(`
    ${PREFIXES}
    
    SELECT ?uri ?pressReleaseUri ?tokenClaimUri ?approvalActivityUri
    WHERE {
        ?uri                        a                   ext:CollaborationActivity;
                                    mu:uuid             ${sparqlEscapeString(id)};
                                    prov:used           ?pressReleaseUri.
        OPTIONAL { ?uri             prov:generated      ?tokenClaimUri }
        
        OPTIONAL { ?approvalActivityUri     prov:wasInformedBy      ?uri  }
    }
    LIMIT 1
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
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
    return queryResult.results.bindings.map(mapBindingValue);
}
