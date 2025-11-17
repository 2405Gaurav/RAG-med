import express from "express";
import { ChatWithPdf } from "../controller/chat";

const router = express.Router();

router.post("/", ChatWithPdf);

export default router;
