import { query, sparqlEscapeUri, sparqlEscapeString } from 'mu';
import { PREFIXES } from '../config';

export function handleGenericError(e, next) {
    console.error(e);
    e.status = 500;
    return next(e);
}

export function mapBindingValue(binding) {
    const result = {};
    for (let key in binding) {
        result[key] = binding[key].value;
    }
    return result;
}

export async function getOrganizationURIFromHeaders(headers) {
    const sessionURI = headers['mu-session-id'];
    const queryResult = await query(`
    ${PREFIXES}
    SELECT ?organisationURI
    WHERE {
        ${sparqlEscapeUri(sessionURI)}  session:account / ^foaf:account / ^foaf:member ?organisationURI.
    }
    `);

    return queryResult.results.bindings.length ? queryResult.results.bindings.map(mapBindingValue)[0].organisationURI : null;
}

export function toStatements(triples) {
    // (imported from https://github.com/kanselarij-vlaanderen/themis-publication-consumer/blob/master/lib/delta-file.js#L132-L158)

    const escape = function (rdfTerm) {
        const {type, value, datatype, 'xml:lang': lang} = rdfTerm;
        if (type === 'uri') {
            return sparqlEscapeUri(value);
        } else if (type === 'literal' || type === 'typed-literal') {
            // We ignore xsd:string datatypes because Virtuoso doesn't treat those as default datatype
            // Eg. SELECT * WHERE { ?s mu:uuid "4983948" } will not return any value if the uuid is a typed literal
            // Since the n3 npm library used by the producer explicitely adds xsd:string on non-typed literals
            // we ignore the xsd:string on ingest
            if (datatype && datatype !== 'http://www.w3.org/2001/XMLSchema#string')
                return `${sparqlEscapeString(value)}^^${sparqlEscapeUri(datatype)}`;
            else if (lang)
                return `${sparqlEscapeString(value)}@${lang}`;
            else
                return `${sparqlEscapeString(value)}`;
        } else
            console.log(`Don't know how to escape type ${type}. Will escape as a string.`);
        return sparqlEscapeString(value);
    };
    return triples.map(function (t) {
        const subject = escape(t.subject);
        const predicate = escape(t.predicate);
        const object = escape(t.object);
        return `${subject} ${predicate} ${object} . `;
    }).join('\n');
}

export function toInsertQuery(statements, graph, multipleStatements = true) {
    return `
    ${PREFIXES}
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)}{
           ${multipleStatements ? statements.join(' ') : statements}
        }
    }
    `;
}


export function escape(rdfTerm) {
    const {type, value, datatype, 'xml:lang': lang} = rdfTerm;
    if (type === 'uri') {
        return sparqlEscapeUri(value);
    } else if (type === 'literal' || type === 'typed-literal') {
        // We ignore xsd:string datatypes because Virtuoso doesn't treat those as default datatype
        // Eg. SELECT * WHERE { ?s mu:uuid "4983948" } will not return any value if the uuid is a typed literal
        // Since the n3 npm library used by the producer explicitely adds xsd:string on non-typed literals
        // we ignore the xsd:string on ingest
        if (datatype && datatype !== 'http://www.w3.org/2001/XMLSchema#string')
            return `${sparqlEscapeString(value)}^^${sparqlEscapeUri(datatype)}`;
        else if (lang)
            return `${sparqlEscapeString(value)}@${lang}`;
        else
            return `${sparqlEscapeString(value)}`;
    } else
        console.log(`Don't know how to escape type ${type}. Will escape as a string.`);
    return sparqlEscapeString(value);
}
