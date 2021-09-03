# Press release collaboration service

This service has an endpoint that takes care of copying a press release and all related resources needed when 2
organisations want to share/collaborate on a press release. The fields and relations can be defined
in ```./config.json```

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
  forward conn, [], "http://press-releases-collaboration-service/collaboration-activities/" <> id <> "/share"
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

# Environment

| Key | type | default | description |
|-----|------|---------|-------------|
| UPDATE_BATCH_SIZE | number | 10 | batch size for moving items between graphs |
| SELECT_BATCH_SIZE | number | 1000 | batch size selectiing items from graphs |
| COLLABORATOR_GRAPH_PREFIX | string | 'http://mu.semte.ch/graphs/organizations/' | the prefix to be used for the target graph where the collaborator data will be copied. the collaborator id will be added to the end. |


