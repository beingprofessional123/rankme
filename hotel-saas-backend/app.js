const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // ✅ Load env early

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
const errorHandler = require('./middlewares/errorHandler'); // ✅ Error handler

const app = express();

// ✅ Use CORS with proper config (must be before routes)
app.use(cors({
  origin: 'https://rankme-frontend.onrender.com',
  credentials: true,
}));

// ✅ Enable preflight handling if needed
app.options('*', cors());

// ✅ Body parser
app.use(express.json());

// ✅ Basic route
app.get('/', (req, res) => {
  res.send('✅ RankMe Backend is running!');
});

// ✅ API routes
app.use('/api', authRoutes);
app.use('/api/company', subscriptionRoutes); 
app.use('/api/payments', paymentRoutes); 
app.use('/api', setupWizard); 
app.use('/api/upload', uploadDataRoutes);
app.use('/api', hotelNRooms);
app.use('/api', userRoleRoutes);
app.use('/api/pricing-calendar', PricingCalendarRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminPlanRoutes);

// ✅ Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Error handler (keep this at the end)
app.use(errorHandler);

module.exports = app;
