import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { PubSub } from "graphql-subscriptions";
import { buildSchema } from "type-graphql";
import { MessageResolver } from "./resolvers/message";

const pubSub = new PubSub();

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
// const resolvers = {
//   Query: {
//     books: () => {
//       console.log({ booksBD });
//       return booksBD;
//     },
//   },
//   Mutation: {
//     addBook(parent: any, { book }: any) {
//       booksBD.push(book);
//       pubsub.publish("BOOK_ADDED", { bookAdded: book });
//       return book;
//     },
//   },
//   Subscription: {
//     bookAdded: {
//       subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
//     },
//   },
// };

const messages: String[] = ["uno", "dos"];

async function startApolloServer() {
  const app = express();
  const httpServer = createServer(app);

  const schema = await buildSchema({
    resolvers: [MessageResolver],
    pubSub,
  });

  // Same ApolloServer initialization as before
  const server = new ApolloServer({
    schema,
    context: {
      pubSub,
      messages,
    },
  });

  // Required logic for integrating with Express
  await server.start();

  server.applyMiddleware({
    app,

    // By default, apollo-server hosts its GraphQL endpoint at the
    // server root. However, *other* Apollo Server packages host it at
    // /graphql. Optionally provide this to match apollo-server.
    path: "/",
  });

  const subscriptionServer = SubscriptionServer.create(
    {
      // This is the `schema` we just created.
      schema,
      // These are imported from `graphql`.
      execute,
      subscribe,
    },
    {
      // This is the `httpServer` we created in a previous step.
      server: httpServer,
      // This `server` is the instance returned from `new ApolloServer`.
      path: server.graphqlPath,
    }
  );

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => subscriptionServer.close());
  });

  const PORT = process.env.PORT || 4000;

  // Modified server startup
  await new Promise((resolve: any) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  );
}

startApolloServer();
