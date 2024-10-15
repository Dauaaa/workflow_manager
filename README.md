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

## Product Features
- [ ] landing page with tracking (for tuning, conversion rate etc.)
- [ ] kanban (with live updates)
- [ ] user account management

## DX features
- [x] java app
- [x] generate OpenAPI file from java
- [x] generate typescript file from OpenAPI file
- [x] nextjs app
- [x] tailwind
- [ ] react app
- java
    - [ ] unit testing
    - [ ] integration testing
    - [ ] CI
    - [ ] CD
    - [ ] formatting
    - [ ] lint
- javascript
    - [ ] unit testing
    - [ ] integration testing
    - [ ] CI
    - [ ] CD
    - [ ] formatting
    - [ ] lint
- [ ] nix (nix + bazel is not working, will address later)

## Ideas
- Why? Avoid hidden bugs due to missing srcs attribute in tailwind/postcss macros
    - The way postcss is being called requires a genrule to have all the generated js visible. This is a problem since missing a css import won't trigger an error. Maybe could use buildozer + query
        - bazel query 'kind("filegroup", //webapps/landing_page/src/...)'
        - buildozer 'add srcs //webapps/landing_page/src/app:app_file_group :node_modules :project_settings' //webapps/landing_page:tailwind
- Why? Avoid hidden bugs due to missing a specific macro combination that won't error normall and is hard to test with other rules
    - Create standardized way to test if a proposed macro convention is being followed
