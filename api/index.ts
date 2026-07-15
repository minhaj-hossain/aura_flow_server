import express, { Request, Response, NextFunction } from "express"; // 👈 STEP 1: Added NextFunction for serverless middleware
import cors from "cors";
import dotenv from "dotenv";
import { connectToMongoDB } from "../src/db"; // 👈 Updated path
import itemRoutes from "../src/routes/items";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// =========================================================================
// 🔌 STEP 2: VERCEL DATABASE MIDDLEWARE (ACTIVE)
// This guarantees MongoDB is connected before any serverless function processes a request.
// =========================================================================
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error(
      "❌ Database connection error during request handling:",
      error,
    );
    res
      .status(500)
      .json({ error: "Internal Server Error: Database Connection Failed" });
  }
});

// 🔌 Hook up your items router
app.use("/api/items", itemRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! Server is running.");
});

// =========================================================================
// 🚀 STEP 3: ENVIRONMENT PORT LISTENER
// Binds to host 0.0.0.0 on port 3000 for proper container ingress.
// Only runs if NOT on Vercel, to prevent serverless execution port binding issues.
// =========================================================================
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(Number(port), "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${port} (0.0.0.0)`);
  });
}

// =========================================================================
// 🏠 STEP 4: LOCAL DEVELOPMENT BOOTSTRAP (COMMENTED OUT FOR VERCEL)
// Uncomment this whole block (and comment out STEP 2 above) to run locally.
// =========================================================================
/*
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
*/

export default app;
