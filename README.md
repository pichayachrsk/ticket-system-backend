## Ticket System Backend
The app expects an endpoint available at the following endpoints:

- GET  /tickets - To display all tickets
- GET  /tickets/:id - To display ticket detail by params id
- POST /tickets - To create ticket
- PATCH /tickets/:id - To update ticket
- DELETE /tickets/:id - To delete ticket

all features are included as the requirement.

Tech Stack: Prisma + SQLite + bullmq + redis

## Project setup

```bash
$ npm install
```
**Need to run redis first. you can use docker to start**

```bash
$ docker run -d --name redis -p 6379:6379 redis:<version>
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
