const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = 3000;
  
const app = express();
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1zpt75e.mongodb.net/?appName=Cluster0`;

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
    // await client.connect();
    
    const database = client.db('petService');
    const UserCollections = database.collection('users');
    const petServices = database.collection('services');
    const orderCollections = database.collection('orders');
 
    // আপনার server.js ফাইলে এই endpoints যোগ করুন:

// Dashboard stats API
app.get('/dashboard/stats', async(req, res) => {
  try {
    const totalListings = await petServices.countDocuments();
    const totalOrders = await orderCollections.countDocuments();
    
    // Calculate total revenue from orders
    const allOrders = await orderCollections.find().toArray();
    const totalRevenue = allOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.price) || 0) * (parseInt(order.quantity) || 1);
    }, 0);

    // Active users (unique buyers from orders)
    const uniqueBuyers = [...new Set(allOrders.map(order => order.buyerEmail))];
    const activeUsers = uniqueBuyers.length;

    res.send({
      totalListings,
      totalOrders,
      totalRevenue,
      activeUsers
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Monthly orders data
app.get('/dashboard/monthly-orders', async(req, res) => {
  try {
    const allOrders = await orderCollections.find().toArray();
    
    // Create month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize data for last 6 months
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];
      
      last6Months.push({
        month: monthName,
        orders: 0,
        revenue: 0,
        monthIndex: date.getMonth()
      });
    }

    // Count orders and revenue for each month
    allOrders.forEach(order => {
      if (order.date) {
        const orderDate = new Date(order.date);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
        
        // Find the month in our array
        const monthData = last6Months.find(m => 
          m.monthIndex === orderDate.getMonth() && 
          orderDate.getFullYear() === today.getFullYear()
        );
        
        if (monthData) {
          monthData.orders += 1;
          monthData.revenue += (parseFloat(order.price) || 0) * (parseInt(order.quantity) || 1);
        }
      }
    });
    
    res.send(last6Months);
  } catch (error) {
    console.error('Error fetching monthly orders:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Category distribution
app.get('/dashboard/category-stats', async(req, res) => {
  try {
    const services = await petServices.find().toArray();
    
    // Count services by category
    const categoryCount = {};
    services.forEach(service => {
      const category = service.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Convert to array format
    const result = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
    
    res.send(result);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Recent orders (last 10)
app.get('/dashboard/recent-orders', async(req, res) => {
  try {
    const recentOrders = await orderCollections
      .find()
      .sort({ date: -1 })
      .limit(10)
      .toArray();
    
    res.send(recentOrders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// User statistics
app.get('/dashboard/user-stats', async(req, res) => {
  try {
    const totalUsers = await UserCollections.countDocuments();
    const users = await UserCollections.find().toArray();
    
    // Count users by registration month
    const userByMonth = {};
    users.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const month = date.toLocaleString('default', { month: 'short' });
        userByMonth[month] = (userByMonth[month] || 0) + 1;
      }
    });
    
    res.send({
      totalUsers,
      userByMonth: Object.entries(userByMonth).map(([month, count]) => ({ month, count }))
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});



    //  add user to db
    app.post('/users',async(req,res)=>{
         const user = req.body
         const date = new Date()
         user.createAt = date
         const result = await UserCollections.insertOne(user)
         res.send(result)
        })

    // post or save service to DB
    app.post('/services', async(req,res)=>{
      const data = req.body;
      const date = new Date();
      data.createdAt = date;
      console.log(data);
      const result = await petServices.insertOne(data);
      res.send(result);
    })
    // get services from DB
    app.get('/services', async(req, res)=>{
      const {category} = req.query;
      console.log(category);
      const query = {}
      if(category){
        query.category = category;
      }
      const result = await petServices.find(query).toArray();
      res.send(result);
    })

     app.get('/services/:id', async(req,res)=>{
      const id = req.params
      console.log(id);
      
      const query = {_id: new ObjectId(id)}
      const result = await petServices.findOne(query);
      res.send(result);

     })
     //for my services part
     app.get('/my-services', async(req,res)=>{
      const{email} = req.query;
      const query = {
        email: email
      }; //filter by email
      const result = await petServices.find(query).toArray();
      res.send(result);
     })

     //update service
     app.put('/update/:id', async(req,res)=>{
       const data = req.body;
       const id = req.params
       const query = {_id: new ObjectId(id)}
       
       const updateServices = {
         $set: data
       }
       const result = await petServices.updateOne(query, updateServices);
       res.send(result);      
     })

     //delete service
     app.delete('/delete/:id', async(req,res)=>{
        const id = req.params
        const query = {_id: new ObjectId(id)}
        const result = await petServices.deleteOne(query);
        res.send(result);
     })
      //order collection api
     app.post('/orders', async(req,res)=>{
        const data = req.body
        console.log(data);
        const result = await orderCollections.insertOne(data);
        res.status(201).send(result);
     })
     
     //for my orders page
     app.get('/orders', async(req,res)=>{
        const result = await orderCollections.find().toArray();
        res.status(200).send(result);
     })



    //npm i mongodb express cors dotenv
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('Hello, Developers')
})

app.listen(port, ()=>{
    console.log(`server is running on ${port}`);
})