# workflow manager

## Objective

Showcase some of my current developer skills and knowledge.
- Standard practices
    - RESTful API
    - Event system
    - Live updates
    - OpenTelemetry
- Technologies
    - Authentication
        - Google OAuth
        - Email/Password
    - Application layer protocols
        - HTTP
        - Websocket
        - postgres
    - tooling
        - Bazel
        - nix
        - git
    - java 
        - Spring framework
    - javascript/typescript
        - react
        - Next.js
        - tailwind
        - shadcn

## TODO
- [ ] configure attribute description
    - [ ] frontend
    - [ ] backend
- [x] configure change rules
    - [x] frontend
    - [x] backend
- [x] websocket integration
    - [x] frontend
    - [x] backend
- [x] rabbitmq
    - [x] publisher (workflowmanager)
    - [x] consumer (websocket service)
- [x] redis message queue
- [x] simple authorization
- [ ] CEL
    - [ ] frontend
    - [ ] backend
- [ ] ui feedback
    - [ ] loading on submit
    - [ ] loading on fetch
    - [ ] background signal on change
    - [ ] error toast
    - [ ] schema error messages
    - [ ] date attribute form component
    - [ ] timestamp atribute form component

## DX features
- [x] java app
- [x] generate OpenAPI file from java
- [x] generate typescript file from OpenAPI file
- [x] nextjs app
- [x] tailwind
- [x] react app
- java
    - [ ] logging/tracing
    - [ ] CEL integration
    - [ ] messagery
    - [ ] unit testing
    - [ ] integration testing
    - [ ] CI
    - [ ] CD
    - [ ] formatting
    - [ ] lint
- javascript
    - [ ] logging/tracing
    - [ ] CEL integration
    - [ ] unit testing
    - [ ] integration testing
    - [ ] CI
    - [ ] CD
    - [ ] formatting
    - [ ] lint
- [ ] nix (nix + bazel is not working, will address later)

## Tasks
- [ ] create the fields class
    - [ ] all entities can have fields
        - for example, a state might have a capacity that is enforced by rules
        - a state might have a deadline
    - [ ] features will use the fields too
        - you can namespace with for example ff__priority_v1 to signal the field priority v1 is available
        - with reflection, the components can have behavior depending if the field exists
    - [ ] types
        - [ ] integer
        - [ ] float
        - [ ] enum
        - [ ] decimal
        - [ ] date
        - [ ] timestamp
        - [ ] boolean
        - [ ] string
            - [ ] regex (CAREFUL!)
            - [ ] email
            - [ ] phone
    - since I'm using java, so I think making a sparse class with all these fields and only populating the correct one is ok
    - classes: 
        - FieldInstance { Integer descriptionId, Long integer, Double float, ... }
        - FieldDescription extends BaseEntity { Integer workflowId, String celExpr, FieldType type, ... }

## Ideas

## Problems
- package.json defining dep versions all over the place
- how do I define http errors for the java services?

## Don't know
- all ts/tsx files are copied when `vite_ts_project` is used. This is necessary so vite can see the files

## Tips in this repo
- if openapi gen fails, bump the sleep time
- if java lsp fails, make build //... work - (this took me a while to figure out)
