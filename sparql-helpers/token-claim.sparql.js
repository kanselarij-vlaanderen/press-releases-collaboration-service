import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid } from 'mu';
import { querySudo, updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from '../constants';
import { parseSparqlResult } from '../helpers/generic-helpers';

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

export async function getAllTokenClaims() {
	const queryResult = await querySudo(`
  	${PREFIXES}
    SELECT DISTINCT ?uri ?lastActionDateTime
    WHERE {
      GRAPH ?graph {
        ?uri a ext:TokenClaim ;
            dct:created ?created .
        ?collaboration prov:generated ?uri ;
            prov:used ?pressRelease .
        ?pressRelease dct:modified ?modified .
        BIND(IF(?created > ?modified, ?created, ?modified) as ?lastActionDateTime)
      }
    }
  `);

  return queryResult.results.bindings.map(parseSparqlResult);
}

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

export async function deleteTokenClaim(tokenClaimUri) {
  await updateSudo(`
    ${PREFIXES}
    DELETE WHERE {
      GRAPH ?graph {
        ${sparqlEscapeUri(tokenClaimUri)} ?p ?o.
        ?collaborationActivity prov:generated ${sparqlEscapeUri(tokenClaimUri)}.
      }
    }
  `);
}
