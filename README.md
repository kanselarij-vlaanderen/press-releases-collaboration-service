# Press release collaboration service
## How to

### Run the application in development mode

For development, add a docker-compose.override.yml to your main project (app-persberichten), or add the following
service to your existing docker-compose.override.yaml.
(You might have to change the volume path to the root path of this application).

```yaml
services:
  collaboration:
    image: semtech/mu-javascript-template
    ports:
      - <available-port-on-device>:80
    environment:
      NODE_ENV: "development"
    volumes:
      - ../press-release-collaboration-service/:/app/
```

and add the following route to the dispatcher config (```config/dispatcher/dispatcher.ex```)

```elixir
  post "/collaboration-activities/:id/share", @json do
    forward conn, [], "http://collaboration/collaboration-activities/" <> id <> "/share"
  end

  post "/collaboration-activities/:id/claims", @json do
    forward conn, [], "http://collaboration/collaboration-activities/" <> id <> "/claims"
  end

  delete "/collaboration-activities/:id/claims", @json do
    forward conn, [], "http://collaboration/collaboration-activities/" <> id <> "/claims"
  end
```

# Configuration

The resources to be copied are defined in the ```config.json```

```json
{
  "resources": [
    {
      // the path is the resources relation to the press-relase
      "path": "nie:hasPart / nie:dataSource",
      "properties": [
        // a list  of properties that should be copied from the related resource 
        "http://purl.org/dc/terms/created",
        ...
      ]
    },
    {
      // if th properties are from the press-release itself, path should not be defined.
      "properties": [
        "http://purl.org/dc/terms/created",
        ...
      ]
    }
  ]
}

```

# Endpoints

## POST /collaboration-activities/:id/share
This endpoint searches for a collaboration-activity with the id specified in the url. 
if found,  the related press release is copied to a temporary graph, and once all 
related properties that are defined in the ```./config.json``` are copied to the temporary graph. 
This temporary graph then gets copied into all collaborators linked to the collaboration-activity

### Responses
| status | description |
|-------|-------------|
| 202 | Accepted |
| 404 | Not Found: no collaboration-activity found with the provided id |
|403 | Forbidden: if the request is executed by a user that is not part of the master-kabinet that created the press-release (derrived from the session-uri in the request headers)|

## POST /collaboration-activities/:id/claims
This endpoint creates a token-claim for the collaboration-activity with the provided id. The user that makes the request 
should be part of the collaboration-activity's collaborators and the token should not be already claimed.

### Responses
| status | description |
|-------|-------------|
| 201 | Created: created token-claim to all collaborator graphs |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not part of the collaborators linked to the press-release (derrived from the session-uri in the request headers)|
| 409 | Conflict: if collaboration-activity already has a token-claim linked to it |

## DELETE /collaboration-activities/:id/claims
This endpoint deletes a token-claim for the collaboration-activity with the provided id. The user that makes the request
should have the current token-claim assigned.

### Responses
| status | description |
|-------|-------------|
| 200 | Ok |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not the current owner of the token-claim |
| 409 | Conflict: if there is no token-claim linked to the collaboration-activity |

## PUT /collaboration-activities/:id
This endpoint transfers the data related to the press-release that is linked to the collaboration-activity. 
If the user is the current claimer of the token-claim, all fields are copied, otherwise only the meta-data fields are copied.

In the ```config.json``` it is possible to make the distinction between meta-fields by giving them a ```isMetadata``` property set to ```true```


### Responses
| status | description |
|-------|-------------|
| 200 | OK: successfully copied the press-release / metadata to the collaborator graphs |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not part of the collaborators linked to the press-release (derrived from the session-uri in the request headers)|


# POST /collaboration-activities/:id/approvals
This endpoint creates an approval activity in every graph for the collaborators linked to the collaboration-activity

### Responses
| status | description |
|-------|-------------|
| 200 | Ok |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not part of the collaborators |
| 409 | Conflict: if the approval-activity already exists |

# DELETE /collaboration-activities/:id/approvals
This endpoint creates an approval activity in every graph for the collaborators linked to the collaboration-activity

### Responses
| status | description |
|-------|-------------|
| 200 | No Content: successfully terminated collaboration |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not part of the creator organization |

# DELETE /collaboration-activities/:id/approvals
This endpoints terminates the collaboration on a press-release. It removes tthe related press-release and it's 
properties/relations from the (non-creator) collaborator graphs and deletes the collaboration-activity and approval-activities from the master/creator graph.

### Responses
| status | description |
|-------|-------------|
| 204 | No Content: successfully deleted approval-activity |
| 404 | Not Found: no collaboration-activity found with the provided id |
| 403 | Forbidden: if the request is executed by a user that is not part of the collaborators |
| 409 | Conflict: if there is no approval-activity linked to the collaboration activity |

# Environment
| Key | type | default | description |
|-----|------|---------|-------------|
| UPDATE_BATCH_SIZE | number | 10 | batch size for moving items between graphs |
| SELECT_BATCH_SIZE | number | 1000 | batch size selectiing items from graphs |
| COLLABORATOR_GRAPH_PREFIX | string | 'http://mu.semte.ch/graphs/organizations/' | the prefix to be used for the target graph where the collaborator data will be copied. the collaborator id will be added to the end. |


