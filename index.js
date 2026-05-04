const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

const admin = require("firebase-admin");

const decoded = Buffer.from(
  process.env.FIREBASE_SERVICE_KEY,
  "base64",
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

// ✅ Guard against re-initialization in serverless environments
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is live");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrup6i8.mongodb.net/smartDealsDB?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const smartDealsDB = client.db("smartDealsDB");
    const productsCollection = smartDealsDB.collection("products");
    const bidsCollection = smartDealsDB.collection("bids");

    const verifyToken = async (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      try {
        const userInfo = await admin.auth().verifyIdToken(token);
        req.user = userInfo;
        next();
      } catch (error) {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };

    // ─── Products ─────────────────────────────────────────────

    // ✅ No email → public (all products)
    // ✅ Has email → token required, can only access own products
    app.get("/products", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        try {
          const result = await productsCollection.find().toArray();
          return res.send(result);
        } catch {
          return res.status(500).send({ error: "Failed to fetch products" });
        }
      }

      // Email provided — verify token and ownership
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
      }

      try {
        const userInfo = await admin.auth().verifyIdToken(token);
        if (userInfo.email !== email) {
          return res.status(403).send({ message: "Forbidden" });
        }
        const result = await productsCollection
          .find({ sellerEmail: email })
          .toArray();
        return res.send(result);
      } catch {
        return res.status(403).send({ message: "Forbidden" });
      }
    });

    // ✅ Must be BEFORE /products/:productId to avoid route conflict
    app.get("/latest-products", async (req, res) => {
      try {
        const result = await productsCollection
          .find()
          .sort({ created_at: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to fetch latest products" });
      }
    });

    // ✅ Must be BEFORE /products/:productId to avoid route conflict
    app.get("/products/search", async (req, res) => {
      try {
        const searchText = req.query.q;
        if (!searchText) return res.send([]);

        const query = {
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
            { location: { $regex: searchText, $options: "i" } },
            { condition: { $regex: searchText, $options: "i" } },
          ],
        };

        const result = await productsCollection
          .find(query)
          .sort({ created_at: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ error: "Search failed" });
      }
    });

    app.get("/products/:productId", async (req, res) => {
      try {
        const result = await productsCollection.findOne({
          _id: new ObjectId(req.params.productId),
        });
        if (!result)
          return res.status(404).send({ message: "Product not found" });
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to fetch product" });
      }
    });

    app.post("/products", async (req, res) => {
      try {
        const result = await productsCollection.insertOne(req.body);
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to add product" });
      }
    });

    app.delete("/products/:productId", async (req, res) => {
      try {
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(req.params.productId),
        });
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to delete product" });
      }
    });

    app.patch("/products/:productId", async (req, res) => {
      try {
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(req.params.productId) },
          { $set: req.body },
        );
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to update product" });
      }
    });

    // ─── Bids ──────────────────────────────────────────────────

    app.post("/bids", async (req, res) => {
      try {
        const result = await bidsCollection.insertOne(req.body);
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to place bid" });
      }
    });

    // ✅ Fixed: require email, prevent fetching all bids without it
    app.get("/bids", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        return res
          .status(400)
          .send({ message: "Email query param is required" });
      }

      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden" });
      }

      try {
        const result = await bidsCollection
          .find({ buyerEmail: email })
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to fetch bids" });
      }
    });

    app.get("/product/bids/:productId", async (req, res) => {
      try {
        const result = await bidsCollection
          .find({ product_id: req.params.productId })
          .sort({ created_at: -1 })
          .toArray();
        res.send(result);
      } catch {
        res.status(500).send({ error: "Failed to fetch bids for product" });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}

run().catch(console.dir);

// ✅ Required for Vercel — do not use app.listen
module.exports = app;
