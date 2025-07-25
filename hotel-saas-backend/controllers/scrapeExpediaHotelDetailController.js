// controllers/scrapeExpediaHotelDetailController.js

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { ScrapeSourceHotel, Hotel, UploadData, MetaUploadData, UploadedExtractDataFile, RoomType } = require('../models');
const { Op } = require('sequelize');

// --- Low-level Expedia Scraping Function (Internal Use) ---
async function _performExpediaScrape(targetUrlWithDates) {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    const waitTimeMs = 7000;

    const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(targetUrlWithDates)}&render_js=true&premium_proxy=false&stealth_proxy=true&wait=${waitTimeMs}`;
    
    try {
        const response = await axios.get(apiUrl);
        const html = response.data;

        const $ = cheerio.load(html);

        const propertyOfferDiv = $('div[data-stid="property-offer-1"]');

        let priceText = null;
        let roomName = null;

        if (propertyOfferDiv.length > 0) {
            // Updated selector to find the room name (e.g., "Room, 1 King Bed with Sofa bed")
            const roomNameElement = propertyOfferDiv.find('h3.uitk-heading.uitk-heading-6').first();
            if (roomNameElement.length > 0) {
                roomName = roomNameElement.text().trim();
            }

            // Updated selector for the price: Targeting the FIRST occurrence of the nightly price.
            // This looks for the div within the span with aria-hidden="true" that typically holds the nightly rate.
            const priceElement = propertyOfferDiv.find('div[data-test-id="price-summary-message-line"] span[aria-hidden="true"] div.uitk-text.uitk-type-300.uitk-type-regular.uitk-text-default-theme').first();
            
            if (priceElement.length > 0) {
                priceText = priceElement.text().trim();
            } else {
                // Fallback: Sometimes the structure might be different, or it's the hidden price.
                // Try to get the price from the visibly hidden div that has the price text
                const hiddenPriceElement = propertyOfferDiv.find('div[data-test-id="price-summary-message-line"] div.uitk-text.is-visually-hidden').first();
                 if (hiddenPriceElement.length > 0) {
                    priceText = hiddenPriceElement.text().trim().replace(' nightly', ''); // Remove " nightly" if present
                 }
            }
        }
        
        return { roomName, priceText, status: 'success' };

    } catch (error) {
        console.error(`Error during Expedia scrape for URL ${targetUrlWithDates}:`, error.message);
        return { roomName: null, priceText: null, status: 'error', errorMessage: error.message };
    }
}

// --- Expedia Scrape Controller (Express Route Handler) ---
exports.scrapeExpediaHotelDetail = async (req, res) => {
    try {
        const scrapeSourceHotels = await ScrapeSourceHotel.findAll({
            where: {
                source_type: 'Expedia'
            }
        });

        if (!scrapeSourceHotels || scrapeSourceHotels.length === 0) {
            console.log("No Expedia scraped source hotels found.");
            return res.status(404).json({ message: "No Expedia scraped source hotels found." });
        }

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const allProcessedResponses = [];

        for (const scrapeSourceHotel of scrapeSourceHotels) {
            const hotelUrl = scrapeSourceHotel.source_hotel_id;
            const userID = scrapeSourceHotel.user_id;
            const hotelPropertyId = scrapeSourceHotel.hotel_id;

            if (!hotelUrl || !hotelUrl.startsWith('https://www.expedia.com/')) {
                console.warn(`Skipping ScrapeSourceHotel ID ${scrapeSourceHotel.uuid}: Invalid or missing Expedia URL in source_hotel_id.`);
                continue;
            }

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
            console.log(`Processing Expedia for User ID: ${userID}, Company ID: ${companyID}, Hotel URL: ${hotelUrl}`);

            const numberOfDaysToScrape = 14; 
            const today = new Date();

            for (let i = 0; i < numberOfDaysToScrape; i++) {
                const checkinDateObj = new Date(today);
                checkinDateObj.setDate(today.getDate() + (i + 1));

                const checkoutDateObj = new Date(checkinDateObj);
                checkoutDateObj.setDate(checkinDateObj.getDate() + 1);

                const formattedCheckin = formatDate(checkinDateObj);
                const formattedCheckout = formatDate(checkoutDateObj);

                console.log(`Expedia Scrape for dates: Check-in ${formattedCheckin}, Check-out ${formattedCheckout}`);

                let newUploadDataEntry;
                let newMetaDataEntry;
                let skipApiCall = false;
                let currentDayExtractedDataFiles = []; // Array to store extracted data for the current day

                // --- Step 2 & 3: Check for existing UploadData and MetaUploadData, or create new ones ---
                try {
                    let existingUploadData = await UploadData.findOne({
                        where: {
                            userId: userID,
                            companyId: companyID,
                            fileType: 'property_price_data',
                            plateform: 'Expedia',
                        },
                        include: [{
                            model: MetaUploadData,
                            as: 'metaData', 
                            where: {
                                hotelPropertyId: hotelPropertyId,
                                fromDate: formattedCheckin,
                                toDate: formattedCheckout,
                                plateform: 'Expedia',
                            },
                            required: true 
                        }]
                    });

                    if (existingUploadData) {
                        newUploadDataEntry = existingUploadData;
                        newMetaDataEntry = existingUploadData.metaData;

                        console.log(`Found existing UploadData (${newUploadDataEntry.id}) and MetaUploadData (${newMetaDataEntry.id}) for hotel ${hotelPropertyId} (Expedia) and dates ${formattedCheckin}-${formattedCheckout}.`);

                        // Check if UploadedExtractDataFile records were updated within the last 6 hours
                        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                        const latestUploadedExtract = await UploadedExtractDataFile.findOne({
                            where: {
                                uploadDataId: newUploadDataEntry.id,
                                userId: userID,
                                checkIn: formattedCheckin,
                                checkOut: formattedCheckout,
                                platform: 'Expedia' // Match platform
                            },
                            order: [['updatedAt', 'DESC']]
                        });

                        if (latestUploadedExtract && new Date(latestUploadedExtract.updatedAt) > sixHoursAgo) {
                            console.log(`Skipping Expedia API call for hotel ${hotelPropertyId} and dates ${formattedCheckin}-${formattedCheckout}. Records updated within the last 6 hours.`);
                            await newUploadDataEntry.update({ status: 'saved' });
                            // Fetch existing extracted data to include in response
                             currentDayExtractedDataFiles = await UploadedExtractDataFile.findAll({
                                where: {
                                    uploadDataId: newUploadDataEntry.id,
                                    userId: userID,
                                    checkIn: formattedCheckin,
                                    checkOut: formattedCheckout,
                                    platform: 'Expedia'
                                }
                            });
                            skipApiCall = true; 
                        } else {
                            console.log(`Existing records found for Expedia, but older than 6 hours or no recent records, proceeding with API call for hotel ${hotelPropertyId} and dates ${formattedCheckin}-${formattedCheckout}.`);
                            await newUploadDataEntry.update({ status: 'processing' }); // Set to processing before API call
                        }

                    } else {
                        console.log(`No existing UploadData/MetaUploadData found for hotel ${hotelPropertyId} (Expedia) and dates ${formattedCheckin}-${formattedCheckout}. Creating new entries.`);

                        newUploadDataEntry = await UploadData.create({
                            userId: userID,
                            companyId: companyID,
                            fileType: 'property_price_data',
                            status: 'processing', // Set to processing while scraping
                            plateform: 'Expedia',
                        });
                        console.log("New UploadData entry created successfully:", newUploadDataEntry.toJSON());

                        newMetaDataEntry = await MetaUploadData.create({
                            uploadDataId: newUploadDataEntry.id,
                            userId: userID,
                            hotelPropertyId: hotelPropertyId,
                            fromDate: formattedCheckin,
                            toDate: formattedCheckout,
                            dataSourceName: 'Expedia', // Set data source name here
                            plateform: 'Expedia',
                        });
                        console.log("New MetaData entry created successfully:", newMetaDataEntry.toJSON());
                    }

                } catch (error) {
                    console.error(`Error handling UploadData/MetaUploadData for hotel_id ${hotelPropertyId} (Expedia, Day ${i}):`, error);
                    if (newUploadDataEntry && newUploadDataEntry.status !== 'failed') {
                        await newUploadDataEntry.update({ status: 'failed' });
                    }
                    allProcessedResponses.push({
                        scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                        checkin_date: formattedCheckin,
                        checkout_date: formattedCheckout,
                        status: "Failed to manage UploadData/MetaData entries.",
                        error: error.message
                    });
                    continue; 
                }

                if (skipApiCall) {
                    allProcessedResponses.push({
                        scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                        checkin_date: formattedCheckin,
                        checkout_date: formattedCheckout,
                        status: "API call skipped, data is recent.",
                        existing_upload_data_id: newUploadDataEntry.id,
                        uploaded_extracted_file_entries: currentDayExtractedDataFiles.map(entry => entry.toJSON()) // Include existing data
                    });
                    continue;
                }

                // --- 4. Make External API Call to Scrapingbee for Expedia ---
                const targetUrlWithDates = `${hotelUrl.split('?')[0]}?chkin=${formattedCheckin}&chkout=${formattedCheckout}${hotelUrl.split('?')[1] ? '&' + hotelUrl.split('?')[1] : ''}`;
                
                let scrapeResult;
                try {
                    scrapeResult = await _performExpediaScrape(targetUrlWithDates);

                    if (scrapeResult.status === 'error') {
                        throw new Error(scrapeResult.errorMessage || 'Unknown scraping error');
                    }
                    console.log(`Expedia Scrape Success for ${formattedCheckin}: Room "${scrapeResult.roomName}", Price "${scrapeResult.priceText}"`);

                } catch (error) {
                    console.error(`Expedia API (Scrapingbee) request failed for hotel URL ${hotelUrl} (Day ${i}):`, error.message);
                    if (newUploadDataEntry) {
                        await newUploadDataEntry.update({ status: 'failed' });
                    }
                    allProcessedResponses.push({
                        scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                        checkin_date: formattedCheckin,
                        checkout_date: formattedCheckout,
                        status: "Expedia API call failed",
                        error: error.message
                    });
                    continue; 
                }

                // --- 5. Process API Response and Create/Update UploadedExtractDataFile Entries ---
                const roomName = scrapeResult.roomName;
                let price = scrapeResult.priceText;
                
                if (roomName && price) {
                    // Clean price (remove currency symbols, commas, convert to float)
                    price = parseFloat(price.replace(/[^0-9.]/g, ''));

                    if (!isNaN(price)) {
                        try {
                            // Find or Create the RoomType for the scraped room
                            const [roomTypeEntry, createdRoomType] = await RoomType.findOrCreate({
                                where: {
                                    name: roomName,
                                    hotel_id: hotelPropertyId
                                },
                                defaults: {
                                    capacity: 2 // Assuming max_occupancy 2 for general case, adjust if Expedia provides this
                                }
                            });

                            if (createdRoomType) {
                                console.log(`Created new RoomType entry for "${roomName}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                            } else {
                                console.log(`Found existing RoomType entry for "${roomName}" (ID: ${roomTypeEntry.id}) for Hotel ID: ${hotelPropertyId}`);
                            }

                            // Delete existing records for this specific UploadData (and thus checkin/checkout date/platform)
                            // This ensures we always have the latest scrape for the given date.
                            try {
                                const deleteResult = await UploadedExtractDataFile.destroy({
                                    where: {
                                        uploadDataId: newUploadDataEntry.id,
                                        userId: userID,
                                        checkIn: formattedCheckin,
                                        checkOut: formattedCheckout,
                                        platform: 'Expedia'
                                    }
                                });
                                console.log(`Deleted ${deleteResult} existing UploadedExtractDataFile entries for UploadData ID: ${newUploadDataEntry.id}, dates ${formattedCheckin}-${formattedCheckout} (Expedia).`);
                            } catch (deleteError) {
                                console.error(`Error deleting existing UploadedExtractDataFile entries for UploadData ID ${newUploadDataEntry.id} (Expedia, Day ${i}):`, deleteError);
                            }

                            // Create new UploadedExtractDataFile entry for the scraped room
                            const createdEntry = await UploadedExtractDataFile.create({
                                uploadDataId: newUploadDataEntry.id,
                                userId: userID,
                                checkIn: formattedCheckin,
                                checkOut: formattedCheckout,
                                platform: 'Expedia',
                                roomType: roomName,
                                roomTypeId: roomTypeEntry.id, // Associate with the RoomType
                                rate: price,
                                date: formattedCheckin, 
                                isValid: true,
                            });
                            console.log(`Created new UploadedExtractDataFile entry for room "${roomName}" with rate ${price} (hotel ${hotelPropertyId}) for dates ${formattedCheckin}-${formattedCheckout}:`, createdEntry.toJSON());
                            currentDayExtractedDataFiles.push(createdEntry.toJSON()); // Add to the array for this day

                            // Update UploadData status to 'saved' as data has been extracted and stored
                            await newUploadDataEntry.update({ status: 'saved' });

                        } catch (entryError) {
                            console.error(`Error creating UploadedExtractDataFile or RoomType entry for Expedia room (hotel ${hotelPropertyId}, dates ${formattedCheckin}-${formattedCheckout}):`, entryError);
                            if (newUploadDataEntry) {
                                await newUploadDataEntry.update({ status: 'failed' });
                            }
                        }
                    } else {
                        console.warn(`Invalid parsed price for room "${roomName}" (Expedia, Day ${i}): "${scrapeResult.priceText}". Skipping database entry.`);
                        if (newUploadDataEntry) {
                            await newUploadDataEntry.update({ status: 'failed' });
                        }
                    }
                } else {
                    console.log(`No room name or price found in Expedia scrape for hotel ${hotelPropertyId} on dates ${formattedCheckin}-${formattedCheckout}.`);
                    if (newUploadDataEntry) {
                        await newUploadDataEntry.update({ status: 'failed' });
                    }
                }

                // Push the response for the current day, including its extracted data
                allProcessedResponses.push({
                    scrapeSourceHotel: scrapeSourceHotel.toJSON(),
                    checkin_date: formattedCheckin,
                    checkout_date: formattedCheckout,
                    expedia_scrape_summary: {
                        roomName: roomName,
                        price: scrapeResult.priceText,
                        scrape_status: scrapeResult.status
                    },
                    uploaded_extracted_file_entries: currentDayExtractedDataFiles, // Now includes data for this day
                });
            }
        }

        return res.status(200).json({
            message: "Successfully processed all Expedia ScrapeSourceHotel records and extracted/updated API details.",
            data: allProcessedResponses
        });

    } catch (error) {
        console.error("Critical error in scrapeExpediaHotelDetail:", error);
        return res.status(500).json({
            message: "Internal server error during Expedia scraping process.",
            error: error.message
        });
    }
};