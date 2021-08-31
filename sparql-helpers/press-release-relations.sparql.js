import { sparqlEscapeUri, query } from 'mu';
import { PREFIXES, LINKED_RESOURCES } from './constants.sparql';
import { toInsertQuery, toStatements } from '../helpers/generic-helpers';

export async function getPressReleaseRelationsInsertQuery(pressReleaseURI, tempGraphURI) {
    const statements = []
    for(const resource of LINKED_RESOURCES){
        statements.push(await getChildRelationStatements(pressReleaseURI, resource)) ;
    }
   return toInsertQuery(statements, tempGraphURI)
}


async function getChildRelationStatements(parentURI, resourceConfig) {
        const linkedResourceItems = await getLinkedResources(parentURI, resourceConfig);
        const resourceStatements = toStatements(linkedResourceItems);
        const statements = [resourceStatements];

        for(let linkedResource of linkedResourceItems){
            // check if relation is inverse, and accordingly add statements to link every resource to it's parent
            if(!resourceConfig.inverse){
            statements.push(`${sparqlEscapeUri(parentURI)} ${resourceConfig.relationPredicate} ${sparqlEscapeUri(linkedResource.subject.value)}.`);
            } else{
                statements.push(`${sparqlEscapeUri(linkedResource.subject.value)} ${resourceConfig.relationPredicate} ${sparqlEscapeUri(parentURI)}.`);
            }
        }

        if (resourceConfig.relations && linkedResourceItems.length) {
            for (const childRelation of resourceConfig.relations) {
                const childRelationStatements = await getChildRelationStatements(linkedResourceItems[0].subject.value, childRelation);
                statements.push(childRelationStatements);
            }
        }
        return statements.join(' ');
}

async function getLinkedResources(parentURI, resourceConfig) {
    return (await query(` 
    ${PREFIXES}
    
    SELECT ?relatedResource ?predicate ?object
    WHERE {
        ${sparqlEscapeUri(parentURI)}     a                                        ${resourceConfig.parentPredicate};
                                          ${(resourceConfig.inverse ? '^' : '' ) + resourceConfig.relationPredicate}       ?relatedResource .
        ?relatedResource                  ?predicate                               ?object .
        VALUES ?predicate {
            ${resourceConfig.predicates.map((i) => sparqlEscapeUri(i)).join(' ')}
        }
    }
    `)).results.bindings.map((i) => {
        // add the parentURI manually since we already have it (needed for generating statements).
        i.subject = i.relatedResource;
        return i;
    });
}


export async function getProperties(resourceURI, resourceConfig) {
    return (await query(` 
    ${PREFIXES}
    
    SELECT ?predicate ?object
    WHERE {
        ${sparqlEscapeUri(resourceURI)}     a                                        ${resourceConfig.resourcePredicate};
                                            ?predicate                               ?object .
        VALUES ?predicate {
            ${resourceConfig.predicates.map((i) => sparqlEscapeUri(i)).join(' ')}
        }
    }
    `)).results.bindings.map((i) => {
        // add the parentURI manually since we already have it (needed for generating statements).
        i.subject = {value: resourceURI, type: 'uri'};
        return i;
    });
}
