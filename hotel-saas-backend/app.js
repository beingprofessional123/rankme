const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const setupWizard = require('./routes/setupWizard');
const uploadDataRoutes = require('./routes/uploadDataRoutes');
const hotelNRooms = require('./routes/hotelNRooms');
const userRoleRoutes = require('./routes/userRoleRoutes');

const adminUserRoutes = require('./routes/admin/userRoutes'); // ✅ Correct path
const adminPlanRoutes = require('./routes/admin/planRoutes');

const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ RankMe Backend is running!');
});

app.use('/api', authRoutes);
app.use('/api/company', companyRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api', setupWizard); 
app.use('/api/upload', uploadDataRoutes);
app.use('/api', hotelNRooms);
app.use('/api', userRoleRoutes);

// Admin Routes
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminPlanRoutes);

// Import the images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Import the new error handler
const errorHandler = require('./middlewares/errorHandler'); // Adjust path as needed
app.use(errorHandler);

module.exports = app;
