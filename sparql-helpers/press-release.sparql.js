import { sparqlEscapeUri, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { mapBindingValue, toInsertQuery, toStatements } from '../helpers/generic-helpers';
import { PREFIXES } from '../constants';
import RESOURCE_CONFIG from '../config.json';

export async function getPressReleaseCreator(pressReleaseURI) {
    const queryResult = await query(`
    ${PREFIXES}

    SELECT ?creatorURI ?creatorId 
    WHERE {
        ${sparqlEscapeUri(pressReleaseURI)}     a                   fabio:PressRelease;
                                                dct:creator         ?creatorURI.
        ?creatorURI                             mu:uuid             ?creatorId. 
    }
    `);
    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0] : null;
}

export async function copyPressReleaseToTemporaryGraph(pressReleaseURI, tempGraphURI) {
    const statements = [];
    for (const resourceConfig of RESOURCE_CONFIG.resources) {
        const properties = await getProperties(pressReleaseURI, resourceConfig);
        statements.push(toStatements(properties));
    }
    const insertQuery = toInsertQuery(statements, tempGraphURI);

    return await updateSudo(insertQuery);
}

async function getProperties(pressReleaseURI, resourceConfig) {
    let selectQuery;
    let resultsMapper;

    if (resourceConfig.path) {
        selectQuery = `
        ${PREFIXES}
        SELECT ?relatedResource ?predicate ?object
        WHERE {
            ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease;
                                                    ${resourceConfig.path}   ?relatedResource .
            ?relatedResource ?predicate ?object .
            VALUES ?predicate {
                   ${resourceConfig.properties.map((i) => sparqlEscapeUri(i)).join('\n')}
            }
        }`;
        resultsMapper = (i) => {
            return {...i, subject: i.relatedResource};
        };
    } else {
        selectQuery = `
            ${PREFIXES}
            SELECT ?predicate ?object
            WHERE {
                ${sparqlEscapeUri(pressReleaseURI)}     a                       fabio:PressRelease.
                ${sparqlEscapeUri(pressReleaseURI)} ?predicate ?object .
                VALUES ?predicate {
                       ${resourceConfig.properties.map((i) => sparqlEscapeUri(i)).join('\n')}
                }
            }`;
        resultsMapper = (i) => {
            // add the parentURI manually since we already have it (needed for generating statements).
            return {...i, subject: {value: pressReleaseURI, type: 'uri'}};
        };
    }

    return (await query(selectQuery)).results.bindings.map(resultsMapper);
}
