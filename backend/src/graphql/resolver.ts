import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromImage } from "../ocr/ocr";
import { parseReceiptText } from "../ocr/parser";
import GraphQLUpload = require("graphql-upload");

export const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    receipts: async (_: any, args: any, context: any) => {
      const { prisma } = context;
      const where: any = {};
      if (args.storeName) where.storeName = args.storeName;
      if (args.from || args.to) where.purchaseDate = {};
      if (args.from) where.purchaseDate.gte = new Date(args.from);
      if (args.to) where.purchaseDate.lte = new Date(args.to);
      return prisma.receipt.findMany({ where, include: { items: true } });
    },
  },
  Mutation: {
    uploadReceipt: async (_: any, { file }: any, context: any) => {
      const actualFile = await file.promise;
      const { createReadStream, filename, mimetype } = await actualFile;
      const { prisma } = context;
      if (!["image/jpeg", "image/png"].includes(mimetype)) {
        return { success: false, message: "Invalid file type" };
      }

      const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const imageId = uuidv4();
      const filePath = path.join(uploadDir, imageId + path.extname(filename));
      const stream = createReadStream();
      try {
        await new Promise((resolve, reject) =>
          stream
            .pipe(fs.createWriteStream(filePath))
            .on("finish", resolve)
            .on("error", reject)
        );

        const text = await extractTextFromImage(filePath);
        const parsed = parseReceiptText(text);
        const receipt = await prisma.receipt.create({
          data: {
            storeName: parsed.storeName,
            purchaseDate: parsed.purchaseDate,
            totalAmount: parsed.totalAmount,
            imageUrl: filePath,
            items: {
              create: parsed.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        return {
          success: true,
          message: "Receipt processed successfully",
          receipt,
        };
      } catch (err) {
        console.error("❌ Error during file save or parsing:", err);
        return {
          success: false,
          message: "Failed to process uploaded receipt",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  },
};
