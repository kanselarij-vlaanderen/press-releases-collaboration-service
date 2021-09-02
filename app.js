import { app, errorHandler, uuid as generateUuid } from 'mu';
import { getCollaborationActivityById, getCollaborators } from './sparql-helpers/collaboration-activities.sparql';
import { copyPressReleaseToTemporaryGraph, getPressReleaseCreator } from './sparql-helpers/press-release.sparql';
import { getOrganizationURIFromHeaders } from './helpers/generic-helpers';
import { moveGraph, removeGraph } from './helpers/graph-helpers';
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
        const pressReleaseCreator = await getPressReleaseCreator(collaborationActivity.pressReleaseURI);

        // Check if user has the right to share the press release,
        // by checking if the press-release creator URI is the same as the organization URI in the request headers.
        // if this is not the case, send a 403 (Forbidden) response
        const requestedByOrganizationURI = await getOrganizationURIFromHeaders(req.headers);
        if ((pressReleaseCreator.creatorURI !== requestedByOrganizationURI) || !requestedByOrganizationURI) {
            return res.sendStatus(403);
        }

        // get all the collaborators related to the collaborationActivity
        const collaborators = await getCollaborators(collaborationActivity.collaborationActivityURI);

        // create temporary copy of press-press release and all related resources defined in config.json
        const tempGraph = `http://mu.semte.ch/graphs/tmp-data-share/${generateUuid()}`;
        console.info(`Creating copy of press-release ${collaborationActivity.pressReleaseURI} to temporary graph ${tempGraph}`);
        await copyPressReleaseToTemporaryGraph(collaborationActivity.pressReleaseURI, tempGraph);

        for (const collaborator of collaborators) {
            // for every collaborator linked to the collaboration activity, the temporary graph is copied.
            const target = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.collaboratorId}`;
            console.info(`Moving data from temporary graph to collaborator graph ( ${target} )`);
            await moveGraph(tempGraph, target);
        }

        // remove temporary graph
        console.info(`Removing temporary graph ( ${tempGraph} )`)
        await removeGraph(tempGraph);

        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

// use mu errorHandler middleware.
app.use(errorHandler);
