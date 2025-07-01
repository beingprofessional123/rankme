const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/authorize');
const hotelRoomsController = require('../controllers/hotelRoomsController');

// Middleware for this route group
router.use(authenticate);
router.use(authorizeRoles('company_admin', 'revenue_manager'));

// Route to fetch subscriptions
router.get('/hotels/list', hotelRoomsController.getHotels);
router.get('/hotels/:id', hotelRoomsController.getHotelDetails); // :id will be the hotel ID
router.delete('/hotels/delete/:id', hotelRoomsController.deleteHotelDetails); // :id will be the hotel ID
router.get('/hotels/scraped-hotel-detail/:id', hotelRoomsController.getScrapedHotelDetails); // :id will be the hotel ID
router.post('/scrape-source-hotels/save', hotelRoomsController.saveScrapeSourceHotel);



module.exports = router;
