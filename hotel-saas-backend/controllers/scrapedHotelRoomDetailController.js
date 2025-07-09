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
        const scrapeSourceHotels = await ScrapeSourceHotel.findAll();
        if (!scrapeSourceHotels || scrapeSourceHotels.length === 0) {
            console.log("No scraped source hotels found.");
            return res.status(404).json({ message: "No scraped source hotels found." });
        }

        const today = new Date();
        const tomorrow = new Date(today);
        today.setDate(today.getDate()); // Keep today's date for check-in
        tomorrow.setDate(today.getDate() + 1); // Tomorrow's date for check-out

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const checkinDate = formatDate(today);
        const checkoutDate = formatDate(tomorrow);

        console.log(`Using check-in date: ${checkinDate}`);
        console.log(`Using check-out date: ${checkoutDate}`);

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

            let newUploadDataEntry;
            let newMetaDataEntry;

            // --- Step 2 & 3: Check for existing UploadData and MetaUploadData, or create new ones ---
            try {
                // Attempt to find an existing UploadData record that has a MetaUploadData child
                // matching the specific scrape criteria (user, hotel, checkin/checkout dates)
                let existingUploadData = await UploadData.findOne({
                    where: {
                        userId: userID,
                        companyId: companyID,
                        fileType: 'property_price_data', // Specific to this type of scrape
                    },
                    include: [{
                        model: MetaUploadData,
                        as: 'metaData', // Use the alias defined in UploadData.associate
                        where: {
                            hotelPropertyId: hotelPropertyId,
                            fromDate: checkinDate,
                            toDate: checkoutDate,
                            // userId: userID // Already in UploadData.where, can be redundant here
                        },
                        required: true // Ensures it only returns UploadData records that *have* a matching MetaUploadData
                    }]
                });

                if (existingUploadData) {
                    // Found existing UploadData and its associated MetaUploadData
                    newUploadDataEntry = existingUploadData;
                    newMetaDataEntry = existingUploadData.metaData;

                    console.log(`Found existing UploadData (${newUploadDataEntry.id}) and MetaUploadData (${newMetaDataEntry.id}) for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}. Updating.`);

                    // Optionally update the status or timestamps of the UploadData record
                    // For example, if you want to update its 'updatedAt' timestamp or status back to 'saved'
                    await newUploadDataEntry.update({ status: 'saved' });

                } else {
                    // No existing UploadData/MetaUploadData found for this specific scrape event, create new ones
                    console.log(`No existing UploadData/MetaUploadData found for hotel ${hotelPropertyId} and dates ${checkinDate}-${checkoutDate}. Creating new entries.`);

                    newUploadDataEntry = await UploadData.create({
                        userId: userID,
                        companyId: companyID,
                        fileType: 'property_price_data',
                        status: 'saved',
                    });
                    console.log("New UploadData entry created successfully:", newUploadDataEntry.toJSON());

                    newMetaDataEntry = await MetaUploadData.create({
                        uploadDataId: newUploadDataEntry.id,
                        userId: userID,
                        hotelPropertyId: hotelPropertyId,
                        fromDate: checkinDate,
                        toDate: checkoutDate,
                    });
                    console.log("New MetaData entry created successfully:", newMetaDataEntry.toJSON());
                }

            } catch (error) {
                console.error(`Error handling UploadData/MetaUploadData for hotel_id ${hotelPropertyId}:`, error);
                if (newUploadDataEntry && newUploadDataEntry.status !== 'failed') {
                    await newUploadDataEntry.update({ status: 'failed' });
                }
                continue;
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
                                console.error(`Error parsing API response for hotel_id ${hotelId}:`, parseError);
                                reject(new Error(`Failed to parse response for hotel_id ${hotelId}: ${parseError.message}`));
                            }
                        });
                    });

                    req.on('error', (e) => {
                        console.error(`Error making API request for hotel_id ${hotelId}:`, e);
                        reject(e);
                    });
                    req.end();
                });
            } catch (error) {
                console.error(`API request failed for hotel_id ${hotelId}:`, error);
                await newUploadDataEntry.update({ status: 'failed' });
                continue;
            }

            // --- 5. Process API Response and Create/Update UploadedExtractDataFile Entries ---
            const roomData = [];
            const extractedDataFileEntries = [];
            if (apiResponseData?.data?.block && Array.isArray(apiResponseData.data.block)) {
                // Delete existing records for this scrape before inserting new ones
                try {
                    const deleteResult = await UploadedExtractDataFile.destroy({
                        where: {
                            uploadDataId: newUploadDataEntry.id,
                            userId: userID,
                            checkIn: checkinDate,
                            checkOut: checkoutDate,
                        }
                    });
                    console.log(`Deleted ${deleteResult} existing UploadedExtractDataFile entries for UploadData ID: ${newUploadDataEntry.id}, dates ${checkinDate}-${checkoutDate}.`);
                } catch (deleteError) {
                    console.error(`Error deleting existing UploadedExtractDataFile entries for UploadData ID ${newUploadDataEntry.id}:`, deleteError);
                    continue;
                }

                for (const room of apiResponseData.data.block) {
                    // Only process rooms where max_occupancy is 2
                    console.log(room);
                    if (room.max_occupancy == 2) {
                        const roomName = room.name_without_policy || room.room_name || room.name || 'N/A';
                        let price = room.product_price_breakdown?.gross_amount_per_night?.value || null;

                        // Ensure price is valid and round it
                        if (price !== null) {
                            price = parseFloat(price);
                            if (isNaN(price)) {
                                console.warn(`Invalid price for room ${roomName}: ${room.product_price_breakdown?.gross_amount_per_night?.value}. Skipping.`);
                                continue;
                            }

                        } else {
                            console.warn(`Missing price for room ${roomName}. Skipping.`);
                            continue;
                        }

                        if (roomName !== 'N/A' && price !== null) {
                            roomData.push({
                                room_name: roomName,
                                price: price
                            });

                            try {
                                // Find or Create the RoomType
                                const [roomTypeEntry, createdRoomType] = await RoomType.findOrCreate({
                                    where: {
                                        name: roomName,
                                        hotel_id: hotelPropertyId
                                    },
                                    defaults: {
                                        capacity: room.max_occupancy // Assuming max_occupancy can be the capacity
                                        // You might want to add more default values if needed for RoomType
                                    }
                                });

                                if (createdRoomType) {
                                    console.log(`Created new RoomType entry for "${roomName}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                                } else {
                                    console.log(`Found existing RoomType entry for "${roomName}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                                }

                                // Create new UploadedExtractDataFile entry (since old ones for this scrape were deleted)
                                const createdEntry = await UploadedExtractDataFile.create({
                                    uploadDataId: newUploadDataEntry.id,
                                    userId: userID,
                                    checkIn: checkinDate,
                                    checkOut: checkoutDate,
                                    platform: 'booking.com',
                                    roomType: roomName, // Keep this for display/redundancy if needed
                                    roomTypeId: roomTypeEntry.id, // Store the foreign key to RoomType
                                    rate: price,
                                    date: checkoutDate, // Date when data was extracted
                                    isValid: true, // Assuming valid on creation
                                });
                                console.log(`Created new UploadedExtractDataFile entry for room "${roomName}" with rate ${price} (hotel ${hotelId}):`, createdEntry.toJSON());
                                extractedDataFileEntries.push(createdEntry.toJSON());

                            } catch (entryError) {
                                console.error(`Error creating UploadedExtractDataFile or RoomType entry for room "${roomName}" with rate ${price} (hotel ${hotelId}):`, entryError);
                            }
                        }
                    }
                }
            }

            allProcessedResponses.push({
                scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                api_response_summary: {
                    total_rooms_found_in_api: apiResponseData?.data?.block?.length || 0,
                    two_occupancy_rooms_processed_and_saved: roomData.length
                },
                extracted_room_data: roomData,
                uploaded_extracted_file_entries: extractedDataFileEntries,
            });
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