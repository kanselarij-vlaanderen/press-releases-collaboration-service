import { app, errorHandler, uuid as generateUuid } from 'mu';
import { cronJobHandler, handleGenericError } from './helpers/generic-helpers';
import { getOrganizationFromHeaders, getUserFromHeaders } from './sparql-helpers/session.sparql';
import { moveGraph, removeGraph } from './helpers/graph-helpers';
import { getPressReleaseCreator } from './sparql-helpers/press-release.sparql';
import {
  getCollaborationActivityById,
  getCollaborators,
  distributeData,
  updateDataDistribution,
  stopDataDistribution
} from './sparql-helpers/collaboration-activities.sparql';
import {
  createTokenClaims,
  deleteTokenClaims,
  isTokenClaimAssignedToUser,
} from './sparql-helpers/token-claim.sparql';
import {
  getApprovalActivity,
  createApprovalActivity,
  deleteApprovalActivity
} from './sparql-helpers/approval-activity.sparql';
import { COLLABORATOR_GRAPH_PREFIX, CRON_FREQUENCY_PATTERN } from './constants';
import { CronJob } from 'cron';

new CronJob(CRON_FREQUENCY_PATTERN, cronJobHandler, null, true);

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

app.post('/collaboration-activities/:id/claims', async (req, res, next) => {
  try {
    const collaborationActivityId = req.params.id;
    const collaborationActivity = await getCollaborationActivityById(collaborationActivityId);
    if (!collaborationActivity) {
      // 404 if collaboration-activity with provided id does not exist
      return res.sendStatus(404);
    }

    if (collaborationActivity.tokenClaimUri) {
      // 409 if collaboration-activity already has a token-claim linked to it.
      return res.sendStatus(409);
    }

    // check if request is made by a user that s part of an organization that participates in the collaboration-activity
    const requestedByOrganization = await getOrganizationFromHeaders(req.headers);
    const collaborators = await getCollaborators(collaborationActivity.uri);
    if (collaborators.find(collaborator => collaborator.uri === requestedByOrganization.uri) == null) {
      return res.sendStatus(403);
    }

    // Get user URI from headers to link to token-claim (prov:wasAttributedTo)
    const claimingUser = await getUserFromHeaders(req.headers);
    await createTokenClaims(claimingUser.uri, collaborationActivity.uri);

    res.sendStatus(201);

  } catch (err) {
    return handleGenericError(err, next);
  }
});

app.delete('/collaboration-activities/:id/claims', async (req, res, next) => {
  try {
    const collaborationActivityId = req.params.id;
    const collaborationActivity = await getCollaborationActivityById(collaborationActivityId);
    if (!collaborationActivity) {
      // 404 if collaboration-activity with provided id does not exist
      return res.sendStatus(404);
    }

    if (!collaborationActivity.tokenClaimUri) {
      // 409 if there is no token-claim linked to the collaboration-activity.
      return res.sendStatus(409);
    }

    const claimingUser = await getUserFromHeaders(req.headers);
    const canDelete = await isTokenClaimAssignedToUser(collaborationActivity.tokenClaimUri, claimingUser.uri);
    if (!canDelete) {
      // 403 if tbe token-claim it is not assigned to the user that made the request.
      // (use cases: claim has already been automatically released or assigned to another user)
      return res.sendStatus(403);
    }
    await deleteTokenClaims(collaborationActivity.tokenClaimUri, collaborationActivity.uri);
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

    await deleteApprovalActivity(collaboration.uri);
    return res.sendStatus(204);
  } catch (err) {
    return handleGenericError(err, next);
  }
});

app.use(errorHandler);
