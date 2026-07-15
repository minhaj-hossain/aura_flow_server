import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

const uri = process.env.MONGODB_URI;

// In-memory array of items for mock fallback
const itemsStore: any[] = [];

// Seed some initial items for mock database
const seedItems = [
  {
    _id: new ObjectId(),
    name: "Aura Flow Meditation Guide",
    category: "Mindfulness",
    description:
      "An elegant, interactive guide designed to channel focus, reduce anxiety, and promote rhythmic deep breathing.",
    priority: "High",
    price: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    userEmail: "minhaj00102@gmail.com",
    date: new Date(),
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: "Zen Productivity Board",
    category: "Productivity",
    description:
      "Keep your workspace clear and your objectives aligned with this beautifully minimalist task workspace.",
    priority: "Medium",
    price: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80",
    userEmail: "minhaj00102@gmail.com",
    date: new Date(),
    createdAt: new Date(),
  },
  {
    _id: new ObjectId(),
    name: "Cosmic Horizon Wallpaper Pack",
    category: "Aesthetics",
    description:
      "High-resolution atmospheric digital designs inspired by minimalism, cosmic stardust, and elegant neon horizons.",
    priority: "Low",
    price: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    userEmail: "minhaj00102@gmail.com",
    date: new Date(),
    createdAt: new Date(),
  },
];

// Load seeds initially
itemsStore.push(...seedItems);

const mockCollection = {
  insertOne: async (item: any) => {
    const newItem = { ...item };
    if (!newItem._id) {
      newItem._id = new ObjectId();
    }
    itemsStore.push(newItem);
    return { insertedId: newItem._id };
  },
  find: (filter: any) => {
    let matched = [...itemsStore];

    if (filter.userEmail) {
      matched = matched.filter((item) => item.userEmail === filter.userEmail);
    }
    if (filter.price && typeof filter.price.$lte === "number") {
      matched = matched.filter((item) => item.price <= filter.price.$lte);
    }
    if (filter.$or) {
      const orFilters = filter.$or;
      matched = matched.filter((item) => {
        return orFilters.some((subFilter: any) => {
          const key = Object.keys(subFilter)[0];
          const queryObj = subFilter[key];
          const regexStr = queryObj.$regex;
          return new RegExp(regexStr, "i").test(item[key] || "");
        });
      });
    }
    if (filter.category) {
      if (filter.category.$in && Array.isArray(filter.category.$in)) {
        matched = matched.filter((item) => {
          return filter.category.$in.some((regex: RegExp) => {
            return regex.test(item.category || "");
          });
        });
      }
    }
    if (filter.priority) {
      const regexStr = filter.priority.$regex;
      const regex = new RegExp(regexStr, "i");
      matched = matched.filter((item) => regex.test(item.priority || ""));
    }

    // Cursor methods
    let sorted = matched;
    let skipVal = 0;
    let limitVal = matched.length;

    const cursor = {
      sort: (sortCondition: any) => {
        const key = Object.keys(sortCondition)[0];
        const direction = sortCondition[key]; // 1 or -1
        sorted = [...sorted].sort((a: any, b: any) => {
          let valA = a[key];
          let valB = b[key];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
          return 0;
        });
        return cursor;
      },
      skip: (skip: number) => {
        skipVal = skip;
        return cursor;
      },
      limit: (limit: number) => {
        limitVal = limit;
        return cursor;
      },
      toArray: async () => {
        return sorted.slice(skipVal, skipVal + limitVal);
      },
    };
    return cursor;
  },
  countDocuments: async (filter: any) => {
    let matched = [...itemsStore];
    if (filter.userEmail) {
      matched = matched.filter((item) => item.userEmail === filter.userEmail);
    }
    if (filter.price && typeof filter.price.$lte === "number") {
      matched = matched.filter((item) => item.price <= filter.price.$lte);
    }
    if (filter.$or) {
      const orFilters = filter.$or;
      matched = matched.filter((item) => {
        return orFilters.some((subFilter: any) => {
          const key = Object.keys(subFilter)[0];
          const queryObj = subFilter[key];
          const regexStr = queryObj.$regex;
          return new RegExp(regexStr, "i").test(item[key] || "");
        });
      });
    }
    if (filter.category) {
      if (filter.category.$in && Array.isArray(filter.category.$in)) {
        matched = matched.filter((item) => {
          return filter.category.$in.some((regex: RegExp) => {
            return regex.test(item.category || "");
          });
        });
      }
    }
    if (filter.priority) {
      const regexStr = filter.priority.$regex;
      const regex = new RegExp(regexStr, "i");
      matched = matched.filter((item) => regex.test(item.priority || ""));
    }
    return matched.length;
  },
  findOne: async (query: any) => {
    const idStr = query._id?.toString();
    return itemsStore.find((item) => item._id?.toString() === idStr) || null;
  },
  deleteOne: async (query: any) => {
    const idStr = query._id?.toString();
    const index = itemsStore.findIndex(
      (item) => item._id?.toString() === idStr,
    );
    if (index !== -1) {
      itemsStore.splice(index, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },
};

const mockDb = {
  collection: (name: string) => mockCollection,
};

const mockClient: any = {
  db: (name: string) => mockDb,
  connect: async () => {},
  close: async () => {},
};

// Check if we have a valid MongoDB connection string
const useRealClient = !!(uri && uri.startsWith("mongodb"));

export const client = (
  useRealClient ? new MongoClient(uri!) : mockClient
) as MongoClient;

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) return client;

  if (!useRealClient) {
    isConnected = true;
    console.warn(
      "🔌 [AI Studio] Falling back to robust in-memory Mock MongoDB database!",
    );
    return client;
  }

  try {
    await client.connect();
    isConnected = true;
    console.log("🔌 Connected to real MongoDB!");
    return client;
  } catch (err) {
    console.error(
      "❌ Failed to connect to MongoDB, falling back to mock:",
      err,
    );
    isConnected = true;
    // Fallback to mock on connection failure so the app doesn't crash
    (client as any).db = mockClient.db;
    return client;
  }
}

export async function disconnectFromMongoDB() {
  console.log("🧼 Cleaning up database connections...");
  if (useRealClient && isConnected) {
    await client.close();
  }
  isConnected = false;
}
