const https = require('https'); // Use 'https' for secure API calls
const { ScrapeSourceHotel } = require('../models'); // Adjust path as per your model index file

exports.getScrapedHotelDetail = async (req, res) => {
    try {
        // Fetch all records from the ScrapeSourceHotel table
        const scrapeSourceHotels = await ScrapeSourceHotel.findAll();

        if (!scrapeSourceHotels || scrapeSourceHotels.length === 0) {
            console.log("No scraped source hotels found.");
            return res.status(404).json({ message: "No scraped source hotels found." });
        }

        // Calculate check-in and check-out dates
        const today = new Date();
        const tomorrow = new Date(today);

        today.setDate(today.getDate() + 1);
        tomorrow.setDate(today.getDate() + 1);

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const checkinDate = formatDate(today);
        const checkoutDate = formatDate(tomorrow);

        console.log(`Using check-in date: ${checkinDate}`);
        console.log(`Using check-out date: ${checkoutDate}`);

        const allApiResponses = [];

        // Loop through each ScrapeSourceHotel record
        for (const scrapeSourceHotel of scrapeSourceHotels) {
            const hotelId = scrapeSourceHotel.source_hotel_id;

            const options = {
                method: 'GET',
                hostname: 'booking-com15.p.rapidapi.com',
                port: null,
                path: `/api/v1/hotels/getRoomList?hotel_id=${hotelId}&arrival_date=${checkinDate}&departure_date=${checkoutDate}&adults=1&room_qty=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=USD&location=US`,
                headers: {
                    'x-rapidapi-key': '6ea116a47amsh8c197ac09cd7a19p1e3ea9jsne7f9251d3fd5',
                    'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
                }
            };

            const apiResponse = await new Promise((resolve, reject) => {
                const req = https.request(options, (apiRes) => {
                    const chunks = [];

                    apiRes.on('data', (chunk) => {
                        chunks.push(chunk);
                    });

                    apiRes.on('end', () => {
                        try {
                            const body = Buffer.concat(chunks);
                            const parsedBody = JSON.parse(body.toString());

                            // Extract room data
                            const roomData = [];
                            if (parsedBody?.data?.block && Array.isArray(parsedBody.data.block)) {
                                for (const room of parsedBody.data.block) {
                                    const roomName = room.room_name || room.name || 'N/A';
                                    const price = room.product_price_breakdown?.gross_amount_per_night?.value || null;

                                    if (roomName && price !== null) {
                                        roomData.push({
                                            room_name: roomName,
                                            price: price
                                        });
                                    }
                                }
                            }

                            resolve({
                                scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                                checkin_date: checkinDate,
                                checkout_date: checkoutDate,
                                room_data: roomData
                            });
                        } catch (parseError) {
                            console.error(`Error parsing API response for hotel_id ${hotelId}:`, parseError);
                            resolve({
                                scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                                checkin_date: checkinDate,
                                checkout_date: checkoutDate,
                                error: `Failed to parse response for hotel_id ${hotelId}`,
                                details: parseError.message
                            });
                        }
                    });
                });

                req.on('error', (e) => {
                    console.error(`Error making API request for hotel_id ${hotelId}:`, e);
                    reject(e);
                });

                req.end();
            });

            allApiResponses.push(apiResponse);
        }

        return res.status(200).json({
            message: "Successfully processed all ScrapeSourceHotel records and fetched API details.",
            data: allApiResponses
        });

    } catch (error) {
        console.error("Error in getScrapedHotelDetail:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
