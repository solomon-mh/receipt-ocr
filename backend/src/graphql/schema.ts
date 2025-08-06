import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Upload

  type Receipt {
    id: ID!
    storeName: String!
    purchaseDate: String!
    totalAmount: Float!
    imageUrl: String!
    items: [Item!]!
    createdAt: String!
  }

  type Item {
    id: ID!
    name: String!
    quantity: Int
  }

  type UploadReceiptPayload {
    success: Boolean!
    message: String
    receipt: Receipt
  }

  type Query {
    receipts(storeName: String, from: String, to: String): [Receipt]
  }

  type Mutation {
    uploadReceipt(file: Upload!): UploadReceiptPayload!
  }
`;
