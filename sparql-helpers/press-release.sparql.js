import { sparqlEscapeUri, query } from 'mu';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { mapBindingValue, toInsertQuery, toStatements } from '../helpers/generic-helpers';
import { getPressReleaseRelationsInsertQuery, getProperties } from './press-release-relations.sparql';
import { PREFIXES, PRESS_RELEASE_PROPERTIES } from '../config';

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

export async function copyPressReleaseRelationsToTemporaryGraph(pressReleaseURI, tempGraphURI) {
    const insertQuery = await getPressReleaseRelationsInsertQuery(pressReleaseURI, tempGraphURI);
    await updateSudo(insertQuery);
}

export async function copyPressReleaseProperties(pressReleaseURI, tempGraphURI) {
    const properties = await getProperties(pressReleaseURI, PRESS_RELEASE_PROPERTIES);
    const statements = toStatements(properties);
    const insertQuery = toInsertQuery(statements, tempGraphURI, false);
    await updateSudo(insertQuery);
}


