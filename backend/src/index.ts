import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolver";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

// @ts-ignore
global.fetch = fetch;
const { graphqlUploadExpress } = require("graphql-upload");

dotenv.config();
const prisma = new PrismaClient();
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({ prisma }),
});

async function startServer() {
  app.use(graphqlUploadExpress({ maxFileSize: 5000000, maxFiles: 1 }));
  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(
      `🚀 Server running at http://localhost:${port}${server.graphqlPath}`
    );
  });
}

startServer();
