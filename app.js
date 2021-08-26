import { app, errorHandler, uuid as generateUuid } from 'mu';
import { getCollaborationActivityById, getCollaborators } from './sparql-helpers/collaboration-activities.sparql';
import {
    copyPressReleaseRelations,
    getPressRelease,
} from './sparql-helpers/press-release.sparql';
import { getOrganizationIdFromHeaders } from './helpers/generic-helpers';

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
        const requestedByOrganizationId = await getOrganizationIdFromHeaders(req.headers);
        if ((pressRelease.creatorId !== requestedByOrganizationId) || !requestedByOrganizationId) {
            return res.sendStatus(403);
        }

        // get all the collaborators related to the collaborationActivity
        const collaborators = await getCollaborators(collaborationActivity.collaborationActivityURI);

        // create temporary copy
        await copyPressReleaseRelations(collaborationActivity.pressReleaseURI, `http://mu.semte.ch/graphs/tmp-data-share/${generateUuid()}`);
        // await copyPressRelease();

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

