const https = require('https'); // Use 'https' for secure API calls
const { ScrapeSourceHotel, Hotel, UploadData, MetaUploadData, UploadedExtractDataFile, RoomType } = require('../models'); // Add RoomType here
const { Op } = require('sequelize'); // Import Op for Sequelize operators if needed

exports.getScrapedHotelDetail = async (req, res) => {
    const incomingSecret = req.query.secret;
    const expectedSecret = process.env.CRON_SECRET; // Ensure this is loaded via dotenv in your main server file

    if (!incomingSecret || incomingSecret !== expectedSecret) {
        return res.status(403).json({
            message: "Access Denied: Invalid or missing authentication credential."
        });
    }

    try {
        const scrapeSourceHotels = await ScrapeSourceHotel.findAll({
            where: {
                source_type: 'Booking.com'
            }
        });
        if (!scrapeSourceHotels || scrapeSourceHotels.length === 0) {
            console.log("No scraped source hotels found.");
            return res.status(404).json({ message: "No scraped source hotels found." });
        }

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const allProcessedResponses = [];

        for (const scrapeSourceHotel of scrapeSourceHotels) {
            const hotelId = scrapeSourceHotel.source_hotel_id;
            const userID = scrapeSourceHotel.user_id;
            const hotelPropertyId = scrapeSourceHotel.hotel_id; // Store this for easier access

            // --- 1. Get Company ID ---
            const company = await Hotel.findOne({
                where: { id: hotelPropertyId },
                attributes: ['company_id']
            });

            if (!company || !company.company_id) {
                console.warn(`Skipping processing for hotel_id ${hotelPropertyId}: Company ID not found.`);
                continue;
            }
            const companyID = company.company_id;
            console.log(`Processing for User ID: ${userID}, Company ID: ${companyID}`);

            // Loop for the next 14 days
            for (let i = 1; i <= 14; i++) {
                const today = new Date();
                const checkinDateObj = new Date(today);
                checkinDateObj.setDate(today.getDate() + i);

                const checkoutDateObj = new Date(checkinDateObj);
                checkoutDateObj.setDate(checkinDateObj.getDate() + 1);

                const checkinDate = formatDate(checkinDateObj);
                const checkoutDate = formatDate(checkoutDateObj);

                console.log(`Using check-in date: ${checkinDate}`);
                console.log(`Using check-out date: ${checkoutDate}`);

                let newUploadDataEntry;
                let newMetaDataEntry;
                let skipApiCall = false;

                // --- Step 2 & 3: Check for existing UploadData and MetaUploadData, or create new ones ---
                try {
                    let existingUploadData = await UploadData.findOne({
                        where: {
                            userId: userID,
                            companyId: companyID,
                            fileType: 'property_price_data', // Specific to this type of scrape
                            plateform: 'booking.com',
                        },
                        include: [{
                            model: MetaUploadData,
                            as: 'metaData', // Use the alias defined in UploadData.associate
                            where: {
                                hotelPropertyId: hotelPropertyId,
                                fromDate: checkinDate,
                                toDate: checkoutDate,
                                plateform: 'booking.com',
                            },
                            required: true // Ensures it only returns UploadData records that *have* a matching MetaUploadData
                        }]
                    });

                    if (existingUploadData) {
                        newUploadDataEntry = existingUploadData;
                        newMetaDataEntry = existingUploadData.metaData;

                        console.log(`Found existing UploadData (${newUploadDataEntry.id}) and MetaUploadData (${newMetaDataEntry.id}) for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}.`);

                        // Check if UploadedExtractDataFile records were updated within the last 6 hours
                        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                        const latestUploadedExtract = await UploadedExtractDataFile.findOne({
                            where: {
                                uploadDataId: newUploadDataEntry.id,
                                userId: userID,
                                checkIn: checkinDate,
                                checkOut: checkoutDate,
                                platform: 'booking.com' // Match platform
                            },
                            order: [['updatedAt', 'DESC']]
                        });

                        if (latestUploadedExtract && new Date(latestUploadedExtract.updatedAt) > sixHoursAgo) {
                            console.log(`Skipping API call for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}. Records updated within the last 6 hours.`);
                            await newUploadDataEntry.update({ status: 'saved' });
                            allProcessedResponses.push({
                                scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                                checkin_date: checkinDate,
                                checkout_date: checkoutDate,
                                status: "API call skipped, data is recent.",
                                existing_upload_data_id: newUploadDataEntry.id
                            });
                            skipApiCall = true; // Set flag to skip API call
                        } else {
                            console.log(`Existing records found, but older than 6 hours or no records, proceeding with API call for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}.`);
                            await newUploadDataEntry.update({ status: 'saved' }); // Set status to 'saved' before making API call
                        }

                    } else {
                        // No existing UploadData/MetaUploadData found for this specific scrape event, create new ones
                        console.log(`No existing UploadData/MetaUploadData found for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}. Creating new entries.`);

                        newUploadDataEntry = await UploadData.create({
                            userId: userID,
                            companyId: companyID,
                            fileType: 'property_price_data',
                            status: 'saved',
                            plateform: 'booking.com',
                        });
                        console.log("New UploadData entry created successfully:", newUploadDataEntry.toJSON());

                        newMetaDataEntry = await MetaUploadData.create({
                            uploadDataId: newUploadDataEntry.id,
                            userId: userID,
                            hotelPropertyId: hotelPropertyId,
                            fromDate: checkinDate,
                            toDate: checkoutDate,
                            plateform: 'booking.com',
                        });
                        console.log("New MetaData entry created successfully:", newMetaDataEntry.toJSON());
                    }

                } catch (error) {
                    console.error(`Error handling UploadData/MetaUploadData for hotel_id ${hotelPropertyId} (Day ${i}):`, error);
                    if (newUploadDataEntry && newUploadDataEntry.status !== 'failed') {
                        await newUploadDataEntry.update({ status: 'failed' });
                    }
                    continue; // Skip to the next day if there's a database error here
                }

                if (skipApiCall) {
                    continue; // Skip to the next day's iteration if the API call was determined to be skipped
                }

                // --- 4. Make External API Call ---
                const options = {
                    method: 'GET',
                    hostname: 'booking-com15.p.rapidapi.com',
                    port: null,
                    path: `/api/v1/hotels/getRoomList?hotel_id=${hotelId}&arrival_date=${checkinDate}&departure_date=${checkoutDate}&adults=1&room_qty=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=USD&location=US`,
                    headers: {
                        'x-rapidapi-key': `${process.env.RAPIDAPI_KEY}`,
                        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
                    }
                };

                let apiResponseData;
                try {
                    apiResponseData = await new Promise((resolve, reject) => {
                        const req = https.request(options, (apiRes) => {
                            const chunks = [];
                            apiRes.on('data', (chunk) => chunks.push(chunk));
                            apiRes.on('end', () => {
                                try {
                                    const body = Buffer.concat(chunks);
                                    const parsedBody = JSON.parse(body.toString());
                                    resolve(parsedBody);
                                } catch (parseError) {
                                    console.error(`Error parsing API response for hotel_id ${hotelId} (Day ${i}):`, parseError);
                                    reject(new Error(`Failed to parse response for hotel_id ${hotelId} (Day ${i}): ${parseError.message}`));
                                }
                            });
                        });

                        req.on('error', (e) => {
                            console.error(`Error making API request for hotel_id ${hotelId} (Day ${i}):`, e);
                            reject(e);
                        });
                        req.end();
                    });
                } catch (error) {
                    console.error(`API request failed for hotel_id ${hotelId} (Day ${i}):`, error);
                    await newUploadDataEntry.update({ status: 'failed' });
                    continue; // Skip to the next day if API call fails
                }

                // --- 5. Process API Response and Create/Update UploadedExtractDataFile Entries ---
                let lowestPriceRoom = null;
                let lowestPrice = Infinity;
                const extractedDataFileEntries = [];

                if (apiResponseData?.data?.block && Array.isArray(apiResponseData.data.block)) {
                    // Delete existing records for this specific UploadData (and thus checkin/checkout date) before inserting new ones
                    try {
                        const deleteResult = await UploadedExtractDataFile.destroy({
                            where: {
                                uploadDataId: newUploadDataEntry.id,
                                userId: userID,
                                checkIn: checkinDate,
                                checkOut: checkoutDate,
                                platform: 'booking.com'
                            }
                        });
                        console.log(`Deleted ${deleteResult} existing UploadedExtractDataFile entries for UploadData ID: ${newUploadDataEntry.id}, dates ${checkinDate}-${checkoutDate}.`);
                    } catch (deleteError) {
                        console.error(`Error deleting existing UploadedExtractDataFile entries for UploadData ID ${newUploadDataEntry.id} (Day ${i}):`, deleteError);
                        // Do not continue here, as we still want to attempt to save new data
                    }

                    for (const room of apiResponseData.data.block) {
                        if (room.max_occupancy == 2) {
                            const roomName = room.name_without_policy || room.room_name || room.name || 'N/A';
                            let price = room.product_price_breakdown?.gross_amount_per_night?.value || null;
                            
                            if (price !== null) {
                                price = parseFloat(price);
                                if (isNaN(price)) {
                                    console.warn(`Invalid price for room ${roomName} (Day ${i}): ${room.product_price_breakdown?.gross_amount_per_night?.value}. Skipping.`);
                                    continue;
                                }

                                if (price < lowestPrice) {
                                    lowestPrice = price;
                                    lowestPriceRoom = {
                                        room_name: roomName,
                                        price: price,
                                        max_occupancy: room.max_occupancy
                                    };
                                }
                            } else {
                                console.warn(`Missing price for room ${roomName} (Day ${i}). Skipping.`);
                            }
                        }
                    }

                    if (lowestPriceRoom) {
                        try {
                            // Find or Create the RoomType for the lowest priced room
                            const [roomTypeEntry, createdRoomType] = await RoomType.findOrCreate({
                                where: {
                                    name: lowestPriceRoom.room_name,
                                    hotel_id: hotelPropertyId
                                },
                                defaults: {
                                    capacity: lowestPriceRoom.max_occupancy
                                }
                            });

                            if (createdRoomType) {
                                console.log(`Created new RoomType entry for "${lowestPriceRoom.room_name}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                            } else {
                                console.log(`Found existing RoomType entry for "${lowestPriceRoom.room_name}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                            }

                            // Create new UploadedExtractDataFile entry for the lowest priced room
                            const createdEntry = await UploadedExtractDataFile.create({
                                uploadDataId: newUploadDataEntry.id,
                                userId: userID,
                                checkIn: checkinDate,
                                checkOut: checkoutDate,
                                platform: 'booking.com',
                                roomType: lowestPriceRoom.room_name,
                                roomTypeId: roomTypeEntry.id,
                                rate: lowestPriceRoom.price,
                                date: checkinDate, // Date when data was extracted (using checkinDate)
                                isValid: true,
                            });
                            console.log(`Created new UploadedExtractDataFile entry for LOWEST priced room "${lowestPriceRoom.room_name}" with rate ${lowestPriceRoom.price} (hotel ${hotelId}) for dates ${checkinDate}-${checkoutDate}:`, createdEntry.toJSON());
                            extractedDataFileEntries.push(createdEntry.toJSON());

                        } catch (entryError) {
                            console.error(`Error creating UploadedExtractDataFile or RoomType entry for lowest priced room (hotel ${hotelId}, dates ${checkinDate}-${checkoutDate}):`, entryError);
                        }
                    } else {
                        console.log(`No rooms with max_occupancy == 2 found or processed for hotel ${hotelId} on dates ${checkinDate}-${checkoutDate}.`);
                    }

                } else {
                    console.log(`No room data found in API response for hotel ${hotelId} on dates ${checkinDate}-${checkoutDate}.`);
                }

                allProcessedResponses.push({
                    scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                    checkin_date: checkinDate,
                    checkout_date: checkoutDate,
                    api_response_summary: {
                        total_rooms_found_in_api: apiResponseData?.data?.block?.length || 0,
                        lowest_price_room_for_two_occupancy: lowestPriceRoom
                    },
                    uploaded_extracted_file_entries: extractedDataFileEntries,
                });
            }
        }

        return res.status(200).json({
            message: "Successfully processed all ScrapeSourceHotel records and extracted/updated API details.",
            data: allProcessedResponses
        });

    } catch (error) {
        console.error("Error in getScrapedHotelDetail:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};