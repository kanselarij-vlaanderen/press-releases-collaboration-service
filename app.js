import { app, errorHandler, uuid as generateUuid } from 'mu';
import {
    copyCollaborationActivityToTemporaryGraph,
    getCollaborationActivityById,
    getCollaborators,
} from './sparql-helpers/collaboration-activities.sparql';
import {
    copyPressReleaseProperties,
    copyPressReleaseRelationsToTemporaryGraph, getPressReleaseCreator,
} from './sparql-helpers/press-release.sparql';
import { getOrganizationURIFromHeaders } from './helpers/generic-helpers';
import { COLLABORATOR_GRAPH_PREFIX } from './config.js';
import { moveGraph, removeGraph } from './helpers/graph-helpers';


app.post('/collaboration-activities/:id/share', async (req, res, next) => {
    try {
        // get the collaboration activity by the requested id, if it is not found, return status 404 (Not found)
        const collaborationActivityId = req.params.id;
        const collaborationActivity = await getCollaborationActivityById(collaborationActivityId);
        if (!collaborationActivity) {
            return res.sendStatus(404);
        }
        // retrieve the press-release related to the collaborationActivity
        const pressReleaseCreator = await getPressReleaseCreator(collaborationActivity.pressReleaseURI);

        // Check if user has the right to share the press release,
        // by checking if the press-release creator.id is the same as the organizationId in the request headers.
        // if this is not the case, send a 403 (Forbidden) response
        const requestedByOrganizationURI = await getOrganizationURIFromHeaders(req.headers);
        if ((pressReleaseCreator.creatorURI !== requestedByOrganizationURI) || !requestedByOrganizationURI) {
            return res.sendStatus(403);
        }

        // get all the collaborators related to the collaborationActivity
        const collaborators = await getCollaborators(collaborationActivity.collaborationActivityURI);

        // create temporary copy
        const tempGraph = `http://mu.semte.ch/graphs/tmp-data-share/${generateUuid()}`;
        await copyCollaborationActivityToTemporaryGraph(collaborationActivity, collaborators, tempGraph);
        await copyPressReleaseRelationsToTemporaryGraph(collaborationActivity.pressReleaseURI, tempGraph);
        await copyPressReleaseProperties(collaborationActivity.pressReleaseURI, tempGraph);

        for (const collaborator of collaborators) {
            // for every collaborator linked to the collaboration activity, the temporary graph is copied.
            await moveGraph(tempGraph, `${COLLABORATOR_GRAPH_PREFIX}${collaborator.collaboratorId}`);
        }

        // remove temporary graph
        await removeGraph(tempGraph);

        res.sendStatus(202);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// use mu errorHandler middleware.
app.use(errorHandler);
