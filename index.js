import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";


const app = express();
const port = 5000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.CLIENT_URI,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     allowedHeaders: [
      "Content-Type",
      "x-internal-secret",
      "x-user-email",
      "x-user-name",
    ],
  })
);

app.use(express.json());



const client = new MongoClient(
  `mongodb://${process.env.MONGODB_URI}:${process.env.MONGODB_PASS}@ac-j4kujpk-shard-00-00.borlllh.mongodb.net:27017,ac-j4kujpk-shard-00-01.borlllh.mongodb.net:27017,ac-j4kujpk-shard-00-02.borlllh.mongodb.net:27017/?ssl=true&replicaSet=atlas-85iobn-shard-0&authSource=admin`,
);

async function ConnectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.log("MongoDB Connection Error:", error);
    process.exit(1);
  }
}

const mongodb = await ConnectToMongoDB();

const db = mongodb.db("Featured-Studios-Section");

const featuredCollection = db.collection("Featured");
const studiosCollections = db.collection("Studios");
const bookingsCollection = db.collection("booking");

// Home Route
app.get("/", (req, res) => {
  res.send("StudioSpace Server is running!");
});

// Featured Studios
app.get("/featured-studios", async (req, res) => {
  try {
    const result = await featuredCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Failed to fetch featured studios",
    });
  }
});

// All Studios + Category Filter + Owner Email Filter
app.get("/studios", async (req, res) => {
  try {
    const { category, ownerEmail } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (ownerEmail) filter.ownerEmail = ownerEmail;

    const result = await studiosCollections.find(filter).toArray();
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

    let result = await studiosCollections.findOne({ _id: id });

    if (!result) {
      result = await featuredCollection.findOne({ _id: id });
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
    console.error(error);

    res.status(500).send({
      message: "Failed to add studio!",
    });
  }
});


app.get("/studioForm", async (req, res) => {
  try {
    const result = await studiosCollections.find().toArray();

    res.status(200).send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Failed to fetch studios!",
    });
  }
});

app.get("/my-listings", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message: "Email is required",
      });
    }

    const result = await studiosCollections
      .find({ ownerEmail: email })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch listings",
    });
  }
})



/**
 * Ai
 */

app.delete("/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid Studio ID",
      });
    }

    const result = await studiosCollections.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Studio not found",
      });
    }

    res.send({
      success: true,
      message: "Studio deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to delete studio",
    });
  }
});


app.put("/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid Studio ID",
      });
    }

    delete updatedData._id;

    const result = await studiosCollections.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updatedData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Studio not found",
      });
    }

    res.send({
      success: true,
      message: "Studio updated successfully!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to update studio",
    });
  }
});


app.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;

    const result = await bookingsCollection.insertOne({
      ...bookingData,
      status: "Pending",
      bookingDate: new Date(),
    });

    res.status(201).send({
      success: true,
      message: "Booking successful!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Booking Error:", error);

    res.status(500).send({
      message: "Failed to create booking",
    });
  }
});


// Get Bookings
app.get("/bookings", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message: "Email is required",
      });
    }
    const result = await bookingsCollection
      .find({ userEmail: email })
      .sort({ bookingDate: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch bookings",
    });
  }
});

// Cancel Booking
app.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid booking ID",
      });
    }

    const result = await bookingsCollection.updateOne(
      {
        _id: new ObjectId(id),
        status: "Pending",
      },
      {
        $set: {
          status: "Cancelled",
          cancelledAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Pending booking not found",
      });
    }

    res.send({
      success: true,
      message: "Booking cancelled successfully!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to cancel booking",
    });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


export default app;

