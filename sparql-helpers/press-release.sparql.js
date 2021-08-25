import { sparqlEscapeUri, query } from 'mu';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { getPressReleaseAttachments } from './attachments.sparql';

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

export async function getPressReleaseRelations(pressReleaseURI) {
    const attachments = await getPressReleaseAttachments(pressReleaseURI);
    console.log('ATTACHMENTS::::: ', JSON.stringify(attachments, null, 4));

    return {
        attachments,
    };
}



//  bronnen, telefoon/mobile/email


