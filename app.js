import { app, errorHandler, uuid as generateUuid } from 'mu';
import { getCollaborationActivityById, getCollaborators } from './sparql-helpers/collaboration-activities.sparql';
import { copyPressReleaseToTemporaryGraph, getPressReleaseCreator } from './sparql-helpers/press-release.sparql';
import { handleGenericError } from './helpers/generic-helpers';
import { getOrganizationFromHeaders, getUserFromHeaders } from './sparql-helpers/session.sparql';
import { moveGraph, removeGraph } from './helpers/graph-helpers';
import {
    createTokenClaims,
    deleteTokenClaims,
    isTokenClaimAssignedToUser,
} from './sparql-helpers/token-claim.sparql';
import { COLLABORATOR_GRAPH_PREFIX } from './constants';

app.post('/collaboration-activities/:id/share', async (req, res, next) => {
    try {
        // get the collaboration activity by the requested id, if it is not found, return status 404 (Not found)
        const collaborationActivityId = req.params.id;
        const collaborationActivity = await getCollaborationActivityById(collaborationActivityId);
        if (!collaborationActivity) {
            return res.sendStatus(404);
        }

        // retrieve the press-release creator
        const pressReleaseCreator = await getPressReleaseCreator(collaborationActivity.pressReleaseUri);

        // Check if user has the right to share the press release,
        // by checking if the press-release creator URI is the same as the organization URI in the request headers.
        // if this is not the case, send a 403 (Forbidden) response
        const requestedByOrganization = await getOrganizationFromHeaders(req.headers);
        if (!requestedByOrganization?.uri || (pressReleaseCreator.uri !== requestedByOrganization.uri)) {
            return res.sendStatus(403);
        }

        const tempGraph = `http://mu.semte.ch/graphs/tmp-data-share/${generateUuid()}`;
        console.info(`Creating copy of press-release ${collaborationActivity.pressReleaseUri} to temporary graph ${tempGraph}`);
        await copyPressReleaseToTemporaryGraph(collaborationActivity.pressReleaseUri, tempGraph);

        const collaborators = await getCollaborators(collaborationActivity.uri);
        for (const collaborator of collaborators) {
            const target = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`;
            console.info(`Copying data from temporary graph to collaborator graph ( ${target} )`);
            await moveGraph(tempGraph, target);
        }

        console.info(`Removing temporary graph ( ${tempGraph} )`);
        await removeGraph(tempGraph);

        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        next(err);
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
        if (collaborators.find(collaborator => collaborator.uri === requestedByOrganization.uri) != null) {
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

app.use(errorHandler);
