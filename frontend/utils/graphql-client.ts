import { gql } from "graphql-request";

const endpoint = "http://localhost:4000/graphql";

const UPLOAD_RECEIPT = gql`
  mutation UploadReceipt($file: Upload!) {
    uploadReceipt(file: $file) {
      success
      message
      receipt {
        id
        storeName
        purchaseDate
        totalAmount
        imageUrl
        createdAt
        items {
          id
          name
          quantity
        }
      }
    }
  }
`;

export const uploadReceipt = async (file: File) => {
  const formData = new FormData();
  formData.append(
    "operations",
    JSON.stringify({
      query: UPLOAD_RECEIPT,
      variables: { file: null },
    })
    // 0916845833
  );
  formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
  formData.append("0", file);

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  console.log("GraphQL response:", json);
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json.data;
};
