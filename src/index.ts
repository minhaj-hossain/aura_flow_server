import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToMongoDB } from "./db";
import itemRoutes from "./routes/items";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔌 Hook up your items router
app.use("/api/items", itemRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! Server is running.");
});

// Bootstrapping function to handle startup correctly
async function startServer() {
  try {
    // 1. Core connection happens once right here
    await connectToMongoDB();

    // 2. Start listening to traffic
    if (process.env.NODE_ENV !== "production") {
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`🚀 Local dev server listening on port ${port}`);
      });
    }
  } catch (error) {
    console.error("❌ Server failed to start initialization:", error);
  }
}

startServer();

export default app;
