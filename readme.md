# 🌌 Aura Flow Server

A highly polished, modern, full-stack server built with **TypeScript**, **Express**, and **MongoDB** (with automatic robust in-memory mock fallback) designed to support beautiful mindfulness boards, asset lists, and zen workspaces. 

This repository has been fully optimized for both local container runtimes and seamless **Vercel Serverless Function** deployments.

---

## 🛠️ Deployment Troubleshooting: What Was Fixed?

If you were experiencing deployment crashes or compile errors on Vercel previously, here is the clear technical root cause of the issues and exactly how they have been resolved:

### 1. TypeScript Version Specifier Bug 🐛
* **The Problem:** The `package.json` had `"typescript": "^7.0.2"` specified. Since TypeScript has not reached version 7 (current stable versions are 5.x), this invalid version specification caused the Vercel builder and the compiler to throw a fatal error: `Cannot read properties of undefined (reading 'readFile')`.
* **The Fix:** Downgraded and locked `typescript` to a stable production-ready release (`^5.5.3`) and aligned node type declarations to a stable version (`^20.14.9`), fixing the compilation engine.

### 2. Express Serverless Port Listening Conflict 🔌
* **The Problem:** The app call `app.listen(port)` was executing unconditionally. In a Vercel serverless environment, the runtime imports the handler and maps incoming requests dynamically. Forcing a custom `listen()` socket bind on an exact port breaks the request routing wrapper and causes the deployment to hang or timeout.
* **The Fix:** Configured a smart check `if (!process.env.VERCEL)` surrounding the socket initializer. The socket listener now opens *only* in physical host/container environments (such as Docker, Cloud Run, or your local machine) and steps aside gracefully in Vercel.

### 3. Invalid Route Mapping inside `vercel.json` 🗺️
* **The Problem:** The legacy `vercel.json` config lacked `@vercel/node` compilation instructions, meaning Vercel was serving the raw TypeScript files statically instead of compilation-parsing them via the serverless engine.
* **The Fix:** Rewrote `vercel.json` to configure the `@vercel/node` builder on `api/index.ts` and set up standard routing proxies to route all backend requests securely.

---

## 🚀 Step-by-Step Vercel Deployment Instructions

Follow these clear, step-by-step instructions to deploy this server to Vercel:

### 📥 Prerequisite: Install Vercel CLI
If you haven't already, install the official Vercel CLI globally:
```bash
npm install -g vercel
```

### Step 1: Connect & Authenticate
Navigate to this directory on your local machine and log in to your Vercel account:
```bash
vercel login
```

### Step 2: Initialize & Configure Project
Run the deployment wizard. It will detect the configuration automatically:
```bash
vercel
```
* **Set Up and Deploy?** `Yes`
* **Which scope?** (Select your personal workspace)
* **Link to existing project?** `No`
* **What's your project's name?** `aura-flow-server` (or your preferred name)
* **In which directory is your code located?** `./` (Press Enter)
* **Want to modify build settings?** `No` (Our `vercel.json` and `package.json` configurations handle this perfectly for you).

### Step 3: Add MongoDB Environment Variable
For secure, real database persistence, link your cloud MongoDB connection string inside Vercel:
```bash
vercel env add MONGODB_URI
```
* Enter your MongoDB connection string when prompted (e.g., `mongodb+srv://<user>:<password>@cluster.mongodb.net/auraflow`).
* *Note: If this variable is omitted, the server will gracefully fall back to its robust, fast, and fully synchronous in-memory Mock MongoDB database.*

### Step 4: Perform Production Deployment
Execute the final production build command:
```bash
vercel --prod
```
Once completed, Vercel will provide you with a production-ready deployment URL!

---

## ⚡ Local Development Instructions

To run this backend repository on your local computer:

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure local environment variables:**
   Create a `.env` file at the root of your project:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/auraflow
   ```
   *(If you don't have MongoDB installed locally, you can leave `MONGODB_URI` blank. The database will automatically launch in **Mock Mode** using elegant initial seed data so you can immediately begin development!)*

3. **Launch the live reloading development server:**
   ```bash
   npm run dev
   ```
   The backend will start listening at `http://localhost:3000`.

---

## 📡 API Reference: Checking and Testing Endpoints

Here are the endpoints you can call to query, insert, and manage zen asset data:

### 1. Root Handshake Health Check
Check if the server is alive and running correctly.
* **Endpoint:** `GET /`
* **Response:**
  ```text
  Hello World! Server is running.
  ```

---

### 2. Retrieve Items List
Fetches, searches, and filters products, guides, and templates. Includes pagination and complex sorting.
* **Endpoint:** `GET /api/items`
* **Query Parameters (Optional):**
  * `search` (string): Text filter on `name` or `description` (case-insensitive).
  * `maxPrice` (number): Max price threshold ceiling (default: `1000`).
  * `status` (string): Standard preset alias matching `"trending"` (High), `"new_release"` (Medium), or `"best_value"` (Low).
  * `sortBy` (string): Sorting order. Options: `"newest"` (default), `"oldest"`, `"price_low"`, `"price_high"`.
  * `categories` (comma-separated string): Filters list. (e.g. `categories=Mindfulness,Productivity`).
  * `userEmail` (string): Scopes results strictly to assets added by a specific email address.
  * `page` (number) & `limit` (number): Pagination control offsets.
* **Example curl Request:**
  ```bash
  curl "http://localhost:3000/api/items?limit=4&sortBy=price_high"
  ```
* **Example JSON Response:**
  ```json
  {
    "items": [
      {
        "_id": "64b0f792d4f8d9319e07dc02",
        "name": "Zen Productivity Board",
        "category": "Productivity",
        "description": "Keep your workspace clear and your objectives aligned.",
        "priority": "Medium",
        "price": 25,
        "imageUrl": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b",
        "userEmail": "minhaj00102@gmail.com",
        "date": "2026-07-15T12:00:00.000Z",
        "createdAt": "2026-07-15T12:00:00.000Z"
      }
    ],
    "total": 3,
    "pages": 1,
    "currentPage": 1
  }
  ```

---

### 3. Retrieve a Single Item
Fetch full detailed specifications of a specific item using its hexadecimal `_id`.
* **Endpoint:** `GET /api/items/:id`
* **Example curl Request:**
  ```bash
  curl http://localhost:3000/api/items/64b0f792d4f8d9319e07dc02
  ```

---

### 4. Create a New Item
Insert a beautiful new meditation asset, wallpaper, or productivity board.
* **Endpoint:** `POST /api/items`
* **Headers:** `Content-Type: application/json`
* **Payload Format:**
  ```json
  {
    "name": "Cosmic Meditation Soundscape",
    "category": "Mindfulness",
    "description": "Elegant and ethereal ambient audio loops crafted to promote deep focus.",
    "priority": "High",
    "price": 12,
    "imageUrl": "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5",
    "userEmail": "minhaj00102@gmail.com"
  }
  ```
* **Example curl Request:**
  ```bash
  curl -X POST http://localhost:3000/api/items \
    -H "Content-Type: application/json" \
    -d '{"name": "Ethereal Soundscape", "category": "Mindfulness", "description": "Atmospheric zen loops.", "priority": "High", "price": 12, "userEmail": "minhaj00102@gmail.com"}'
  ```

---

### 5. Delete an Item
Permanently remove an existing item asset from the database.
* **Endpoint:** `DELETE /api/items/:id`
* **Example curl Request:**
  ```bash
  curl -X DELETE http://localhost:3000/api/items/64b0f792d4f8d9319e07dc02
  ```

---

## 🏛️ License

This project is licensed under the MIT License. Feel free to modify and build upon it!
