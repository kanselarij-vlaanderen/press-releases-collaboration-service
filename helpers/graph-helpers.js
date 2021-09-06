import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { SELECT_BATCH_SIZE, UPDATE_BATCH_SIZE } from '../constants';
import { escape } from './generic-helpers';

export async function moveGraph(source, target) {
    const triples = await getTriples(source);
    await insertInGraph(triples, target);
}

async function getTriples(graph) {
    let triples = [];
    const count = await countTriples(graph);
    if (count > 0) {
        console.log(`Parsing 0/${count} triples`);
        let offset = 0;
        const query = `
      SELECT * WHERE {
        GRAPH <${graph}> {
          ?subject ?predicate ?object .
        }
      }
      LIMIT ${SELECT_BATCH_SIZE} OFFSET %OFFSET
    `;

        while (offset < count) {
            const result = await parseBatch(query, offset);
            triples.push(...result);
            offset = offset + SELECT_BATCH_SIZE;
            console.log(`Parsed ${offset < count ? offset : count}/${count} triples`);
        }
    }

    return triples;
}

async function insertInGraph(triples, graph) {
    for (let i = 0; i < triples.length; i += UPDATE_BATCH_SIZE) {
        console.log(`Inserting triples in batch: ${i}-${i + UPDATE_BATCH_SIZE}`);
        const batch = triples.slice(i, i + UPDATE_BATCH_SIZE);
        const statements = batch.map(b => toTripleStatement(b)).join('\n');
        await update(`
      INSERT DATA {
        GRAPH <${graph}> {
            ${statements}
        }
      }
    `);
    }
}

function toTripleStatement(triple) {
    const subject = escape(triple.subject);
    const predicate = escape(triple.predicate);
    const object = escape(triple.object);
    return `${subject} ${predicate} ${object} .`;
}

export async function removeGraph(graph) {
    const count = await countTriples(graph);
    if (count > 0) {
        console.log(`Deleting 0/${count} triples`);
        let offset = 0;
        const deleteStatement = `
      DELETE {
        GRAPH <${graph}> {
          ?subject ?predicate ?object .
        }
      }
      WHERE {
        GRAPH <${graph}> {
          SELECT ?subject ?predicate ?object
            WHERE { ?subject ?predicate ?object }
            LIMIT ${UPDATE_BATCH_SIZE}
        }
      }
    `;

        while (offset < count) {
            console.log(`Deleting triples in batch: ${offset}-${offset + UPDATE_BATCH_SIZE}`);
            await update(deleteStatement);
            offset = offset + UPDATE_BATCH_SIZE;
        }
    }
}

async function countTriples(graph) {
    const queryResult = await query(`
        SELECT (COUNT(*) as ?count)
        WHERE {
          GRAPH <${graph}> {
            ?s ?p ?o .
          }
        }
      `);

    return parseInt(queryResult.results.bindings[0].count.value);
}

async function parseBatch(q, offset = 0) {
    const pagedQuery = q.replace('%OFFSET', offset);
    const result = await query(pagedQuery);

    return result.results.bindings.length ? result.results.bindings : null;
}

