const express = require('express');
const app = express();
const port = 3000;
var Sentry = require('@sentry/node');
var undici = require('undici');


Sentry.init({
    dsn: "{SENTRY_DSN}",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Undici(),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app })
      // Automatically instrument Node.js libraries and frameworks
      //...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 1
})

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// the rest of your app

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());


// Define a route handler for the root path
app.get('/graphql', async (req, res) => {
    obj = {
        "query" : "query ExampleQuery {\n me {\n id,\n name,\n username\n}\n}\n",
        "variables" : {},
        "operationName" : "ExampleQuery"
    }

    console.log("making request")
    const response = await undici.fetch("http://localhost:4000/graphql", {
        method: "POST",
        body: JSON.stringify(obj),
        headers: {'Content-Type': 'application/json', "sentry": "test-value"}
    })
    
    console.log(response);
    res.send("hello world");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});