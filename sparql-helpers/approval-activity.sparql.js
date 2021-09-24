import { sparqlEscapeUri, sparqlEscapeDateTime, query, uuid as generateUuid } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { COLLABORATOR_GRAPH_PREFIX, PREFIXES } from '../constants';

export async function approvalActivityByCollaboratorExists(collaboratorUri) {
    return (await query(`
    ${PREFIXES}
    ASK WHERE { 
        ?x      a                           ext:ApprovalActivity;
                prov:wasAssociatedWith      ${sparqlEscapeUri(collaboratorUri)}.
    }
    `)).boolean;
}

export async function createApprovalActivity(collaborationActivityUri, collaboratorUri, collaborators) {
    const now = sparqlEscapeDateTime(new Date());
    const subject = sparqlEscapeUri(`http://themis.vlaanderen.be/id/goedkeuringsactiviteit/${generateUuid()}`);

    for (const collaborator of collaborators) {
        const graph = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`;
        console.info(`Creating ${subject} in ${graph}`);

        await updateSudo(`
            ${PREFIXES}
            INSERT DATA {
               GRAPH ${graph}{
                  ${subject}        a                           ext:ApprovalActivity;
                                    prov:wasAssociatedWith      ${sparqlEscapeUri(collaboratorUri)};
                                    prov:wasInformedBy          ${sparqlEscapeUri(collaborationActivityUri)};
                                    prov:startedAtTime          ${now}.
               }
            }
        `);
    }

}
