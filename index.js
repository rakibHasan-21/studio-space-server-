import express from "express";
import { MongoClient } from "mongodb";
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
const mongodb = await ConnectToMongoDB()
const db = mongodb.db('Featured-Studios-Section')
const featuredCollection = db.collection('Featured')

console.log(featuredCollection)

app.get("/", (req, res) => {
  res.send("StudioSpace Server is running!");
});
app.get('/featured-studios',async (req, res) =>{
    try{
        const result = await featuredCollection.find().toArray()
        res.send(result)
    }catch(err){
        console.dir(err)
        res.send({
      message: "Failed to fetch featured studios",
    });
    }
})


app.get("/studios", async (req, res) => {
  try {
    const category = req.query.category;

    let result;

    if (category) {
      result = await featuredCollection
        .find({ category: category })
        .toArray();
    } else {
      result = await featuredCollection
        .find()
        .toArray();
    }

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Failed to fetch studios",
    });
  }
});





app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});