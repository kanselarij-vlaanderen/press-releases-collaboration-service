import { PREFIXES } from './constants.sparql';
import { mapBindingValue } from '../helpers/generic-helpers';
import { sparqlEscapeUri, query, sparqlEscapeString } from 'mu';

export async function getPressReleaseSourcesQueries(pressReleaseURI, tempGraphURI) {
    const sources = (await query(`
    ${PREFIXES}

    SELECT ?sourceURI ?p ?o
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease;
                                                dct:source              ?sourceURI.
    }
    `)).results.bindings.map(mapBindingValue);

    let insertQueries = [];
    for (let source of sources) {
        const result = await getInsertSourceQuery({
            pressReleaseURI,
            sourceURI: source.sourceURI,
            properties: await getSourceProperties(source),
        }, tempGraphURI);

        insertQueries.push(result);
    }
    return insertQueries;
}

async function getSourceProperties(source) {
    return (await query(`
        ${PREFIXES}
        
        SELECT ?predicate ?object
        WHERE {
                ${sparqlEscapeUri(source.sourceURI)}    a               ebucore:Contact;
                                                                ?predicate      ?object.
        }
        `)).results.bindings.map(mapBindingValue);
}

export async function getInsertSourceQuery(source, graph) {

    const sourceProperties = source.properties
    .map((property) => {
        return sparqlEscapeUri(property.predicate)
            + ' ' +
            sparqlEscapeString(property.object);
    }).join(';\n');

    // TODO: mobile, telephone, mail
    return `
    ${PREFIXES}
    
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)} {
            ${sparqlEscapeUri(source.sourceURI)} ${sourceProperties}.                       
        }
    }
    `;

}
