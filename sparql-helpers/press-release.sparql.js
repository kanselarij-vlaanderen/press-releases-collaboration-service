import { sparqlEscapeUri, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { mapBindingValue, toInsertQuery, toStatements } from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import RESOURCE_CONFIG from '../config.json';

export async function getPressReleaseCreator(pressReleaseURI) {
    const queryResult = await query(`
    ${PREFIXES}

    SELECT ?creatorURI
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?creatorURI.
    }
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function copyPressReleaseToTemporaryGraph(pressReleaseURI, tempGraphURI) {
    for (const resourceConfig of RESOURCE_CONFIG.resources) {
        const properties = await getProperties(pressReleaseURI, resourceConfig);
        if (properties.length) {
            const statements = toStatements(properties);
            const insertQuery = toInsertQuery(statements, tempGraphURI);
            await updateSudo(insertQuery);
        }
    }
}

async function getProperties(pressReleaseURI, resourceConfig) {
    let pathToPressRelease;
    if (resourceConfig.path) {
        pathToPressRelease = `${sparqlEscapeUri(pressReleaseURI)} ${resourceConfig.path}   ?subject .`;
    } else {
        pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseURI)} as ?subject)`;
    }

    const result = await query(`
        ${PREFIXES}
        SELECT ?subject ?predicate ?object
        WHERE {
            ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease.
            ${pathToPressRelease}
            ?subject ?predicate ?object .
            VALUES ?predicate {
                   ${resourceConfig.properties.map((i) => sparqlEscapeUri(i)).join('\n')}
            }
    }`);
    return result.results.bindings;
}
