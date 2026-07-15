import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

const uri = process.env.MONGODB_URI;

// Safe Guard: If your .env key name is mistyped, this stops the server
if (!uri) {
  console.error(
    "❌ ERROR: MONGODB_URI is undefined! Check your .env file key name.",
  );
  process.exit(1);
}

export const client = new MongoClient(uri);

let isConnected = false;

export async function connectToMongoDB() {
  // If already connected, reuse it (critical for performance and deployment)
  if (isConnected) return client;

  try {
    await client.connect();
    isConnected = true;
    console.log("🔌 You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);

    // =========================================================================
    // 🔌 STEP 1: CHOOSE FAILURE BEHAVIOR (VERCEL MODE ACTIVE)
    // =========================================================================

    /* 👉 CHOICE A: VERCEL PRODUCTION BEHAVIOR (ACTIVE FOR DEPLOYMENT) */
    throw err; // Safe for Serverless, allows Vercel to retry connections on subsequent requests

    /* 👉 CHOICE B: LOCAL DEV BEHAVIOR (COMMENTED OUT FOR VERCEL) */
    // process.exit(1); // Force-crashes your local server terminal so you know it failed instantly
  }
}

export async function disconnectFromMongoDB() {
  console.log("🧼 Cleaning up database connections...");
  await client.close();
  isConnected = false;
}
