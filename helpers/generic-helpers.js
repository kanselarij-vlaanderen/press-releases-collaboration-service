import { sparqlEscapeUri, sparqlEscapeString } from 'mu';

export function handleGenericError(e, next) {
  console.error(e);
  e.status = 500;
  return next(e);
}

export function parseSparqlResult(binding) {
  if (binding) {
    const result = {};
    for (let key in binding) {
      result[key] = binding[key].value;
    }
    return result;
  } else {
    return null;
  }
}

export function isInverse(predicate) {
  return predicate && predicate.startsWith('^');
}

export function sparqlEscapePredicate(predicate) {
  return isInverse(predicate) ? `^<${predicate.slice(1)}>` : `<${predicate}>`;
}

export function normalizePredicate(predicate) {
  return isInverse(predicate) ? predicate.slice(1) : predicate;
}

export function toStatements(triples) {
  return triples.map(function(t) {
    const subject = escape(t.subject);
    const predicate = escape(t.predicate);
    const object = escape(t.object);
    return `${subject} ${predicate} ${object} . `;
  }).join('\n');
}

export function escape(rdfTerm) {
  const { type, value, datatype, 'xml:lang': lang } = rdfTerm;
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
