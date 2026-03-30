const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://mongo:27017/cloudkitchen', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema
const OrderSchema = new mongoose.Schema({
    customerName: String,
    foodItem: String,
    quantity: Number
});

const Order = mongoose.model('Order', OrderSchema);

// API to place order
app.post('/order', async (req, res) => {
    const order = new Order(req.body);
    await order.save();
    res.send("Order placed successfully!");
});

// API to get all orders
app.get('/orders', async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});