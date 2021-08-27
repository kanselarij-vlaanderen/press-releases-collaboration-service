import { sparqlEscapeUri, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { getPressReleaseRelationsInsertQuery } from './press-release-relations.sparql';

export async function getPressRelease(pressReleaseURI) {

    // TODO: Refactor OPTIONALS

    const queryResult = await query(`
    ${PREFIXES}

    SELECT ?creatorURI ?creatorId ?title ?htmlContent ?abstract ?keyword ?created ?modified
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?creatorURI.
        ?creatorURI                             mu:uuid             ?creatorId.
       
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} nie:title           ?title.
        } 
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} nie:htmlContent     ?htmlContent.
        } 
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} dct:abstract        ?abstract.
        }
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} nie:keyword         ?keyword.
        }
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} dct:created         ?created.
        }
        OPTIONAL {
            ${sparqlEscapeUri(pressReleaseURI)} dct:modified         ?modified.
        }
        
    }
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function copyPressReleaseRelationsToTemporaryGraph(pressReleaseURI, tempGraphURI) {
    const relationsInsertQuery = await getPressReleaseRelationsInsertQuery(pressReleaseURI, tempGraphURI);
    console.log(relationsInsertQuery);

    // for (let attachmentInsertQuery of attachmentInsertQueries) {
    //     await updateSudo(attachmentInsertQuery);
    // }
    // for (let sourcesInsertQuery of sourcesInsertQueries) {
    //     await updateSudo(sourcesInsertQuery);
    // }

    // telefoon/mobile/email
}


