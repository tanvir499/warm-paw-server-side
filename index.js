const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = 3000;
  
const app = express();
app.use(cors());
app.use(express.json())



const uri = "mongodb+srv://missionscic:mKOTBOZ0oy9aWI8P@cluster0.1zpt75e.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('petService');
    const petServices = database.collection('services');
    const orderCollections = database.collection('orders');

    // post or save service to DB
    app.post('/services', async(req,res)=>{
      const data = req.body;
      const date = new Date();
      data.createdAt = date;
      console.log(data);
      const result = await petServices.insertOne(data);
      res.send(result);
    })
  