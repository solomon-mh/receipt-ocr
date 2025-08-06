import Tesseract from "tesseract.js";

export const extractTextFromImage = async (
  imagePath: string
): Promise<string> => {
  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, "eng");
  return text;
};
