import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Request, Response } from "express";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const embedder = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: process.env.GEMINI_API_KEY,
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export const uploadPdf = async (req: Request, res: Response) => {
  const tempFilePaths: string[] = [];

  try {
    // Check if files were uploaded
    const files = req.files as Express.Multer.File[] | undefined;
    
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No PDF files uploaded" });
      return;
    }

    // Extract additional form fields
    const { patientName, reportType, duration } = req.body;

    // Generate a unique collection name for this upload session
    const collectionName = `medical-reports-${crypto.randomUUID()}`;

    const client = new QdrantClient({ url: "http://localhost:6333" });

    // Check if collection exists and delete it
    const collectionExists = await client.collectionExists(collectionName);
    if (collectionExists) {
      await client.deleteCollection(collectionName);
    }

    let allSplitDocs: any[] = [];

    // Process each PDF file
    for (const file of files) {
      const pdfBuffer = file.buffer;
      const tempFileName = `${crypto.randomUUID()}.pdf`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);
      
      tempFilePaths.push(tempFilePath);

      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Load PDF
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();

      // Add metadata to documents
      docs.forEach(doc => {
        doc.metadata = {
          ...doc.metadata,
          fileName: file.originalname,
          patientName: patientName || "Unknown",
          reportType: reportType || "General",
          duration: duration || "Not specified",
          uploadDate: new Date().toISOString(),
        };
      });

      // Split documents
      const splitDocs = await textSplitter.splitDocuments(docs);
      allSplitDocs = allSplitDocs.concat(splitDocs);
    }

    // Store all documents in Qdrant
    await QdrantVectorStore.fromDocuments(allSplitDocs, embedder, {
      url: "http://localhost:6333",
      collectionName: collectionName,
    });

    res.status(200).json({
      message: `${files.length} PDF file(s) processed successfully`,
      collectionName: collectionName,
      filesProcessed: files.map(f => f.originalname),
      metadata: {
        patientName: patientName || "Not provided",
        reportType: reportType || "Not provided",
        duration: duration || "Not provided",
      },
      totalChunks: allSplitDocs.length,
    });

  } catch (error: any) {
    console.error("Error processing PDFs:", error?.stack || error?.message || error);
    res.status(500).json({ 
      error: "Failed to process PDF files", 
      details: error?.message 
    });
  } finally {
    // Clean up all temp files
    tempFilePaths.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error(`Failed to delete temp file ${filePath}:`, cleanupError);
        }
      }
    });
  }
};