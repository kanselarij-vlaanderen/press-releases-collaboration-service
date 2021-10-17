import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid as generateUuid } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { COLLABORATOR_GRAPH_PREFIX, PREFIXES } from '../constants';
import { parseSparqlResult } from '../helpers/generic-helpers';

export async function getApprovalActivity(collaborationUri, collaboratorUri) {
  const queryResult = await query(`
    ${PREFIXES}
    SELECT ?uri ?id
    WHERE {
        ?uri a ext:ApprovalActivity ;
            prov:wasInformedBy ${sparqlEscapeUri(collaborationUri)} ;
            prov:wasAssociatedWith ${sparqlEscapeUri(collaboratorUri)} .
    } LIMIT 1
  `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}

// TODO: it might be better to insert in all graphs where the collaboration-activity is stored?
export async function createApprovalActivity(collaborationUri, collaboratorUri, collaborators) {
  const now = new Date();
  const id = generateUuid();
  const approvalActivity = `http://themis.vlaanderen.be/id/goedkeuringsactiviteit/${id}`;
  const graphs = collaborators.map(collaborator => `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`);

  await updateSudo(`
    ${PREFIXES}
    INSERT {
        GRAPH ?graph {
            ${sparqlEscapeUri(approvalActivity)} a ext:ApprovalActivity ;
                mu:uuid ${sparqlEscapeString(id)} ;
                prov:wasAssociatedWith ${sparqlEscapeUri(collaboratorUri)};
                prov:wasInformedBy ${sparqlEscapeUri(collaborationUri)};
                prov:startedAtTime ${sparqlEscapeDateTime(now)}.
        }
    } WHERE {
        VALUES ?graph {
            ${graphs.map(g => sparqlEscapeUri(g)).join('\n')}
        }
    }`);
}

// TODO: it might be better to make use of the resource config to construct the delete query?
export async function deleteApprovalActivity(collaborationUri) {
  await updateSudo(`
      ${PREFIXES}
      DELETE WHERE {
          GRAPH ?graph {
              ?s a ext:ApprovalActivity ;
                  prov:wasInformedBy ${sparqlEscapeUri(collaborationUri)} ;
                  ?p ?o.
           }
      }`);
}
