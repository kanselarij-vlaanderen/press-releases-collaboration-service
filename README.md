# Press release email generator service

// todo

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

and add the following route to the 


# Endpoints

## POST /collaboration-activities/:id/share

### Responses

| status | description |
|-------|-------------|
| 202 | Accepted |
|403| Forbidden: indien de request niet uitgevoerd wordt door een gebruiker die deel uitmaakt van het master-kabinet dat het persbericht aangemaakt heeft (af te leiden uit de session-uri in de request headers)|

# Environment

| Key | type | default | description |
|-----|------|---------|-------------|
|  |  |  |  |
