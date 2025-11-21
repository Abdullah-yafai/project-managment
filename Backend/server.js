import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import orgRoutes from "./routes/Org.routes.js";
import departRoutes from "./routes/Depart.routes.js";

dotenv.config()

const app = express();

// after deployment cors issue solution
const allowedOrigins = [
  // "https://ai-task-manager-beta.vercel.app",
  "http://localhost:5173"
];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));

// routes
app.use("/api/auth", authRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/org", orgRoutes)
app.use("/api/depart", departRoutes)

// DB Connection



mongoose.connect(process.env.MONGODBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // wait max 5s
  socketTimeoutMS: 45000, // keep alive 45s
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

  app.get("/", (req, res) => res.send("AI Content Planner Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on ${PORT}`));