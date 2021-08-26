import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString, sparqlEscapeNumber } from 'mu';

export const PREFIXES = `
    PREFIX mu: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/core/')}
    PREFIX ext: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/ext/')}
    PREFIX ebucore: ${sparqlEscapeUri('http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#')}
    PREFIX prov: ${sparqlEscapeUri('http://www.w3.org/ns/prov#')}
    PREFIX vcard: ${sparqlEscapeUri('http://www.w3.org/2006/vcard/ns#')}
    PREFIX foaf: ${sparqlEscapeUri('http://xmlns.com/foaf/0.1/')}
    PREFIX fabio: ${sparqlEscapeUri('http://purl.org/spar/fabio/')}
    PREFIX session: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/session/')}
    PREFIX nmo: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#')}
    PREFIX nie: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/01/19/nie#')}
    PREFIX nfo: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#')}
    PREFIX dct: ${sparqlEscapeUri('http://purl.org/dc/terms/')}
    PREFIX dbpedia: ${sparqlEscapeUri('http://purl.org/dc/terms/')}
`;

export const ATTACHMENT_PREDICATES = {
    'http://purl.org/dc/terms/created': sparqlEscapeDateTime,
    'http://purl.org/dc/terms/modified': sparqlEscapeDateTime,
    'http://purl.org/dc/terms/format': sparqlEscapeString,
    'http://mu.semte.ch/vocabularies/core/uuid': sparqlEscapeString,
    'http://dbpedia.org/ontology/fileExtension': sparqlEscapeString,
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileName': sparqlEscapeString,
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileSize': sparqlEscapeNumber,
};

export const DOWNLOAD_PREDICATES = {
    'http://mu.semte.ch/vocabularies/core/uuid': sparqlEscapeString,
};
