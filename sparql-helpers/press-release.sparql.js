import { sparqlEscapeUri, query } from 'mu';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { getPressReleaseAttachments, getPressReleaseAttachmentsQueries } from './attachments.sparql';
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
    //  bronnen, telefoon/mobile/email

    console.log('ATTACHMENT QUERY:::::: ', attachmentQueries[0]);
    console.log('SOURCE QUERY:::::: ', sourcesQueries[0]);
    // TODO: Execute queries
}
