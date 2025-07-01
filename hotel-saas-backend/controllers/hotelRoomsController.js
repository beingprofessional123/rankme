// src/controllers/hotelRoomsController.js
const { Hotel, RoomType, RateCategory, ScrapeSourceHotel } = require('../models'); // Import all necessary models
const { sequelize } = require('../models');
const http = require('https');
require('dotenv').config();

exports.getHotels = async (req, res) => {
  const { company_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const hotels = await Hotel.findAll({
      where: {
        company_id
      },
      include: [
        {
          model: RoomType,
          as: 'RoomTypes', // <--- IMPORTANT: Add the 'as' alias here
          attributes: ['name', 'capacity'],
        },
        {
          model: ScrapeSourceHotel, // <--- NEW: Include ScrapeSourceHotel
          as: 'ScrapeSourceHotel', // <--- IMPORTANT: This alias must match the one in Hotel.js association
          required: false, // <--- IMPORTANT: Use false for LEFT JOIN
          attributes: ['uuid'] // We just need to know if it exists
        }
        // If you were to include RateCategory here, you'd also need its 'as' alias
        // {
        //   model: RateCategory,
        //   as: 'RateCategories',
        //   attributes: ['name'],
        // },
      ],
      order: [['createdAt', 'DESC']] // Good practice to order results
    });

    const formattedHotels = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      hotel_type: hotel.hotel_type,
      // Access the associated rooms via the alias property
      Rooms: hotel.RoomTypes ? hotel.RoomTypes.map(room => room.name) : [], // Add a check for null/undefined
      // --- NEW: Add isScrapedConnected flag ---
      isScrapedConnected: !!hotel.ScrapeSourceHotel, // True if ScrapeSourceHotel exists for this hotel
    }));

    return res.status(200).json({
      message: 'Hotels fetched successfully',
      hotels: formattedHotels,
    });
  } catch (error) {
    console.error('Error fetching hotels in getHotels:', error.message);
    return res.status(500).json({ error: 'Failed to fetch hotels.' });
  }
};


exports.getHotelDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  try {
    const hotel = await Hotel.findByPk(id, {
      include: [
        {
          model: RoomType,
          as: 'RoomTypes', // IMPORTANT: Reference the alias defined in Hotel.js
          attributes: ['id', 'name', 'capacity'],
          // Remove `through` as it's not applicable for hasMany/belongsTo
          // through: { attributes: [] }
        },
        {
          model: RateCategory,
          as: 'RateCategories', // IMPORTANT: Reference the alias defined in Hotel.js
          attributes: ['id', 'name', 'description'],
          // Remove `through` as it's not applicable for hasMany/belongsTo
          // through: { attributes: [] }
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const formattedHotel = {
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      hotel_type: hotel.hotel_type,
      // Access via the alias: hotel.RoomTypes
      rooms: hotel.RoomTypes ? hotel.RoomTypes.map(room => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
      })) : [],
      // Access via the alias: hotel.RateCategories
      rateCategories: hotel.RateCategories ? hotel.RateCategories.map(rate => ({
        id: rate.id,
        name: rate.name,
        description: rate.description,
      })) : [],
    };

    return res.status(200).json({
      message: 'Hotel details fetched successfully',
      hotel: formattedHotel,
    });
  } catch (error) {
    console.error('Error fetching hotel details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch hotel details.' });
  }
};

exports.deleteHotelDetails = async (req, res) => {
  const { id } = req.params; // This is the hotel_id

  if (!id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  let transaction; // Declare transaction variable outside try block

  try {
    // Start a transaction to ensure atomicity
    transaction = await sequelize.transaction();

    // 1. Delete associated RoomTypes
    await RoomType.destroy({
      where: { hotel_id: id },
      transaction, // Pass the transaction
    });

    // 2. Delete associated RateCategories
    await RateCategory.destroy({
      where: { hotel_id: id },
      transaction, // Pass the transaction
    });

    // 3. Delete the Hotel itself
    const deletedHotelCount = await Hotel.destroy({
      where: { id: id },
      transaction, // Pass the transaction
    });

    if (deletedHotelCount === 0) {
      await transaction.rollback(); // Rollback if hotel not found
      return res.status(404).json({ error: 'Hotel not found.' });
    }

    // Commit the transaction if all operations are successful
    await transaction.commit();

    return res.status(200).json({ message: 'Hotel and its associated rooms and rate categories deleted successfully.' });

  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback in case of any error
    console.error('Error deleting hotel and associated data:', error.message);
    return res.status(500).json({ error: 'Failed to delete hotel and associated data.' });
  }
};

exports.getScrapedHotelDetails = async (req, res) => {
  const { id } = req.params; // This will be the hotel_id (UUID)
  const { query } = req.query; // Assuming the hotel name/query comes from a query parameter

  if (!id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Search query for hotel is required' });
  }

  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      console.error('RapidAPI Key not found in .env');
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Encode the query to be safe for URL
    const encodedQuery = encodeURIComponent(query);
    const apiPath = `/api/v1/hotels/searchDestination?query=${encodedQuery}`;

    const options = {
      method: 'GET',
      hostname: 'booking-com15.p.rapidapi.com',
      port: null, // No specific port for HTTPS
      path: apiPath,
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
    };

    // Return a promise to handle the async HTTP request
    const scrapedData = await new Promise((resolve, reject) => {
      const apiReq = http.request(options, (apiRes) => {
        const chunks = [];

        apiRes.on('data', (chunk) => {
          chunks.push(chunk);
        });

        apiRes.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const responseData = JSON.parse(body.toString());

            if (responseData.status === true && responseData.data && Array.isArray(responseData.data)) {
              // Extract the desired fields from each item in the data array
              const extractedDetails = responseData.data.map(item => ({
                dest_id: item.dest_id,
                search_type: item.search_type,
                image_url: item.image_url,
                city_name: item.city_name,
                hotel_name: item.name,
                // You can include other fields you need here
              }));
              resolve(extractedDetails);
            } else {
              // Handle cases where status is false or data is not an array
              reject(new Error(responseData.message || 'Unexpected API response format'));
            }
          } catch (parseError) {
            reject(new Error('Error parsing API response: ' + parseError.message));
          }
        });
      });

      apiReq.on('error', (e) => {
        reject(new Error('API request error: ' + e.message));
      });

      apiReq.end();
    });

    // Send the extracted data as a success response
    return res.status(200).json({ hotel_id: id, scraped_details: scrapedData });

  } catch (error) {
    console.error('Error fetching scraped hotel details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch scraped hotel details. ' + error.message });
  }
};


exports.saveScrapeSourceHotel = async (req, res) => {
  try {
    const { hotel_id, source_hotel_id, source_type } = req.body;

    // Basic validation
    if (!hotel_id || !source_hotel_id) {
      return res.status(400).json({ error: 'Missing required fields: hotel_id and source_hotel_id are mandatory.' });
    }

    // Ensure hotel_id is a valid UUID if you're doing client-side validation,
    // otherwise Sequelize will handle it if the type is DataTypes.UUID

    // Check if a ScrapeSourceHotel record already exists for this hotel_id
    // Due to the `unique: true` constraint on `hotel_id` in ScrapeSourceHotel model,
    // there should be at most one.
    const existingScrapeSource = await ScrapeSourceHotel.findOne({
      where: { hotel_id: hotel_id }
    });

    let result;
    if (existingScrapeSource) {
      // If a record exists, update it
      existingScrapeSource.source_hotel_id = source_hotel_id;
      existingScrapeSource.source_type = "Booking.com";
      result = await existingScrapeSource.save();
      return res.status(200).json({
        message: 'Scrape source hotel mapping updated successfully!',
        data: result
      });
    } else {
      // If no record exists, create a new one
      result = await ScrapeSourceHotel.create({
        hotel_id: hotel_id,
        source_hotel_id: source_hotel_id,
        source_type: "Booking.com",
        // uuid will be auto-generated by defaultValue: DataTypes.UUIDV4
      });
      return res.status(201).json({
        message: 'Scrape source hotel mapping created successfully!',
        data: result
      });
    }
  } catch (error) {
    console.error('Error in saveScrapeSourceHotel:', error);
    // Handle specific Sequelize errors if needed (e.g., validation errors)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to save scrape source hotel mapping.', details: error.message });
  }
};