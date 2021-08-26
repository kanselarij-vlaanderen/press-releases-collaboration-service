import { sparqlEscapeUri } from 'mu';

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

export const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

export const RELATION_PREDICATES = [
    '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', //also add rdf type predicate since it needs to be fiiltered out as well
    '<http://www.w3.org/ns/adms#status>',
    '<http://mu.semte.ch/vocabularies/ext/hasMobile>',
    '<http://www.w3.org/2006/vcard/ns#hasTelephone>',
    '<http://www.w3.org/2006/vcard/ns#hasEmail>',
    '<http://www.semanticdesktop.org/ontologies/2007/01/19/nie#dataSource>',
];
