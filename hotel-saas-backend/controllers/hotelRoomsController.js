// src/controllers/hotelRoomsController.js
const { Hotel, RoomType, RateCategory, ScrapeSourceHotel, User } = require('../models'); // Import all necessary models
const { sequelize } = require('../models');
const http = require('https');
const axios = require('axios');
const cheerio = require('cheerio');
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
                    as: 'RoomTypes',
                    attributes: ['name', 'capacity'],
                },
                {
                    model: ScrapeSourceHotel, // Include ScrapeSourceHotel
                    as: 'ScrapeSourceHotels', // IMPORTANT: This alias must match the one in Hotel.js association (e.g., Hotel.hasMany(ScrapeSourceHotel, { as: 'ScrapeSourceHotels' }))
                    required: false, // Use false for LEFT JOIN to get all hotels
                    attributes: ['uuid', 'source_type'] // <--- IMPORTANT: Include 'source_type' here
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

        const formattedHotels = hotels.map(hotel => {
            // Determine if Booking.com is connected
            const isBookingComConnected = hotel.ScrapeSourceHotels
                && hotel.ScrapeSourceHotels.some(source => source.source_type === 'Booking.com');

            // Determine if Expedia is connected
            const isExpediaConnected = hotel.ScrapeSourceHotels
                && hotel.ScrapeSourceHotels.some(source => source.source_type == 'Expedia');

            let connectionStatusText = 'Not Connected';
            if (isBookingComConnected && isExpediaConnected) {
                connectionStatusText = 'Connected to Both';
            } else if (isBookingComConnected) {
                connectionStatusText = 'Connected (Booking.com)';
            } else if (isExpediaConnected) {
                connectionStatusText = 'Connected (Expedia)';
            }

            return {
                id: hotel.id,
                name: hotel.name,
                location: hotel.location,
                hotel_type: hotel.hotel_type,
                total_rooms: hotel.total_rooms,
                // Access the associated rooms via the alias property
                Rooms: hotel.RoomTypes ? hotel.RoomTypes.map(room => room.name) : [], // Add a check for null/undefined
                // --- Updated: Add specific connection flags and combined status ---
                isBookingComConnected: isBookingComConnected,
                isExpediaConnected: isExpediaConnected,
                isAnySourceConnected: isBookingComConnected || isExpediaConnected, // Useful for the main table "Connect" button
                connectionStatus: connectionStatusText, // For displaying in the table if desired
                // You can also pass the full ScrapeSourceHotels array if needed on the frontend for more detail
                ScrapeSourceHotels: hotel.ScrapeSourceHotels ? hotel.ScrapeSourceHotels.map(s => ({
                    uuid: s.uuid,
                    source_type: s.source_type
                })) : [] // Only return necessary fields
            };
        });

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
      total_rooms: hotel.total_rooms,
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

    const userId = req.user ? req.user.id : null;
    let result;
    // If no record exists, create a new one
    result = await ScrapeSourceHotel.create({
      hotel_id: hotel_id,
      source_hotel_id: source_hotel_id,
      source_type: "Booking.com",
      user_id: userId,
      // uuid will be auto-generated by defaultValue: DataTypes.UUIDV4
    });
    return res.status(201).json({
      message: 'Scrape source hotel mapping created successfully!',
      data: result
    });
    
  } catch (error) {
    console.error('Error in saveScrapeSourceHotel:', error);
    // Handle specific Sequelize errors if needed (e.g., validation errors)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message, details: error.errors });
    }
    return res.status(500).json({ error: 'Failed to save scrape source hotel mapping.', details: error.message });
  }
};

const _performScrapeForHotelDetails = async (url) => {
  try {
      console.log(`Attempting to scrape details from: ${url}`);
      const apiKey = process.env.SCRAPINGBEE_API_KEY; // Ensure this is set correctly in your .env file
      const waitTimeMs = 7000;

      if (!apiKey) {
          throw new Error("SCRAPINGBEE_API_KEY is not set in environment variables.");
      }

      // CORRECT WAY to construct the Scrapingbee API URL
      // The 'url' parameter to Scrapingbee should be the clean Expedia URL.
      // The 'wait' parameter should be a separate parameter for the Scrapingbee API.
      const scrapingbeeApiUrl = new URL('https://app.scrapingbee.com/api/v1/');
      scrapingbeeApiUrl.searchParams.set('api_key', apiKey);
      scrapingbeeApiUrl.searchParams.set('url', url); // The original Expedia URL
      scrapingbeeApiUrl.searchParams.set('wait', waitTimeMs); // Parameter for Scrapingbee
      scrapingbeeApiUrl.searchParams.set('render_js', 'true'); // Highly recommended for Expedia as it's a JavaScript-heavy site
      scrapingbeeApiUrl.searchParams.set('stealth_proxy', 'true'); // Highly recommended for Expedia as it's a JavaScript-heavy site

      console.log("Scrapingbee API URL being called:", scrapingbeeApiUrl.toString());

      const response = await axios.get(scrapingbeeApiUrl.toString());
      const $ = cheerio.load(response.data);
      console.log("Response data (truncated for brevity):", response.data.substring(0, 500) + '...'); // Log a snippet

      const hotelName = $('h1.uitk-heading.uitk-heading-3').text().trim();

      const hotelImageDiv = $('div.uitk-image-placeholder.uitk-image-placeholder-image');
      const hotelImage = hotelImageDiv.find('img.uitk-image-media').attr('src');

      console.log(`Scraped Hotel Name: "${hotelName}"`);
      console.log(`Scraped Hotel Image: "${hotelImage}"`);

      // No need for setTimeout here if Scrapingbee's 'wait' is used and effective
      // await new Promise(resolve => setTimeout(resolve, 1000));

      // Basic validation for scraped data
      if (!hotelName) {
          console.warn(`Hotel name not found for URL: ${url}`);
      }
      if (!hotelImage) {
          console.warn(`Hotel image not found for URL: ${url}`);
      }

      return {
          hotelName: hotelName || null,
          hotelImage: hotelImage || null,
          status: 'success'
      };
  } catch (error) {
      console.error(`Error during hotel detail scraping for ${url}:`, error.message);
      // Log the full error to get more context if it's not a 500 from Scrapingbee directly
      if (error.response) {
          console.error('Scrapingbee response data:', error.response.data);
          console.error('Scrapingbee response status:', error.response.status);
          console.error('Scrapingbee response headers:', error.response.headers);
      }
      return {
          hotelName: null,
          hotelImage: null,
          status: 'error',
          errorMessage: error.message
      };
  }
};

exports.getScrapeExpediaURLDetail = async (req, res) => {
    const { hotel_id, url } = req.body; // user_id is not needed here as we are not saving

    if (!hotel_id || !url) {
        return res.status(400).json({ message: "Missing required fields: hotel_id and url." });
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ message: "Invalid URL provided. Must start with http:// or https://." });
    }

    try {
        // 1. Validate if hotel_id exists (user_id not needed for just extraction)
        const hotelExists = await Hotel.findByPk(hotel_id);
        if (!hotelExists) {
            return res.status(404).json({ message: `Hotel with ID ${hotel_id} not found.` });
        }

        // 2. Scrape hotel name and image from the URL
        const scrapeResult = await _performScrapeForHotelDetails(url);

        if (scrapeResult.status === 'error') {
            return res.status(500).json({
                message: "Failed to scrape hotel details from the provided URL.",
                error: scrapeResult.errorMessage
            });
        }

        const { hotelName, hotelImage, hotelDescription } = scrapeResult; // Assuming description is also scraped

        // 3. Return the extracted details without saving anything
        return res.status(200).json({ // Changed status to 200 as nothing is created
            message: "Expedia hotel details extracted successfully.",
            extractedHotelDetails: {
                url: url, // Pass the original URL back for saving later
                name: hotelName,
                image: hotelImage,
                description: hotelDescription || null, // Include description if available
            }
        });

    } catch (error) {
        console.error("Error in getScrapeExpediaURLDetail:", error);
        return res.status(500).json({
            message: "Internal server error while extracting scrape source URL details.",
            error: error.message
        });
    }
};

exports.saveExpediaScrapeSourceHotel = async (req, res) => { // Renamed for broader use (not just Expedia)
    try {
        // Essential fields for any scrape source
        const { hotel_id, source_type, source_hotel_id } = req.body;

        const userId = req.user ? req.user.id : null; // Assuming req.user is populated by auth middleware

        // Basic validation
        if (!hotel_id || !source_type) {
            return res.status(400).json({ error: 'Missing required fields: hotel_id and source_type are mandatory.' });
        }

        // Validate if hotel_id exists
        const hotelExists = await Hotel.findByPk(hotel_id);
        if (!hotelExists) {
            return res.status(404).json({ message: `Hotel with ID ${hotel_id} not found.` });
        }

        // Validate if user_id exists if you are always expecting it
        if (userId) {
            const userExists = await User.findByPk(userId);
            if (!userExists) {
                return res.status(404).json({ message: `User with ID ${userId} not found.` });
            }
        }

        // Use findOrCreate based on the compound unique index (hotel_id, source_type)
        const [scrapeSourceHotelEntry, created] = await ScrapeSourceHotel.findOrCreate({
            where: {
              hotel_id: hotel_id,
              source_type: source_type,
            },
            defaults: {
              user_id: userId,
              source_hotel_id: source_hotel_id, 
              hotel_id: hotel_id,
              source_type: source_type  
            }
        });

        if (!created) {
            // If the entry already existed, update it with new data
            await scrapeSourceHotelEntry.update({
                user_id: userId,
                source_hotel_id: source_hotel_id,
            });
            console.log(`Updated existing ScrapeSourceHotel entry for hotel_id: ${hotel_id}, source_type: ${source_type}`);
        } else {
            console.log(`Created new ScrapeSourceHotel entry for hotel_id: ${hotel_id}, source_type: ${source_type}`);
        }

        return res.status(created ? 201 : 200).json({
            message: created ? 'Scrape source hotel mapping created successfully!' : 'Scrape source hotel mapping updated successfully!',
            data: scrapeSourceHotelEntry.toJSON()
        });

    } catch (error) {
        console.error('Error in saveScrapeSourceHotel:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.message, details: error.errors });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
             // This error should ideally be caught by findOrCreate's logic,
             // but good to have a fallback.
            return res.status(409).json({ error: 'A connection for this hotel and source type already exists.', details: error.message });
        }
        return res.status(500).json({ error: 'Failed to save scrape source hotel mapping.', details: error.message });
    }
};
