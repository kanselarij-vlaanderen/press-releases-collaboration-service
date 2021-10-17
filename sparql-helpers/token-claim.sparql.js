import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid as generateUuid } from 'mu';
import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from '../constants';
import moment from 'moment';

export async function createTokenClaims(userURI, collaborationActivityURI) {
  const id = generateUuid();
  const uri = 'http://themis.vlaanderen.be/id/tokenclaim/' + id;
  const createdDate = new Date();

  return await updateSudo(`
    ${PREFIXES}
    INSERT {
        GRAPH ?graph {
            ${sparqlEscapeUri(uri)}                         a                       ext:TokenClaim;
                                                            mu:uuid                 ${sparqlEscapeString(id)};
                                                            dct:created             ${sparqlEscapeDateTime(createdDate)};
                                                            prov:wasAttributedTo    ${sparqlEscapeUri(userURI)}.
            ${sparqlEscapeUri(collaborationActivityURI)}    prov:generated          ${sparqlEscapeUri(uri)}.
        }
    } WHERE {
        GRAPH ?graph {
            ${sparqlEscapeUri(collaborationActivityURI)}    a                       ext:CollaborationActivity.

        }
    }
    `);
}

export async function deleteTokenClaims(tokenClaimURI, collaborationActivityURI, graph) {
  graph = graph ? sparqlEscapeUri(graph) : '?graph';

  return await updateSudo(`
    ${PREFIXES}
    DELETE {
      GRAPH ${graph} {
        ${sparqlEscapeUri(tokenClaimURI)} ?p ?o.
        ${sparqlEscapeUri(collaborationActivityURI)} prov:generated ${sparqlEscapeUri(tokenClaimURI)}.
      }
    } WHERE {
      GRAPH ${graph} {
        ${sparqlEscapeUri(tokenClaimURI)} ?p ?o.
        ${sparqlEscapeUri(collaborationActivityURI)} prov:generated ${sparqlEscapeUri(tokenClaimURI)}.
      }
    }
  `);
}

export async function isTokenClaimAssignedToUser(tokenClaimUri, userUri) {
  const q = (await query(`
  ${PREFIXES}
  ASK {
    ${sparqlEscapeUri(tokenClaimUri)}       a                       ext:TokenClaim;
                                            prov:wasAttributedTo    ${sparqlEscapeUri(userUri)}.
  }
  `));
  return q.boolean;
}

export async function getTokenClaimAges() {
	const q = (await querySudo(`
  	${PREFIXES}
    SELECT ?uri ?created ?graph ?collaborationActivityUri
    WHERE {
      GRAPH ?graph {
        ?uri a ext:TokenClaim;
          dct:created ?created.
        ?collaborationActivityUri prov:generated ?uri.
      }
    }
  `));

  return q.results.bindings.map((tokenClaim) => {
    return  {
      uri: tokenClaim.uri.value,
      created: moment(tokenClaim.created.value),
      graph: tokenClaim.graph.value,
      collaborationActivityUri: tokenClaim.collaborationActivityUri.value
    };
  });
}
