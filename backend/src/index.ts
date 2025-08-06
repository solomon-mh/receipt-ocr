import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolver";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
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
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
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
