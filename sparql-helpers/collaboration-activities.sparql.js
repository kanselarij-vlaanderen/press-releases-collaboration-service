import { sparqlEscapeString, sparqlEscapeUri, query } from 'mu';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';

export async function getCollaborationActivityById(id) {
    const queryResult = await query(`
    ${PREFIXES}
    
    SELECT ?collaborationActivityURI ?pressReleaseURI
    WHERE {
        ?collaborationActivityURI   a           ext:CollaborationActivity;
                                    mu:uuid     ${sparqlEscapeString(id)};
                                    prov:used   ?pressReleaseURI.
    }
    LIMIT 1
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function getCollaborators(collaborationActivityURI) {
    const queryResult = await query(`
    ${PREFIXES}
    
    SELECT ?collaboratorURI ?collaboratorId
    WHERE {
        ${sparqlEscapeUri(collaborationActivityURI)}    a                           ext:CollaborationActivity;
                                                        prov:wasAssociatedWith      ?collaboratorURI.
        ?collaboratorURI                                mu:uuid                     ?collaboratorId.
    }
    `);
    return queryResult.results.bindings.map(mapBindingValue);
}
