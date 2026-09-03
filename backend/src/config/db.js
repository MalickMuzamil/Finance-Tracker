const mongoose = require('mongoose');
const { mongoUri } = require('./env');
async function connectDB(){ if(!mongoUri) throw new Error('MONGODB_URI is required'); await mongoose.connect(mongoUri); console.log('MongoDB connected'); }
module.exports = connectDB;
