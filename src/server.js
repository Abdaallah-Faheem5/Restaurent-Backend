const express = require('express');
const cors = require('cors');
const authRoutes = require('./routers/auth.routes.js');
const menuRoutes = require('./routers/menu.routes.js');
const orderController = require('./routers/order.routes.js');
const tableRoutes = require('./routers/table.routes.js');
const mongoose = require("mongoose");
require('dotenv').config();
  const Taple = require('./model/taple.model.js');
const DB = process.env.DBConnection;
const port = process.env.port;
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/api/table', tableRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderController);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB);

    console.log(`MongoDB Connected:`);
  } catch (error) {
    console.error("Database connection failed");
    console.error(error.message);
    process.exit(1);
  }
}
    const CreatTable = async ()=>{
    const CT = await Taple.create({
        tableNumber: 4,
        capacity: 8
    });
}
// CreatTable();
connectDB();

app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });





