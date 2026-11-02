import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import projectRoutes from "./routes/projectRoutes";

dotenv.config();

const app = express();
const allowedOrigins = [process.env.CLIENT_URL ?? "http://localhost:3000"];
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://127.0.0.1:3000");
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Circuit Designer API is running" });
});

app.get("/health", (_req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "OK" : "DEGRADED",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/projects", projectRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({ message: "An unexpected API error occurred." });
});

const port = Number(process.env.PORT ?? 8000);
const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

async function startServer() {
  if (!mongoUri) {
    throw new Error("Set MONGODB_URI or MONGO_URI to start project persistence.");
  }
  await connectDB(mongoUri);
  app.listen(port, () => {
    console.log(`Circuit Designer API listening on port ${port}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error("Could not start the Circuit Designer API:", error);
  process.exitCode = 1;
});
