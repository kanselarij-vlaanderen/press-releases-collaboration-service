import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid } from 'mu';
import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from '../constants';
import moment from 'moment';

export async function createTokenClaim(collaborationUri, userUri) {
  const id = uuid();
  const uri = `http://themis.vlaanderen.be/id/tokenclaim/${id}`;
  const now = new Date();

  await updateSudo(`
    ${PREFIXES}
    INSERT {
        GRAPH ?graph {
            ${sparqlEscapeUri(uri)} a ext:TokenClaim ;
                mu:uuid ${sparqlEscapeString(id)} ;
                dct:created ${sparqlEscapeDateTime(now)} ;
                prov:wasAttributedTo ${sparqlEscapeUri(userUri)} .
            ${sparqlEscapeUri(collaborationUri)} prov:generated ${sparqlEscapeUri(uri)} .
        }
    } WHERE {
        GRAPH ?graph {
            ${sparqlEscapeUri(collaborationUri)} a ext:CollaborationActivity .
        }
    }`);
}

export async function deleteTokenClaim(tokenClaimUri, collaborationActivityUri, graph) {
  graph = graph ? sparqlEscapeUri(graph) : '?graph';

  await updateSudo(`
    ${PREFIXES}
    DELETE {
      GRAPH ${graph} {
        ${sparqlEscapeUri(tokenClaimUri)} ?p ?o.
        ${sparqlEscapeUri(collaborationActivityUri)} prov:generated ${sparqlEscapeUri(tokenClaimUri)}.
      }
    } WHERE {
      GRAPH ${graph} {
        ${sparqlEscapeUri(tokenClaimUri)} ?p ?o.
        ${sparqlEscapeUri(collaborationActivityUri)} prov:generated ${sparqlEscapeUri(tokenClaimUri)}.
      }
    }
  `);
}

export async function isTokenClaimAssignedToUser(tokenClaimUri, userUri) {
  const q = await query(`
    ${PREFIXES}
    ASK {
      ${sparqlEscapeUri(tokenClaimUri)} a ext:TokenClaim ;
          prov:wasAttributedTo ${sparqlEscapeUri(userUri)} .
    }
  `);
  return q.boolean;
}

export async function getTokenClaimAges() {
	const q = await querySudo(`
  	${PREFIXES}
    SELECT ?uri ?created ?graph ?collaborationActivityUri
    WHERE {
      GRAPH ?graph {
        ?uri a ext:TokenClaim;
            dct:created ?created.
        ?collaborationActivityUri prov:generated ?uri.
      }
    }
  `);

  return q.results.bindings.map((tokenClaim) => {
    return {
      uri: tokenClaim.uri.value,
      created: moment(tokenClaim.created.value),
      graph: tokenClaim.graph.value,
      collaborationActivityUri: tokenClaim.collaborationActivityUri.value
    };
  });
}
