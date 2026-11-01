import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());



// Internal API protection
const verifyInternalApi = (req, res, next) => {
  if (
    req.headers["x-internal-api-key"] !==
    process.env.INTERNAL_API_KEY
  ) {
    return res.status(401).send({
      message: "Unauthorized access",
    });
  }

  next();
};


const client = new MongoClient(
  `mongodb://${process.env.MONGODB_URI}:${process.env.MONGODB_PASS}@ac-j4kujpk-shard-00-00.borlllh.mongodb.net:27017,ac-j4kujpk-shard-00-01.borlllh.mongodb.net:27017,ac-j4kujpk-shard-00-02.borlllh.mongodb.net:27017/?ssl=true&replicaSet=atlas-85iobn-shard-0&authSource=admin`,
);

async function ConnectToMongoDB() {
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongodb = await ConnectToMongoDB();
const db = mongodb.db("Featured-Studios-Section");
const featuredCollection = db.collection("Featured");
const studiosCollections = db.collection("Studios");

// console.log(featuredCollection)

app.get("/", (req, res) => {
  res.send("StudioSpace Server is running!");
});
app.get("/featured-studios", async (req, res) => {
  try {
    const result = await featuredCollection.find().toArray();
    res.send(result);
  } catch (err) {
    console.dir(err);
    res.send({
      message: "Failed to fetch featured studios",
    });
  }
});
app.get("/studios", async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category } : {};

    const result = await studiosCollections
      .find(filter)
      .toArray();

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Failed to fetch studios",
    });
  }
});
// Studio Details

app.get("/studios/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!ObjectId.isValid(slug)) {
      return res.status(400).send({
        message: "Invalid studio ID",
      });
    }

    const id = new ObjectId(slug);

    // Search in Studios collection
    let result = await studiosCollections.findOne({
      _id: id,
    });

    if (!result) {
      result = await featuredCollection.findOne({
        _id: id,
      });
    }

    if (!result) {
      return res.status(404).send({
        message: "Studio not found",
      });
    }

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Failed to fetch studio details",
    });
  }
});


// POST 
app.post("/studioForm", async (req, res) => {
  try {
    const studioData = req.body;

    const result = await studiosCollections.insertOne({
      ...studioData,
      createdAt: new Date(),
    });

    res.status(201).send({
      success: true,
      message: "Studio added successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Failed to add studio!" });
  }
});

// GET - Get 
app.get("/studioForm", async (req, res) => {
  try {
    const result = await studiosCollections.find().toArray();
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Failed to fetch studios!" });
  }
});

app.get("/studioForm/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const results = await studiosCollections.findOne({
      _id: new ObjectId(slug),
    });
    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Failed to fetch studio details",
    });
  }
});


// my -lisitings

app.get("/my-listings/:email",verifyInternalApi, async (req, res) => {
  const email = req.params.email;

  const result = await studiosCollections
    .find({ ownerEmail: email })
    .sort({ createdAt: -1 })
    .toArray();

  console.log(result);
  res.send(result);
});
// delete

app.delete("/studios/:id", verifyInternalApi, async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerEmail } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid studio ID",
      });
    }

    if (!ownerEmail) {
      return res.status(400).send({
        message: "Owner email is required",
      });
    }

    const result = await studiosCollections.deleteOne({
      _id: new ObjectId(id),
      ownerEmail: ownerEmail,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Studio not found or unauthorized",
      });
    }

    res.send({
      message: "Studio deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to delete studio",
    });
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
