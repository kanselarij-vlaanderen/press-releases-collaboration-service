import { sparqlEscapeUri } from 'mu';

export const UPDATE_BATCH_SIZE = parseInt(process.env.UPDATE_BATCH_SIZE) || 10;
export const SELECT_BATCH_SIZE = parseInt(process.env.SELECT_BATCH_SIZE) || 1000;
export const COLLABORATOR_GRAPH_PREFIX = process.env.COLLABORATOR_GRAPH_PREFIX || 'http://mu.semte.ch/graphs/organizations/';

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
    PREFIX skos: ${sparqlEscapeUri('http://www.w3.org/2004/02/skos/core#')}
    PREFIX adms: ${sparqlEscapeUri('http://www.w3.org/ns/adms#')}
    PREFIX org: ${sparqlEscapeUri('http://www.w3.org/ns/org#')}
`;
