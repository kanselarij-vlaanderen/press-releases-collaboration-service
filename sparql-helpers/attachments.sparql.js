import { sparqlEscapeUri, query } from 'mu';
import { ATTACHMENT_PREDICATES, DOWNLOAD_PREDICATES, PREFIXES } from './constants.sparql';
import { mapBindingValue, toStatements } from '../helpers/generic-helpers';

export async function getPressReleaseAttachmentInsertQueries(pressReleaseURI, tempGraphURI) {

    // get the attachments linked to the press release
    const attachments = await getPressReleaseAttachments(pressReleaseURI);

    const attachmentInsertQueries = [];

    for (let attachment of attachments) {
        ////////////////
        // Attachment //
        ////////////////
        // For every attachment, we get all the available triplets that can be found and have a predicate
        // that is listed in ATTACHMENT_PREDICATES.
        const attachmentTriplets = await getAttachmentTriplets(attachment);
        const attachmentStatements = toStatements(attachmentTriplets);

        ///////////////////////////
        // Attachment relations: //
        ///////////////////////////
        // The same for every attachment relation where predicates are defined in the <RELATION>_PREDICATES

        // Download
        const downloadTriplets = await getDataSourceTriplets(attachment);
        let downloadStatements = toStatements(downloadTriplets);
        // add link between download and attachment
        downloadStatements += `${sparqlEscapeUri(attachment.attachmentURI)} nie:dataSource ${sparqlEscapeUri(downloadTriplets[0].subject.value)}.`;

        // Press-release
        // for the press-release we only need to link it, since the press-release itself is already copied.
        const pressReleaseStatement = `${sparqlEscapeUri(pressReleaseURI)} nie:hasPart ${sparqlEscapeUri(attachment.attachmentURI)}.`;


        // Finally the insertQuery that combines the attachment's statements and its relations statements is added to the attachmentInsertQueries array
        attachmentInsertQueries.push(`
        PREFIX nie: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/01/19/nie#')}
        
        INSERT DATA {
            GRAPH ${sparqlEscapeUri(tempGraphURI)}{
            ${attachmentStatements}
            ${downloadStatements}
            ${pressReleaseStatement}
            }
        }
        `);
    }
    return attachmentInsertQueries;
}

async function getPressReleaseAttachments(pressReleaseURI) {
    return (await query(`
    ${PREFIXES}

    SELECT ?attachmentURI ?p ?o
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease;
                                                nie:hasPart             ?attachmentURI.
    }
    `)).results.bindings.map(mapBindingValue);
}

async function getAttachmentTriplets(attachment) {
    const q = (await query(`
        ${PREFIXES}
        
        SELECT ?predicate ?object
        WHERE {
                ${sparqlEscapeUri(attachment.attachmentURI)}    a               nfo:FileDataObject;
                                                                ?predicate      ?object.
            VALUES ?predicate  {
                ${ATTACHMENT_PREDICATES.map((i) => sparqlEscapeUri(i)).join(' ')}
            }
        }
        `));
    return q.results.bindings.map((i) => {
        // add the attachmentURI manually since we already have it (needed for generating statements).
        i.subject = {type: 'uri', value: attachment.attachmentURI};
        return i;
    });
}

async function getDataSourceTriplets(attachment) {
    const q = (await query(`
        ${PREFIXES}
        
        SELECT ?subject ?predicate ?object
        WHERE {
                ${sparqlEscapeUri(attachment.attachmentURI)}    a               nfo:FileDataObject;
                                                                ^nie:dataSource ?subject.
                ?subject                                        ?predicate      ?object.
            VALUES ?predicate  {
                ${DOWNLOAD_PREDICATES.map((i) => sparqlEscapeUri(i)).join(' ')}
            }
        }
        `));
    return q.results.bindings;
}
