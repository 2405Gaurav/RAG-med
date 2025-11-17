import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Request, Response } from "express";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const embedder = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY,
});

export const ChatWithPdf = async (req: Request, res: Response) => {
  try {
    const { query, collectionName } = req.body;

    if (!query || !collectionName) {
      res.status(400).json({ error: "Query and collection name are required" });
      return;
    }

    const vectorStore = new QdrantVectorStore(embedder, {
      url: process.env.QDRANT_URL,
      collectionName,
    });

    const results = await vectorStore.similaritySearch(query);

    if (!results || results.length === 0) {
      res.status(404).json({ error: "No relevant content found in PDF" });
      return;
    }

    const context = results.map(doc => doc.pageContent).join("\n\n");

    const systemPrompt = `You are a helpful assistant that can answer questions from the provided context.\nContext:\n${context}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [query],
      config: { systemInstruction: systemPrompt },
    });

    const textResponse = response.text || "No response generated";

    res.status(200).json({
      message: "Chat completed successfully",
      response: textResponse,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Error processing PDF:", errMsg);
    res.status(500).json({ error: "Failed to process PDF", details: errMsg });
  }
};