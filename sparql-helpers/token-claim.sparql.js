import { sparqlEscapeUri, sparqlEscapeDateTime, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from '../constants';

export async function createTokenClaim(tokenClaimURI, createdDate, userURI, collaborationActivityURI, graph) {
  // Create ext:TokenClaim
  return await updateSudo(`
    ${PREFIXES}
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)} {
            ${sparqlEscapeUri(tokenClaimURI)}               a                       ext:TokenClaim;
                                                            dct:created             ${sparqlEscapeDateTime(createdDate)};
                                                            prov:wasAttributedTo    ${sparqlEscapeUri(userURI)}.
            ${sparqlEscapeUri(collaborationActivityURI)}    prov:generated          ${sparqlEscapeUri(tokenClaimURI)}.
        }
    }
    `);
}

export async function deleteTokenClaim(tokenClaimURI, collaborationActivityURI, graph) {
  // Delete ext:TokenClaim
  return await updateSudo(`
    ${PREFIXES}
    DELETE {
      GRAPH ${sparqlEscapeUri(graph)} {
          ${sparqlEscapeUri(tokenClaimURI)}               a                       ext:TokenClaim;
                                                          dct:created             ?createdDate;
                                                          prov:wasAttributedTo    ?userUri.
          ${sparqlEscapeUri(collaborationActivityURI)}    prov:generated          ${sparqlEscapeUri(tokenClaimURI)}.
      }
    } WHERE {
      GRAPH ${sparqlEscapeUri(graph)} {
            ${sparqlEscapeUri(tokenClaimURI)}               a                       ext:TokenClaim;
                                                            dct:created             ?createdDate;
                                                            prov:wasAttributedTo    ?userUri.
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
