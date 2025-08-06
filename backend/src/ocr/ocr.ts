//  Option1 - Tesseract

import Tesseract from "tesseract.js";

export const extractTextFromImage = async (
  imagePath: string
): Promise<string> => {
  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, "eng");
  return text;
};

//  Option2 - Google-cloud vission - It asks for billing to be enabled

// import vision from "@google-cloud/vision";

// const client = new vision.ImageAnnotatorClient({
//   keyFilename: "./google-service-account-key.json",
// });

// export const extractTextFromImage = async (
//   imagePath: string
// ): Promise<string> => {
//   const [result] = await client.textDetection(imagePath);
//   const detections = result.textAnnotations;
//   return detections?.[0]?.description || "";
// };

//  Option3 - AWS texttract // this one requires $1 for verification too :(

// import {
//   TextractClient,
//   DetectDocumentTextCommand,
// } from "@aws-sdk/client-textract";
// import { readFileSync } from "fs";

// const client = new TextractClient({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId: process.env.YOUR_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY!,
//   },
// });
// export const extractTextFromImage = async (
//   imagePath: string
// ): Promise<string> => {
//   const imageBytes = readFileSync(imagePath);
//   const command = new DetectDocumentTextCommand({
//     Document: { Bytes: imageBytes },
//   });

//   const response = await client.send(command);
//   const lines = response.Blocks?.filter((b) => b.BlockType === "LINE") ?? [];
//   return lines.map((line) => line.Text).join("\n");
// };
