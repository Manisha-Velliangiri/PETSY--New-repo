// Initializing all dependencies and modules
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

// Middleware to pass requests automatically through JSON
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb+srv://manisha:dbusermanisha7@petsy.gipdnth.mongodb.net/?retryWrites=true&w=majority&appName=petsy");

// Serve static files from 'upload/images' folder
app.use('/images', express.static('upload/images'));

// API to add products in DB
// Creating image storage using multer
const storage = multer.diskStorage({
  destination: './upload/images', // Save images in 'upload/images' folder
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}_${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Endpoint to upload images
app.post("/upload", upload.single('product'), (req, res) => {
  const baseURL = 'https://petsy-new-repo.onrender.com';  // Static base URL for live backend
  
  res.json({
    success: 1,
    image_url: `${baseURL}/images/${req.file.filename}`
  });
});

// Schema for Product
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// Endpoint to add product
app.post('/addproduct', async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product = products.slice(-1)[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,  // Image URL now passed correctly
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });

  await product.save();
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Endpoint for deleting products
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({
    success: true,
    name: req.body.name
  });
});

// Endpoint for getting all products
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({});
  res.send(products);
});

// User model schema
const Users = mongoose.model('Users', {
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

// Endpoint for user signup
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, errors: "Existing user found with same email address" });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();
  const data = { user: { id: user.id } };
  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});

// Endpoint for user login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = req.body.password == user.password;
    if (passCompare) {
      const data = { user: { id: user.id } };
      const token = jwt.sign(data, 'secret_ecom');
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email Id" });
  }
});

// Middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res.status(401).send({ errors: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, 'secret_ecom');
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

// Endpoint for adding products to cart
app.post('/addtocart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// Endpoint for removing products from cart
app.post('/removefromcart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// Endpoint to get cart data
app.post('/getcart', fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

// API creation for listening on the specified port
app.listen(process.env.PORT || 4000, (error) => {
  if (!error) {
    console.log("Server running");
  } else {
    console.log("Error: " + error);
  }
});
