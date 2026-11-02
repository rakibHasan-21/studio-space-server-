import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());


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
const bookingsCollection = db.collection('booking')

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

// app.get("/studioForm/:slug", async (req, res) => {
//   try {
//     const { slug } = req.params;
//     const results = await studiosCollections.findOne({
//       _id: new ObjectId(slug),
//     });
//     res.status(200).send(results);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: "Failed to fetch studio details",
//     });
//   }
// });


// bookingmodal

app.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;

    const result = await bookingsCollection.insertOne({
      ...bookingData,
      bookingDate: bookingData.bookingDate,
      status: "Pending",
      createdAt: new Date(),
    });
    res.status(201).send({
      success: true,
      message: "Booking successful",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to create booking",
    });
  }
});

app.get("/bookings", async (req, res) => {
  try {
    const result = await bookingsCollection
      .find()
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch bookings",
    });
  }
});

// Get logged-in user's studios
app.get("/my-listings", async (req, res) => {
  try {
    const email = req.query.email;

    const result = await studiosCollections
      .find({ ownerEmail: email })
      .toArray();

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch listings",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
