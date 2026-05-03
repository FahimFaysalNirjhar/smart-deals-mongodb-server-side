const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is live");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrup6i8.mongodb.net/yourDBName?retryWrites=true&w=majority`;

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

    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latest-products", async (req, res) => {
      const cursor = productsCollection
        .find()
        .sort({
          created_at: -1,
        })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products/search", async (req, res) => {
      try {
        const searchText = req.query.q;
        if (!searchText) {
          return res.send([]);
        }
        const query = {
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
            { location: { $regex: searchText, $options: "i" } },
            { condition: { $regex: searchText, $options: "i" } },
          ],
        };

        const cursor = productsCollection
          .find(query)
          .sort({
            created_at: -1,
          })
          .limit(6);
        const result = await cursor.toArray();
        res.send(result);
      } catch {
        res.status(501).send({ error: "Search failed" });
      }
    });

    app.get("/products/:productId", async (req, res) => {
      const id = req.params.productId;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    app.delete("/products/:productId", async (req, res) => {
      const product_id = req.params.productId;
      const query = { _id: new ObjectId(product_id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/products/:productId", async (req, res) => {
      const id = req.params.productId;
      const updateProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updateProduct,
      };
      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    app.get("/bids", verifyToken, async (req, res) => {
      const email = req.query.email;

      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden" });
      }

      const query = email ? { buyerEmail: email } : {};
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.sellerEmail = email;
      }
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/product/bids/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = {
        product_id: productId,
      };
      const cursor = bidsCollection.find(query).sort({ created_at: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
