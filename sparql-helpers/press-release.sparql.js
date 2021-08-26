import { sparqlEscapeUri, query } from 'mu';
import { updateSudo as update } from '@lblod/mu-auth-sudo';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { getPressReleaseAttachmentsQueries } from './attachments.sparql';
import { getPressReleaseSourcesQueries } from './sources.sparql';

export async function getPressRelease(pressReleaseURI) {
    const queryResult = await query(`
    ${PREFIXES}

    SELECT ?creatorURI ?creatorId ?title ?htmlContent ?abstract ?keyword ?created ?modified
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?creatorURI.
        ?creatorURI                             mu:uuid             ?creatorId.
       
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} nie:title           ?title;
                                                nie:htmlContent     ?htmlContent; 
                                                dct:abstract        ?abstract; 
                                                nie:keyword         ?keyword; 
                                                dct:created         ?created; 
                                                dct:modified         ?modified.
        }
    }
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function copyPressReleaseRelations(pressReleaseURI, tempGraphURI) {
    const attachmentQueries = await getPressReleaseAttachmentsQueries(pressReleaseURI, tempGraphURI);
    const sourcesQueries = await getPressReleaseSourcesQueries(pressReleaseURI, tempGraphURI);

    for(let attachmentQuery of attachmentQueries){
        await update(attachmentQuery);
    }

    for (let sourcesQuery of sourcesQueries){
        await update(sourcesQuery);
    }
    // telefoon/mobile/email
    // TODO: Execute queries
}
