import { sparqlEscapeUri, query, sparqlEscapeString } from 'mu';
import { PREFIXES, RDF_TYPE } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';

export async function getPressReleaseAttachments(pressReleaseURI) {
    const attachments = (await query(`
    ${PREFIXES}

    SELECT ?attachmentURI ?p ?o
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease;
                                                nie:hasPart             ?attachmentURI.
    }
    `)).results.bindings.map(mapBindingValue);

    const attachmentQueries = [];
    for (let attachment of attachments) {
        const q = await getInsertAttachmentQuery({
            pressReleaseURI,
            attachmentURI: attachment.attachmentURI,
            properties: await getAttachmentProperties(attachment),
            download: await getAttachmentDownload(attachment),
        }, 'http://test.com');
        console.log('\nQ::::::\n', q);
        attachmentQueries.push(q);
    }
    return attachmentQueries;
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

export async function getInsertAttachmentQuery(attachment, graph) {

    let q = `
    ${PREFIXES}
    
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)} {
            ${sparqlEscapeUri(attachment.attachmentURI)}   a                       nfo:FileDataObject;
            ${attachment.properties.filter((property) => {
        return property.predicate !== RDF_TYPE;
    }).map((property) => {
        return sparqlEscapeUri(property.predicate) + ' ' + sparqlEscapeString(property.object);
    }).join(';\n')
    } ;
                                                           nie:dataSource ${sparqlEscapeUri(attachment.download.dataSourceURI)} .
             
             ${sparqlEscapeUri(attachment.download.dataSourceURI)} a                nfo:FileDataObject;
             ${attachment.download.properties.filter((property) => {
        return property.predicate !== RDF_TYPE;
    }).map((property) => {
        return sparqlEscapeUri(property.predicate) + ' ' + sparqlEscapeString(property.object);
    }).join(';\n')
    } ;
                nie:dataSource  ${sparqlEscapeUri(attachment.attachmentURI)}.
        }
    }
    `;

    console.log('QUERY::::::: ', q);
    return q;


}
