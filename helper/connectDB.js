const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

console.log('the db connection',process.env.MONGO_URL)

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process if connection fails
  }
};

module.exports = connectDB;
