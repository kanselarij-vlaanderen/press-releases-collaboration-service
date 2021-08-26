import { sparqlEscapeUri, query } from 'mu';
import { ATTACHMENT_PREDICATES, PREFIXES } from './constants.sparql';
import { mapBindingValue, mapProperty } from '../helpers/generic-helpers';

export async function getPressReleaseAttachmentsQueries(pressReleaseURI, tempGraphURI) {
    const attachments = (await query(`
    ${PREFIXES}

    SELECT ?attachmentURI ?p ?o
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease;
                                                nie:hasPart             ?attachmentURI.
    }
    `)).results.bindings.map(mapBindingValue);

    let insertQueries = [];
    for (let attachment of attachments) {
        const result = await getAttachmentInsertQuery({
            pressReleaseURI,
            attachmentURI: attachment.attachmentURI,
            properties: await getAttachmentProperties(attachment),
            download: await getAttachmentDownload(attachment),
        }, tempGraphURI);

        insertQueries.push(result);
    }
    return insertQueries;
}

async function getAttachmentProperties(attachment) {
    return (await query(`
        ${PREFIXES}
        
        SELECT ?predicate ?object
        WHERE {
                ${sparqlEscapeUri(attachment.attachmentURI)}    a               nfo:FileDataObject;
                                                                ?predicate      ?object.
        }
        `)).results.bindings.map(mapBindingValue);
}

async function getAttachmentDownload(attachment) {
    const dataSourceURI = (await query(`
        ${PREFIXES}
        
        SELECT ?dataSourceURI
        WHERE {
                ${sparqlEscapeUri(attachment.attachmentURI)}    a                       nfo:FileDataObject;
                                                                ^nie:dataSource         ?dataSourceURI.
        }
        `)).results.bindings.map(mapBindingValue)[0].dataSourceURI;

    const properties = (await query(`
        ${PREFIXES}
        
        SELECT ?predicate ?object
        WHERE {
                ${sparqlEscapeUri(dataSourceURI)}               a                       nfo:FileDataObject;
                                                                ?predicate              ?object.
        }
        `)).results.bindings.map(mapBindingValue);

    return {
        dataSourceURI,
        properties,
    };
}

export async function getAttachmentInsertQuery(attachment, graph) {
    const attachmentProperties = attachment.properties
    .map((item)=> mapProperty(item, ATTACHMENT_PREDICATES))
    .filter(item => item.length )
    .join(';\n');
    const downloadProperties = attachment.download.properties
    .map((item)=> mapProperty(item, DOWNLOAD_PREDICATES))
    .filter(item => item.length )
    .join(';\n')
    return `
    ${PREFIXES}
    
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)} {
            ${sparqlEscapeUri(attachment.attachmentURI)}            ${attachmentProperties} ;
                                                                    nie:dataSource ${sparqlEscapeUri(attachment.download.dataSourceURI)} .
             
             ${sparqlEscapeUri(attachment.download.dataSourceURI)}  ${downloadProperties} ;
                                                                    nie:dataSource  ${sparqlEscapeUri(attachment.attachmentURI)}.
        }
    }
    `;

}
