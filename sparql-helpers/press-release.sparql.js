import { sparqlEscapeUri, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import {
    mapBindingValue,
    toInsertQuery,
    toStatements,
    isInverse,
    normalizePredicate,
} from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import RESOURCE_CONFIG from '../config.json';

export async function getPressReleaseCreator(pressReleaseURI) {
    const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?uri.
        ?uri                                    mu:uuid             ?id.
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
    let properties = [];

    // Direct properties
    const directProperties = resourceConfig.properties.filter(p => !isInverse(p));
    if (directProperties.length) {
        let pathToPressRelease;
        if (resourceConfig.path) {
            pathToPressRelease = `${sparqlEscapeUri(pressReleaseURI)} ${resourceConfig.path}   ?subject .`;
        } else {
            pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseURI)} as ?subject)`;
        }
        const values = directProperties.map((i) => sparqlEscapeUri(i)).join('\n');

        const result = await query(`
            ${PREFIXES}
            SELECT ?subject ?predicate ?object
            WHERE {
                ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease.
                ${pathToPressRelease}
                ?subject ?predicate ?object .
                VALUES ?predicate {
                   ${values}
                }
           }`);
        properties = properties.concat(result.results.bindings);
    }

    // Inverse properties
    const inverseProperties = resourceConfig.properties.filter(p => isInverse(p));
    if (inverseProperties.length) {
        let pathToPressRelease;
        if (resourceConfig.path) {
            pathToPressRelease = `${sparqlEscapeUri(pressReleaseURI)} ${resourceConfig.path}   ?object .`;
        } else {
            pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseURI)} as ?object)`;
        }
        const values = inverseProperties.map((i) => {
            const predicate = normalizePredicate(i);
            return sparqlEscapeUri(predicate);
        }).join('\n');

        const result = await query(`
            ${PREFIXES}
            SELECT ?subject ?predicate ?object
            WHERE {
                ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease.
                ${pathToPressRelease}
                ?subject ?predicate ?object .
                VALUES ?predicate {
                   ${values}
                }
           }`);
        properties = properties.concat(result.results.bindings);
    }

    return properties;
}
