const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const setupWizard = require('./routes/setupWizard');
const uploadDataRoutes = require('./routes/uploadDataRoutes');
const hotelNRooms = require('./routes/hotelNRooms');
const userRoleRoutes = require('./routes/userRoleRoutes');
const PricingCalendarRoutes = require('./routes/PricingCalendarRoutes');


const adminUserRoutes = require('./routes/admin/userRoutes');
const adminPlanRoutes = require('./routes/admin/planRoutes');

const path = require('path');
app.use(cors({
  origin: 'https://rankme-frontend.onrender.com',
  credentials: true, // If you're using cookies or authorization headers
}));
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ RankMe Backend is running!');
});

app.use('/api', authRoutes);
app.use('/api/company', subscriptionRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api', setupWizard); 
app.use('/api/upload', uploadDataRoutes);
app.use('/api', hotelNRooms);
app.use('/api', userRoleRoutes);
app.use('/api/pricing-calendar', PricingCalendarRoutes);

// Admin Routes
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminPlanRoutes);

// Import the images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Import the new error handler
const errorHandler = require('./middlewares/errorHandler'); // Adjust path as needed
app.use(errorHandler);

module.exports = app;
