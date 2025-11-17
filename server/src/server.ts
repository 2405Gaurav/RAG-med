import dotenv from "dotenv";
dotenv.config();
import express from "express";
import pdfRouter from "./router/pdf-router";
import chatRouter from "./router/chat-router";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

app.use("/api/pdf", pdfRouter);
app.use("/api/chat", chatRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`http://localhost:${port}`);
});
