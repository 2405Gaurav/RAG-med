import express from "express";
import { uploadPdf } from "../controller/upload-pdf";
import pdfUpload from "../middleware/multer-config";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("PDF Route Working");
});

// Updated to handle multiple files with dynamic field names (pdf0, pdf1, pdf2, etc.)
router.post("/upload", pdfUpload.any(), uploadPdf);

export default router;