require('dotenv').config();
const { connect, mongoose } = require('./db/mongoose');

(async () => {
  try {
    await connect();
    console.log('MongoDB connection test successful');
    await mongoose.connection.close();
  } catch (err) {
    console.error('MongoDB connection test failed:', err.message);
  }
})();
