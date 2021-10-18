import { EDIT_TOKEN_MAX_AGE_MILLIS } from './constants';
import { getAllTokenClaims, deleteTokenClaim } from './sparql-helpers/token-claim.sparql';

export async function tokenClaimExpirationCronJob() {
  console.info('Checking token-claims for expiration...');

  const tokenClaims = await getAllTokenClaims();
  const expiredTokenClaims = tokenClaims.filter((tokenClaim) => {
    const lastActionMillis = Date.parse(tokenClaim.lastActionDateTime);
    const expirationDate = new Date(lastActionMillis + EDIT_TOKEN_MAX_AGE_MILLIS);
    tokenClaim.expirationDate = expirationDate; // only needed for logging
    return new Date() > expirationDate;
  });

  if (expiredTokenClaims.length) {
    console.info(`Found ${expiredTokenClaims.length} expired token-claims that will be deleted.`);
    for (const tokenClaim of expiredTokenClaims) {
      console.info(`Deleting token-claim <${tokenClaim.uri}> that expired on ${tokenClaim.expirationDate.toISOString()}.`);
      await deleteTokenClaim(tokenClaim.uri);
    }
  } else {
    console.info('No expired token-claims found.');
  }
}
