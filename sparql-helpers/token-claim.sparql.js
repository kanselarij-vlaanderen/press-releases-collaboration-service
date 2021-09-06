import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, query, uuid as generateUuid } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from '../constants';

export async function createTokenClaims(userURI, collaborationActivityURI) {
    // Generate new uri and created date for tokenClaim
    const id = generateUuid();
    const uri = 'http://themis.vlaanderen.be/id/tokenclaim/' + id;
    const createdDate = new Date();

    // Create ext:TokenClaim
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

export async function deleteTokenClaims(tokenClaimURI, collaborationActivityURI) {
    // Delete ext:TokenClaim
    return await updateSudo(`
    ${PREFIXES}
    DELETE {
      GRAPH ?graph {
          ${sparqlEscapeUri(tokenClaimURI)}               ?p                      ?o.
          ${sparqlEscapeUri(collaborationActivityURI)}    prov:generated          ${sparqlEscapeUri(tokenClaimURI)}.
      }
    } WHERE {
      GRAPH ?graph {
            ${sparqlEscapeUri(tokenClaimURI)}               ?p                      ?o.
            ${sparqlEscapeUri(collaborationActivityURI)}    prov:generated          ${sparqlEscapeUri(tokenClaimURI)}.
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
