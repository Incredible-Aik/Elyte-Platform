const mongoose = require('mongoose');

const dbConfig = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/elyte-platform-dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  test: {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/elyte-platform-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    }
  }
};

const connectDB = async () => {
  try {
    const env = process.env.NODE_ENV || 'development';
    const config = dbConfig[env];
    
    if (!config) {
      throw new Error(`Database configuration not found for environment: ${env}`);
    }

    console.log(`Connecting to MongoDB (${env})...`);
    
    const conn = await mongoose.connect(config.uri, config.options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    return conn;
    
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  dbConfig
};