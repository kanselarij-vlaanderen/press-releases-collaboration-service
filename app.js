import { app, errorHandler, uuid as generateUuid } from 'mu';
import { CronJob } from 'cron';
import { CRON_FREQUENCY_PATTERN } from './constants';
import { tokenClaimExpirationCronJob } from './cron-job';
import { handleGenericError } from './helpers/generic-helpers';
import { getOrganizationFromHeaders, getUserFromHeaders } from './sparql-helpers/session.sparql';
import { getPressReleaseCreator } from './sparql-helpers/press-release.sparql';
import {
  getCollaborationActivityById,
  getCollaborators,
  distributeData,
  updateDataDistribution,
  stopDataDistribution
} from './sparql-helpers/collaboration-activities.sparql';
import {
  createTokenClaim,
  deleteTokenClaim,
  isTokenClaimAssignedToUser,
} from './sparql-helpers/token-claim.sparql';
import {
  getApprovalActivity,
  createApprovalActivity,
  deleteApprovalActivities
} from './sparql-helpers/approval-activity.sparql';

new CronJob(CRON_FREQUENCY_PATTERN, tokenClaimExpirationCronJob, null, true);

/**
 * Endpoint to start sharing a press-release.
 * I.e. data gets inserted in the graphs of all collaborators.
*/
app.post('/collaboration-activities/:id/share', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to initialize data distribution for collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const creator = await getPressReleaseCreator(collaboration.pressReleaseUri);
    if (creator.uri !== organization.uri) {
      console.info(`Current logged in user does not belong to the organization that created the press-release. User does not have the permission to start the co-editing process.`);
      return res.sendStatus(403);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    await distributeData(collaboration, collaborators);

    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to update the shared press-release across all collaborators.
 * I.e. data gets distributed to the graphs of the collaborators
 * by first removing old and next inserting the updated data.
 *
 * Depending on the user that sends the request, the data in scope differs:
 * - if the user currently claims the edit token, all data gets distributed
 * - if the user doesn't hold the edit token atm only the approval-activities and
 *   historic press-release-activities get distributed. Use case: user is currently
 *   not editing the press-release, but might for example submit an approval that
 *   needs to be distributed to the other collaborators.
*/
app.put('/collaboration-activities/:id', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to update data distribution for collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    const isCollaborator = collaborators.find(collaborator => collaborator.uri === organization.uri);
    if (!isCollaborator) {
      console.info(`Current logged in user belongs to organization <${organization.uri}> which is not a collaborator of the shared press-release <${collaboration.pressReleaseUri}>`);
      return res.sendStatus(403);
    }

    const user = await getUserFromHeaders(req.headers);
    await updateDataDistribution(collaboration, collaborators, user);

    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to stop sharing a press-release.
 * I.e. data gets removed from the graphs of all collaborators,
 * except the master (creator) of the press-release.
*/
app.delete('/collaboration-activities/:id', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to stop collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const creator = await getPressReleaseCreator(collaboration.pressReleaseUri);
    if (creator.uri !== organization.uri) {
      console.info(`Current logged in user does not belong to the organization that created the press-release. User does not have the permission to stop the co-editing process.`);
      return res.sendStatus(403);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    await stopDataDistribution(collaboration, collaborators, creator);

    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to claim the edit token for a shared press-release on behalf of a user.
 * The token can only be claimed by one user at a time.
 * Note: the token claim is automatically inserted in the graphs of all collaborators.
*/
app.post('/collaboration-activities/:id/claims', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to claim token for collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    if (collaboration.tokenClaimUri) {
      console.info(`Token for collaboration <${collaboration.uri}> is already claimed by someone. Unable to claim.`);
      return res.sendStatus(409);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    const isCollaborator = collaborators.find(collaborator => collaborator.uri === organization.uri);
    if (!isCollaborator) {
      console.info(`Current logged in user belongs to organization <${organization.uri}> which is not a collaborator of the shared press-release <${collaboration.pressReleaseUri}>`);
      return res.sendStatus(403);
    }

    const user = await getUserFromHeaders(req.headers);
    await createTokenClaim(collaboration.uri, user.uri);

    return res.sendStatus(201);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to delete edit token claim for a shared press-release on behalf of a user.
 * Note: the token claim is automatically removed from the graphs of all collaborators.
*/
app.delete('/collaboration-activities/:id/claims', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to delete token-claim for collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    if (!collaboration.tokenClaimUri) {
      console.info(`There is currently no token claimed for collaboration-activity <${collaboration.uri}>. Unable to unclaim.`);
      return res.sendStatus(409);
    }

    const user = await getUserFromHeaders(req.headers);
    const isClaimer = await isTokenClaimAssignedToUser(collaboration.tokenClaimUri, user.uri);
    if (!isClaimer) {
      console.info(`Current logged in user is not the user claiming the edit token <${collaboration.tokenClaimUri}>. User does not have the permission to unclaim the token.`);
      return res.sendStatus(403);
    }

    await deleteTokenClaim(collaboration.tokenClaimUri);
    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to approve a shared press-release on behalf of an organization.
 * Note: the approval is automatically inserted in the graphs of all collaborators.
*/
app.post('/collaboration-activities/:id/approvals', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to approve collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    const isCollaborator = collaborators.find(collaborator => collaborator.uri === organization.uri);
    if (!isCollaborator) {
      console.info(`Current logged in user belongs to organization <${organization.uri}> which is not a collaborator of the shared press-release <${collaboration.pressReleaseUri}>`);
      return res.sendStatus(403);
    }

    const approval = await getApprovalActivity(collaboration.uri, organization.uri);
    if (approval) {
      console.info(`Organization of the current logged in user already approved the shared press-release <${collaboration.pressReleaseUri}>`);
      return res.sendStatus(409);
    }

    await createApprovalActivity(collaboration.uri, organization.uri);
    return res.sendStatus(201);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

/**
 * Endpoint to reset approvals of a shared press-release (e.g. after an update of the press-release)
 * Note: the approvals are automatically deleted from the graphs of all collaborators.
*/
app.delete('/collaboration-activities/:id/approvals', async (req, res, next) => {
  try {
    const collaborationId = req.params.id;
    console.info(`Received request to reset approvals for collaboration-activity ${collaborationId}`);
    const collaboration = await getCollaborationActivityById(collaborationId);

    if (!collaboration) {
      return res.sendStatus(404);
    }

    const organization = await getOrganizationFromHeaders(req.headers);
    if (!organization) {
      console.info(`Current logged in user does not belong to any organization. Unable to determine access to the shared press-release`);
      return res.sendStatus(401);
    }

    const collaborators = await getCollaborators(collaboration.uri);
    const isCollaborator = collaborators.find(collaborator => collaborator.uri === organization.uri);
    if (!isCollaborator) {
      console.info(`Current logged in user belongs to organization <${organization.uri}> which is not a collaborator of the shared press-release <${collaboration.pressReleaseUri}>`);
      return res.sendStatus(403);
    }

    await deleteApprovalActivities(collaboration.uri);
    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

app.use(errorHandler);
