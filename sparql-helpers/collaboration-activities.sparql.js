import { sparqlEscapeString, sparqlEscapeUri, query } from 'mu';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { updateSudo } from '@lblod/mu-auth-sudo';

export async function getCollaborationActivityById(id) {
    const queryResult = await query(`
    ${PREFIXES}
    
    SELECT ?collaborationActivityURI ?pressReleaseURI ?startedAtTime ?editor
    WHERE {
        ?collaborationActivityURI   a                   ext:CollaborationActivity;
                                    mu:uuid             ${sparqlEscapeString(id)};
                                    prov:used           ?pressReleaseURI.
                                    
        OPTIONAL { ?collaborationActivityURI prov:startedAtTime ?startedAtTime }
        OPTIONAL { ?collaborationActivityURI ext:currentEditor  ?editor }
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

export async function copyCollaborationActivityToTemporaryGraph(collaborationActivity, collaborators, tempGraphURI) {

    const start = collaborationActivity.startedAtTime ? `prov:startedAtTime   ${sparqlEscapeDateTime(collaborationActivity.startedAtTime)};` : '';
    const currentEditor = collaborationActivity.editor ? `ext:currentEditor   ${sparqlEscapeUri(collaborationActivity.editor)};` : '';
    const collaboratorsQuery = collaborators.map((item) => {
        return `prov:wasAssociatedWith ${sparqlEscapeUri(item.collaboratorURI)}`;
    }).join('; ');

    return await updateSudo(`
     ${PREFIXES}
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(tempGraphURI)}{
           ${sparqlEscapeUri(collaborationActivity.collaborationActivityURI)}       a           ext:CollaborationActivity;
                                    prov:used   ${sparqlEscapeUri(collaborationActivity.pressReleaseURI)};
                                    ${start}
                                    ${currentEditor}
                                    ${collaboratorsQuery}.                      
        }
    }
    `);
}
