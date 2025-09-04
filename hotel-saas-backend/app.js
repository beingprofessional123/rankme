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
const settingsRoutes = require('./routes/settingsRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const competitorDataRoutes = require('./routes/competitorDataRoutes');
const strocrReportRoutes = require('./routes/strocrReportRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoute');
const forecastRoutes = require('./routes/forecastRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');


const adminUserRoutes = require('./routes/admin/userRoutes');
const adminPlanRoutes = require('./routes/admin/planRoutes');
const adminTransactionRoutes = require('./routes/admin/transactionRoutes');
const adminSupportTicketRoutes = require('./routes/admin/supportTicketRoutes');

const path = require('path');

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
app.use('/api/settings', settingsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/competitorData', competitorDataRoutes);
app.use('/api/strocrReport', strocrReportRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api', supportTicketRoutes);
app.use('/api', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Admin Routes
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminPlanRoutes);
app.use('/api/admin/transaction', adminTransactionRoutes);
app.use('/api/admin/support-ticket', adminSupportTicketRoutes);

// Import the images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Import the new error handler
const errorHandler = require('./middlewares/errorHandler'); // Adjust path as needed
app.use(errorHandler);

module.exports = app;
