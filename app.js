import { app, errorHandler, uuid as generateUuid } from 'mu';
import { getCollaborationActivityById, getCollaborators } from './sparql-helpers/collaboration-activities.sparql';
import {
    copyPressReleaseRelationsToTemporaryGraph, getPressRelease,
} from './sparql-helpers/press-release.sparql';
import { getOrganizationURIFromHeaders } from './helpers/generic-helpers';

const TEMP_GRAPH = `http://mu.semte.ch/graphs/tmp-data-share/8a354196-97ef-46bf-be96-5884c7e974b3`;

app.post('/collaboration-activities/:id/share', async (req, res, next) => {
    try {
        // get the collaboration activity by the requested id, if it is not found, return status 404 (Not found)
        const collaborationActivityId = req.params.id;
        const collaborationActivity = await getCollaborationActivityById(collaborationActivityId);
        if (!collaborationActivity) {
            return res.sendStatus(404);
        }
        // retrieve the press-release related to the collaborationActivity
        const pressRelease = await getPressRelease(collaborationActivity.pressReleaseURI);

        // Check if user has the right to share the press release,
        // by checking if the press-release creator.id is the same as the organizationId in the request headers.
        // if this is not the case, send a 403 (Forbidden) response
        const requestedByOrganizationURI = await getOrganizationURIFromHeaders(req.headers);
        if ((pressRelease.creatorURI !== requestedByOrganizationURI) || !requestedByOrganizationURI) {
            return res.sendStatus(403);
        }

        // create temporary copy
        await copyPressReleaseRelationsToTemporaryGraph(collaborationActivity.pressReleaseURI, TEMP_GRAPH);
        // await copyPressRelease();

        // get all the collaborators related to the collaborationActivity
        const collaborators = await getCollaborators(collaborationActivity.collaborationActivityURI);

        for (let collaborator of collaborators) {
            // TODO: copy temporary to collaborator graph
        }

        res.sendStatus(202);
    } catch (err) {
        console.error(err);
        next(err);
    }
});


// use mu errorHandler middleware.
app.use(errorHandler);


