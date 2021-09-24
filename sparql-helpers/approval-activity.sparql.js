import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid as generateUuid } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { COLLABORATOR_GRAPH_PREFIX, PREFIXES } from '../constants';

export async function approvalActivityByCollaboratorExists(collaboratorUri, collaborationActivityId) {
    return(await query(`
    ${PREFIXES}
    ASK WHERE { 
        ?x      a                           ext:ApprovalActivity;
                prov:wasInformedBy          ${sparqlEscapeUri(collaborationActivityId)};
                prov:wasAssociatedWith      ${sparqlEscapeUri(collaboratorUri)}.
    }
    `)).boolean;
}

export async function createApprovalActivity(collaborationActivityUri, collaboratorUri, collaborators) {
    const now = sparqlEscapeDateTime(new Date());
    const id = generateUuid();
    const subject = sparqlEscapeUri(`http://themis.vlaanderen.be/id/goedkeuringsactiviteit/${id}`);

    for (const collaborator of collaborators) {
        const graph = sparqlEscapeUri(`${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`);

        console.info(`Creating ${subject} in ${graph}`);

        await updateSudo(`
            ${PREFIXES}
            INSERT DATA {
               GRAPH ${graph}{
                  ${subject}        a                           ext:ApprovalActivity;
                                    mu:uuid                     ${sparqlEscapeString(id)};
                                    prov:wasAssociatedWith      ${sparqlEscapeUri(collaboratorUri)};
                                    prov:startedAtTime          ${now}.
                                    
                ${sparqlEscapeUri(collaborationActivityUri)} prov:wasInformedBy ${subject}.
               }
            }
        `);
    }

}
