import { Router, Request, Response } from "express";
import { client } from "../db";
import { ObjectId } from "mongodb";

const router = Router();

// Strict TypeScript interface for MongoDB data mapping
interface DbItem {
  name: string;
  category: string;
  description: string;
  priority: string;
  price: number;
  imageUrl?: string;
  userEmail: string;
  date: Date;
  createdAt: Date;
}

/**
 * 💾 1. POST: /api/items
 * Securely inserts a new template asset into MongoDB
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      category,
      description,
      priority,
      price,
      imageUrl,
      userEmail,
      date,
    } = req.body;

    if (!name?.trim() || !description?.trim() || !price || !userEmail?.trim()) {
      res.status(400).json({
        message:
          "Validation Error: Title, Description, Price, and User Email are required.",
      });
      return;
    }

    const db = client.db("auraflow");
    const collection = db.collection<DbItem>("items");

    const newItem: DbItem = {
      name: name.trim(),
      category: category || "Productivity",
      description: description.trim(),
      priority: priority || "Medium",
      price: Number(price),
      imageUrl: imageUrl?.trim() || undefined,
      userEmail: userEmail.trim(),
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newItem);

    res.status(201).json({
      message: "Success! Item securely saved to MongoDB.",
      itemId: result.insertedId,
    });
  } catch (error) {
    console.error("❌ MongoDB Insertion Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error while saving the item." });
  }
});

/**
 * 📊 2. GET: /api/items
 * Universally handles Homepage top previews (?limit=4) AND full Explore searches.
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const db = client.db("auraflow");
    const collection = db.collection<DbItem>("items");

    // 1. Extract query string values with dynamic structural fallbacks
    const search = req.query.search ? String(req.query.search).trim() : "";
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : 1000;
    const status = req.query.status ? String(req.query.status).trim() : "";
    const sortBy = req.query.sortBy
      ? String(req.query.sortBy).trim()
      : "newest";

    // Pagination & Limit handling (Defaults to 8, but dynamically updates to 4 for your Homepage)
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "8", 10);
    const skip = (page - 1) * limit;

    const userEmail = req.query.userEmail
      ? String(req.query.userEmail).trim()
      : "";

    // 2. Build the MongoDB Filter Query
    const filter: any = {};

    if (userEmail) {
      filter.userEmail = userEmail;
    }

    // Apply upper bound pricing ceiling
    filter.price = { $lte: maxPrice };

    // Text search query index
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Multi-select category processing
    if (req.query.categories) {
      const rawCategories = String(req.query.categories)
        .split(",")
        .filter(Boolean);
      const regexCategories = rawCategories.map((cat) => {
        const formatted = cat.replace(/_/g, " ");
        return new RegExp(`^${formatted}$`, "i");
      });

      if (regexCategories.length > 0) {
        filter.category = { $in: regexCategories };
      }
    }

    // Priority to status mapping conversion rules
    if (status) {
      const priorityMapping: Record<string, string> = {
        trending: "High",
        new_release: "Medium",
        best_value: "Low",
      };
      const targetPriority = priorityMapping[status.toLowerCase()] || status;
      filter.priority = { $regex: `^${targetPriority}$`, $options: "i" };
    }

    // 3. Map Sorting Directives
    let sortCondition: any = { createdAt: -1 }; // Default: Newest First
    if (sortBy === "oldest") sortCondition = { createdAt: 1 };
    if (sortBy === "price_low") sortCondition = { price: 1 };
    if (sortBy === "price_high") sortCondition = { price: -1 };

    // 4. Concurrently run DB records retrieval and overall counts
    const [rawItems, totalItems] = await Promise.all([
      collection
        .find(filter)
        .sort(sortCondition)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // 5. Structure Normalization Layer (Aligns database layout directly to frontend properties)
    const templates = rawItems.map((item: any) => ({
      id: item._id?.toString() || Math.random().toString(),
      title: item.name || "Untitled Template",
      description: item.description || "No description provided.",
      category: item.category || "General",
      status: item.priority ? String(item.priority).toLowerCase() : "medium",
      price: typeof item.price === "number" ? item.price : 0,
      imageUrl:
        item.imageUrl ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      date: item.date || item.createdAt || new Date(),
    }));

    // Output unified paginated payload structural format
    res.status(200).json({
      templates,
      page,
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error("❌ MongoDB Global Fetch Pipeline Error:", error);
    res.status(500).json({
      message:
        "Internal server error while running database asset query logic.",
    });
  }
});

/**
 * 🔍 GET: /api/items/:id
 * Fetches a single template entity by its Hexadecimal database ID string
 */
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Validate if the incoming string is a standard 24-character hexadecimal ObjectId
    if (!ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ message: "Invalid template asset tracking ID format." });
      return;
    }

    const db = client.db("auraflow");
    const collection = db.collection("items");

    // 2. Query document from DB
    const item = await collection.findOne({ _id: new ObjectId(id) });

    if (!item) {
      res
        .status(404)
        .json({ message: "Requested asset template could not be located." });
      return;
    }

    // 3. Structure Normalization Layer (Converts DB fields cleanly for the UI)
    const normalizedTemplate = {
      id: item._id.toString(),
      title: item.name || "Untitled Asset",
      description: item.description || "No overview documentation provided.",
      category: item.category || "General",
      status: item.priority ? String(item.priority).toLowerCase() : "medium",
      price: typeof item.price === "number" ? item.price : 0,
      imageUrl:
        item.imageUrl ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      date: item.date || item.createdAt || new Date(),
      // Adding extra simulated assets to populate the image gallery natively
      gallery: [
        item.imageUrl ||
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      ],
    };

    res.status(200).json(normalizedTemplate);
  } catch (error) {
    console.error("❌ Single Asset Retrieval Pipeline Failed:", error);
    res
      .status(500)
      .json({
        message: "Internal server error reading template record details.",
      });
  }
});

export default router;
