import { sparqlEscapeString, sparqlEscapeUri, query, uuid } from 'mu';
import { parseSparqlResult } from '../helpers/generic-helpers';
import { COLLABORATOR_GRAPH_PREFIX, PREFIXES } from '../constants';
import { updateSudo } from '@lblod/mu-auth-sudo';
import { isTokenClaimAssignedToUser } from './token-claim.sparql';
import { copyPressReleaseToGraph, deletePressReleaseFromGraph, deleteCollaborationResourcesFromGraph } from './press-release.sparql';
import { moveGraph, removeGraph } from '../helpers/graph-helpers';

export async function getCollaborationActivityById(id) {
  const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?pressReleaseUri ?tokenClaimUri
    WHERE {
        ?uri a ext:CollaborationActivity ;
            mu:uuid ${sparqlEscapeString(id)} ;
            prov:used ?pressReleaseUri .
        OPTIONAL { ?uri prov:generated ?tokenClaimUri . }
    }
    LIMIT 1
  `);

  return parseSparqlResult(queryResult.results.bindings[0]);
}

export async function getCollaborators(collaborationActivityUri) {
  const queryResult = await query(`
    ${PREFIXES}

    SELECT ?uri ?id
    WHERE {
        ${sparqlEscapeUri(collaborationActivityUri)} a ext:CollaborationActivity ;
            prov:wasAssociatedWith ?uri .
        ?uri a vcard:Organization;
            mu:uuid ?id.
    }
  `);

  return queryResult.results.bindings.map(parseSparqlResult);
}

export async function distributeData(collaboration, collaborators) {
  const tempGraph = `http://mu.semte.ch/graphs/tmp-data-share/${uuid()}`;
  console.info(`Creating copy of press-release <${collaboration.pressReleaseUri}> to temporary graph ${tempGraph}`);
  await copyPressReleaseToGraph(collaboration.pressReleaseUri, tempGraph);

  for (const collaborator of collaborators) {
    const targetGraph = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`;
    console.info(`Copying data from temporary graph to target collaborator graph <${targetGraph}>`);
    await moveGraph(tempGraph, targetGraph);
  }

  console.info(`Cleanup temporary graph <${tempGraph}>`);
  await removeGraph(tempGraph);
  console.info(`Successfully transferred press-release <${collaboration.pressReleaseUri}> to the ${collaborators.length} collaborators of collaboration <${collaboration.uri}>.`);
}

export async function updateDataDistribution(collaboration, collaborators, user) {
  let tokenClaimed = false;
  if (collaboration.tokenClaimUri) {
    tokenClaimed = await isTokenClaimAssignedToUser(collaboration.tokenClaimUri, user.uri);
  }

  const tempGraph = `http://mu.semte.ch/graphs/tmp-data-share/${uuid()}`;
  console.info(`Creating copy of press-release <${collaboration.pressReleaseUri}> to temporary graph ${tempGraph}`);
  if (!tokenClaimed) {
    console.info(`Since the user currently doesn't hold the edit token of the press-release, only approval- and historic-press-release activities (marked as non-claimable in the resource config) will be copied`);
  }
  await copyPressReleaseToGraph(collaboration.pressReleaseUri, tempGraph, tokenClaimed);

  for (const collaborator of collaborators) {
    const targetGraph = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`;
    console.info(`Deleting old data from target collaborator graph <${targetGraph}>`);
    await deletePressReleaseFromGraph(collaboration.pressReleaseUri, targetGraph, !tokenClaimed);
    console.info(`Copying data from temporary graph to target collaborator graph <${targetGraph}>`);
    await moveGraph(tempGraph, targetGraph);
  }

  console.info(`Cleanup temporary graph <${tempGraph}>`);
  await removeGraph(tempGraph);
  console.info(`Successfully transferred press-release <${collaboration.pressReleaseUri}> to the ${collaborators.length} collaborators of collaboration <${collaboration.uri}>.`);
}

export async function stopDataDistribution(collaboration, collaborators, creator) {
  const slaveCollaborators = collaborators.filter(collaborator => collaborator.uri !== creator.uri);
  for (const collaborator of slaveCollaborators) {
    const graph = `${COLLABORATOR_GRAPH_PREFIX}${collaborator.id}`;
    console.info(`Deleting data from collaborator graph <${graph}>`);
    await deletePressReleaseFromGraph(collaboration.pressReleaseUri, graph);
  }

  const masterGraph = `${COLLABORATOR_GRAPH_PREFIX}${creator.id}`;
  console.info(`Deleting collaboration and approvals from master graph <${masterGraph}>`);
  await deleteCollaborationResourcesFromGraph(collaboration.pressReleaseUri, masterGraph);
}
