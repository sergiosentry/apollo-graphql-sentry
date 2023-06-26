const { ApolloServer, gql } = require("apollo-server-express");
const { buildFederatedSchema } = require("@apollo/federation");
var Sentry = require('@sentry/node');
var express = require('express');


const app = express();

Sentry.init({
    dsn: "{SENTRY_DSN}",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Undici(),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Automatically instrument Node.js libraries and frameworks
      //...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0,
  })

Sentry.configureScope( function (scope) {
  scope.setTag("process", "test_1");
})
  
// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// the rest of your app

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use("/", (req, res, next) => {
  console.log("======================================================");
  console.log(req.headers)
  
  next()
})

const typeDefs = gql`
  extend type Query {
    me: User
  }

  type User @key(fields: "id") {
    id: ID!
    name: String
    username: String
  }
`;

const resolvers = {
  Query: {
    me() {
      return users[0];
    }
  },
  User: {
    __resolveReference(object) {
      return users.find(user => user.id === object.id);
    }
  }
};



(async () => {
    const server = new ApolloServer({
        schema: buildFederatedSchema([
          {
            typeDefs,
            resolvers
          }
        ]),
    });
  
    await server.start()
  
    server.applyMiddleware({ app });
  
    // Start the server
    app.listen({ port: 4001 }, () => {
        console.log(`Server ready at http://localhost:4001${server.graphqlPath}`);
    });

    })();

const users = [
  {
    id: "1",
    name: "Ada Lovelace",
    birthDate: "1815-12-10",
    username: "@ada"
  },
  {
    id: "2",
    name: "Alan Turing",
    birthDate: "1912-06-23",
    username: "@complete"
  }
];