import { sparqlEscapeUri, sparqlEscapeDateTime, sparqlEscapeString } from 'mu';

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

export const ATTACHMENT_PREDICATES = [
    'http://purl.org/dc/terms/created',
    'http://purl.org/dc/terms/modified',
    'http://purl.org/dc/terms/format',
    'http://mu.semte.ch/vocabularies/core/uuid',
    'http://dbpedia.org/ontology/fileExtension',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileName',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileSize',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileCreated',
];

export const DOWNLOAD_PREDICATES = [
    'http://purl.org/dc/terms/created',
    'http://purl.org/dc/terms/modified',
    'http://purl.org/dc/terms/format',
    'http://mu.semte.ch/vocabularies/core/uuid',
    'http://dbpedia.org/ontology/fileExtension',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileName',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileSize',
    'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileCreated',
];

export const SOURCES_PREDICATES = [
    'http://mu.semte.ch/vocabularies/core/uuid',
    'http://purl.org/dc/terms/created',
    'http://purl.org/dc/terms/modified',
    'http://www.w3.org/2006/vcard/ns#fn',
    'http://www.w3.org/2006/vcard/ns#family-name',
    'http://www.w3.org/2006/vcard/ns#given-name',
    'http://www.w3.org/2006/vcard/ns#role',
    // http://www.w3.org/ns/adms#status
    // http://mu.semte.ch/vocabularies/ext/hasMobile
    // http://www.w3.org/2006/vcard/ns#hasTelephone
    // http://www.w3.org/2006/vcard/ns#hasEmail
];

