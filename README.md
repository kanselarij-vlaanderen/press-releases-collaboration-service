# Press release collaboration service

This service has an endpoint that takes care of copying a press release and all related resources needed when 2 organisations want to share/collaborate on a press release.
The fields and relations can be defined in ```./config.js```

## How to

### Run the application in development mode

For development, add a docker-compose.override.yml to your main project (app-persberichten), or add the following
service to your existing docker-compose.override.yaml.
(You might have to change the volume path to the root path of this application).

```yaml
services:
  press-releases-collaboration-service:
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

# Endpoints

## POST /collaboration-activities/:id/share

### Responses

| status | description |
|-------|-------------|
| 202 | Accepted |
|403 | Forbidden: indien de request niet uitgevoerd wordt door een gebruiker die deel uitmaakt van het master-kabinet dat het persbericht aangemaakt heeft (af te leiden uit de session-uri in de request headers)|

# Environment

| Key | type | default | description |
|-----|------|---------|-------------|
| UPDATE_BATCH_SIZE | number | 10 | batch size for moving items between graphs |
| SELECT_BATCH_SIZE | number | 1000 | batch size selectiing items from graphs |
| COLLABORATOR_GRAPH_PREFIX | string | 'http://mu.semte.ch/graphs/organizations/' | the prefix to be used for the target graph where the collaborator data will be copied. the collaborator id will be added to the end. |


