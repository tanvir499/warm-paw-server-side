const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = 3000;
  
const app = express();
app.use(cors());
app.use(express.json())



const uri = "mongodb+srv://missionscic:mKOTBOZ0oy9aWI8P@cluster0.1zpt75e.mongodb.net/?appName=Cluster0";
