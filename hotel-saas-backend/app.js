const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const setupWizard = require('./routes/setupWizard');
const uploadDataRoutes = require('./routes/uploadDataRoutes');
const hotelNRooms = require('./routes/hotelNRooms');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api', authRoutes);
app.use('/api/company', companyRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api', setupWizard); 
app.use('/api/upload', uploadDataRoutes);
app.use('/api', hotelNRooms);

// Import the new error handler
const errorHandler = require('./middlewares/errorHandler'); // Adjust path as needed
app.use(errorHandler);

module.exports = app;
