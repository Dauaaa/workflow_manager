# workflow manager

[Website link]()

## Objective

Showcase some of my current developer skills and knowledge.
- Standard practices
    - RESTful API
    - Event system
    - Live updates
    - Mobile friendly interface
- Technologies
    - Application layer protocols
        - http
        - ws
        - postgresql
        - amqp
        - redis
    - tooling
        - Bazel
        - git
    - java 
        - Spring framework
            - jpa
            - rabbitmq
            - redis
            - websocket
        - CEL compiler
    - javascript/typescript
        - react
        - mobx
        - tailwind
        - shadcn
        - websocket

## How it works?

This is a simple application to define workflows as state machines. All mutations to an entities' state or its data is done using a RESTful API. Any mutation will trigger an event and other users will be notified of the update.

The live update system works like this:
1. RESTful request mutates data and publishes message to rabbitmq exchange
2. Websocket server receives the message and
    - Stores the message in a short lived redis buffer
    - Notifies any ws client subscribed to the event

The redis buffer is used to rapidly sync a subscription and resolve race conditions.

The web client has a store that only updates data if the incoming data has its update time greater than current update time.

### Overview of the system:
```mermaid
flowchart TD
    subgraph Clientsx[Client making update]
        Client1[Client]
    end

    subgraph Rabbitmqx[Message broker]
        Rabbitmq{RabbitMQ server}
    end

    subgraph Restfulx[RESTful server]
        Restful[RESTful server]
        Restful ---> Postgres(Postgres DB)
    end

    subgraph WSServerx[WSServer]
        Rabbitmq ---> WSServer[Websocket server]
        WSServer ---> Redis(Redis DB)
    end

    Restful ---> Rabbitmq
    Client1 ---> Restful

    subgraph ClientsRecv[Clients receiving update]
        WSServer ---> Client2[Client]
        WSServer ---> Client3[Client]
    end
```
