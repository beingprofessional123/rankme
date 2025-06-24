// src/controllers/uploadDataController.js

const db = require('../models');
const UploadData = db.UploadData;
const MetaUploadData = db.MetaUploadData;
const UploadedExtractDataFile = db.UploadedExtractDataFile;
const csv = require('csv-parser');
const xlsx = require('xlsx');
const stream = require('stream');

// --- Helper Functions ---
const parseFile = async (fileBuffer, originalname, mimeType) => {
    return new Promise((resolve, reject) => {
        let results = [];

        const convertExcelDates = (jsonData, worksheet) => {
            // Columns that might contain dates in various common spellings
            const dateColumns = ['Date', 'date', 'Check-in', 'Check-out', 'check_in', 'check_out', 'Checkin Date', 'Checkout Date'];
            const sheetData = worksheet; // The raw worksheet object

            return jsonData.map((row, rowIndex) => {
                let newRow = { ...row };
                for (const col of dateColumns) {
                    // Check if the column exists and its value is a number (Excel's way of storing dates)
                    if (newRow[col] !== undefined && newRow[col] !== null && typeof newRow[col] === 'number') {
                        // Find the corresponding cell in the raw worksheet to check its type
                        // This is a more robust way to find the cell that corresponds to the current row's data and column name
                        const cellAddress = xlsx.utils.encode_cell({ r: rowIndex + 1, c: Object.keys(row).findIndex(header => header === col) });
                        const cell = sheetData[cellAddress];

                        // If cell exists and is a number type in Excel
                        if (cell && cell.t === 'n') {
                            const parsed = xlsx.SSF.parse_date_code(newRow[col]);
                            if (parsed && !isNaN(parsed.y) && !isNaN(parsed.m) && !isNaN(parsed.d)) {
                                const yyyy = parsed.y.toString().padStart(4, '0');
                                const mm = parsed.m.toString().padStart(2, '0');
                                const dd = parsed.d.toString().padStart(2, '0');
                                newRow[col] = `${yyyy}-${mm}-${dd}`;
                            } else {
                                // If parsing fails, it might be a valid number but not a date. Keep original or set to null.
                                // For now, we'll keep the original number, and validation will handle it.
                            }
                        }
                    }
                }
                return newRow;
            });
        };


        if (mimeType === 'text/csv' || originalname.endsWith('.csv')) {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (error) => {
                    console.error('CSV Parsing Error:', error);
                    reject(new Error('Failed to parse CSV file. Please check its format.'));
                });

        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel' ||
            originalname.endsWith('.xlsx') ||
            originalname.endsWith('.xls')
        ) {
            try {
                const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: false });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) return reject(new Error('Excel file is empty or has no accessible sheets.'));
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) return reject(new Error('Excel worksheet could not be read.'));

                let jsonData = xlsx.utils.sheet_to_json(worksheet, { raw: true });
                jsonData = convertExcelDates(jsonData, worksheet);

                resolve(jsonData);
            } catch (error) {
                console.error('Excel Parsing Error:', error);
                reject(new Error('Failed to parse Excel file. Please check its format.'));
            }
        } else {
            reject(new Error('Unsupported file type. Please upload CSV or Excel files.'));
        }
    });
};

// --- API 1: Extract and Preview ---
exports.extractAndPreviewData = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded for extraction.' });

        const user = req.user;
        if (!user || !user.id || !user.company_id) {
            return res.status(401).json({ message: 'Authentication error: User ID or Company ID missing from token.' });
        }

        const { fileType } = req.body;
        // Updated to include 'property_price_data'
        if (!fileType || !['booking', 'competitor', 'str_ocr_report', 'property_price_data'].includes(fileType)) {
            return res.status(400).json({ message: 'Invalid or missing fileType in request body. Must be "booking", "competitor", "str_ocr_report", or "property_price_data".' });
        }

        const fileBuffer = req.file.buffer;
        const originalname = req.file.originalname;
        const mimeType = req.file.mimetype;

        let parsedData;
        try {
            parsedData = await parseFile(fileBuffer, originalname, mimeType);
        } catch (parseError) {
            return res.status(400).json({ message: `File parsing error: ${parseError.message}` });
        }

        if (!parsedData.length) {
            return res.status(400).json({ message: 'Uploaded file is empty or contains no valid data rows after parsing.' });
        }

        const uploadDataRecord = await UploadData.create({
            userId: user.id,
            companyId: user.company_id,
            originalFileName: originalname,
            filePath: null, // You might want to save the file path if storing
            fileType: fileType,
            status: 'extracted',
        }, { transaction: t });

        const extractedDataRows = [];
        const errors = [];

        parsedData.forEach((row, index) => {
            const rowIndex = index + 1; // 1-based index for user-friendly error messages
            const rowErrors = [];
            let isValidRow = true;
            let rowData = {
                uploadDataId: uploadDataRecord.id,
                userId: user.id,
                // Initialize fields to null or undefined to ensure they are present
                // in the object even if not set by getValue or specific logic
                checkIn: null,
                checkOut: null,
                roomType: null,
                rate: null,
                source: null,
                competitorHotel: null,
                date: null,
                reportType: null,
                occupancy: null,
                adrUsd: null,
                revParUsd: null,
                platform: null // Initialize the new 'platform' field
            };

            // Helper to safely get value, handling common casing and trimming
            const getValue = (fields) => {
                for (const field of fields) {
                    // Normalize the row keys to handle inconsistencies (trim, lowercase)
                    const normalizedRow = {};
                    for (const key in row) {
                        normalizedRow[key.trim().toLowerCase()] = row[key];
                    }

                    // Check original key, then lowercase, then remove spaces and lowercase
                    const value = row[field] !== undefined ? row[field] :
                                  row[field.toLowerCase()] !== undefined ? row[field.toLowerCase()] :
                                  row[field.replace(/ /g, '').toLowerCase()] !== undefined ? row[field.replace(/ /g, '').toLowerCase()] :
                                  undefined; // Ensure this returns undefined if not found

                    if (value !== undefined && value !== null) {
                        return String(value).trim();
                    }
                }
                return null; // Return null if none of the fields are found or are empty
            };

            // Common mapping for all file types where applicable
            const commonRoomType = getValue(['Room Type', 'room_type', 'RoomType']);
            if (commonRoomType) {
                rowData.roomType = commonRoomType;
            }

            const commonRate = getValue(['Rate', 'rate', 'Price', 'price']); // Added 'Price' for property price tab
            if (commonRate) {
                const cleanedRate = String(commonRate).replace(/[^0-9.]/g, '');
                if (!isNaN(parseFloat(cleanedRate)) && parseFloat(cleanedRate) >= 0) {
                    rowData.rate = parseFloat(cleanedRate);
                } else {
                    rowErrors.push({ field: 'Rate/Price', message: 'Invalid Rate/Price format. Must be a non-negative number.' });
                    isValidRow = false;
                }
            }


            // Type-specific field mapping and validation
            switch (fileType) {
                case 'booking':
                    const checkIn = getValue(['Check-in', 'check_in', 'Checkin Date']);
                    const checkOut = getValue(['Check-out', 'check_out', 'Checkout Date']);
                    const source = getValue(['Source', 'source']);

                    if (!checkIn || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
                        rowErrors.push({ field: 'Check-in', message: 'Missing or invalid Check-in date (YYYY-MM-DD).' });
                        isValidRow = false;
                    }
                    if (!checkOut || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
                        rowErrors.push({ field: 'Check-out', message: 'Missing or invalid Check-out date (YYYY-MM-DD).' });
                        isValidRow = false;
                    }
                    if (!commonRoomType) {
                        rowErrors.push({ field: 'Room Type', message: 'Missing Room Type.' });
                        isValidRow = false;
                    }
                    if (rowData.rate === undefined || rowData.rate === null) {
                        rowErrors.push({ field: 'Rate', message: 'Missing or invalid Rate.' });
                        isValidRow = false;
                    }
                    if (!source) {
                        rowErrors.push({ field: 'Source', message: 'Missing Source.' });
                        isValidRow = false;
                    }

                    rowData = {
                        ...rowData,
                        checkIn: checkIn || null,
                        checkOut: checkOut || null,
                        source: source || null,
                    };
                    break;

                case 'competitor':
                    const competitorHotel = getValue(['Competitor Hotel', 'competitor_hotel', 'CompetitorHotel']);
                    const competitorDate = getValue(['Date', 'date']);
                    const competitorPlatform = getValue(['Platform', 'platform']); // Competitor data might also have a platform

                    if (!competitorHotel) {
                        rowErrors.push({ field: 'Competitor Hotel', message: 'Missing Competitor Hotel name.' });
                        isValidRow = false;
                    }
                    if (!competitorDate || !/^\d{4}-\d{2}-\d{2}$/.test(competitorDate)) {
                        rowErrors.push({ field: 'Date', message: 'Missing or invalid Date (YYYY-MM-DD).' });
                        isValidRow = false;
                    }
                    if (!commonRoomType) {
                        rowErrors.push({ field: 'Room Type', message: 'Missing Room Type.' });
                        isValidRow = false;
                    }
                    if (rowData.rate === undefined || rowData.rate === null) {
                        rowErrors.push({ field: 'Rate', message: 'Missing or invalid Rate.' });
                        isValidRow = false;
                    }
                    // Platform is also relevant for competitor data
                    if (competitorPlatform) {
                        rowData.platform = competitorPlatform;
                    }


                    rowData = {
                        ...rowData,
                        competitorHotel: competitorHotel || null,
                        date: competitorDate || null,
                    };
                    break;

                case 'str_ocr_report':
                    const reportType = getValue(['Report Type', 'report_type', 'ReportType']);
                    const reportDate = getValue(['Date', 'date']);
                    const occupancy = getValue(['Occupancy', 'occupancy']);
                    const adrUsd = getValue(['ADR (USD)', 'adr_usd', 'ADRUSD']);
                    const revParUsd = getValue(['RevPAR (USD)', 'rev_par_usd', 'RevPARUSD']);

                    if (!reportType) {
                        rowErrors.push({ field: 'Report Type', message: 'Missing Report Type.' });
                        isValidRow = false;
                    }
                    if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
                        rowErrors.push({ field: 'Date', message: 'Missing or invalid Date (YYYY-MM-DD).' });
                        isValidRow = false;
                    }
                    if (!occupancy) {
                        rowErrors.push({ field: 'Occupancy', message: 'Missing Occupancy.' });
                        isValidRow = false;
                    }
                    if (!adrUsd) {
                        rowErrors.push({ field: 'ADR (USD)', message: 'Missing ADR (USD).' });
                        isValidRow = false;
                    }
                    if (!revParUsd) {
                        rowErrors.push({ field: 'RevPAR (USD)', message: 'Missing RevPAR (USD).' });
                        isValidRow = false;
                    }

                    rowData = {
                        ...rowData,
                        reportType: reportType || null,
                        date: reportDate || null,
                        occupancy: occupancy || null,
                        adrUsd: adrUsd || null,
                        revParUsd: revParUsd || null,
                    };
                    break;

                case 'property_price_data': // NEW CASE FOR PROPERTY PRICE
                    const priceDate = getValue(['Date', 'date']);
                    const propertyPriceRoomType = getValue(['room_type', 'Room Type', 'RoomType']); // Use commonRoomType if that's sufficient
                    const platform = getValue(['Platform', 'platform']);

                    if (!priceDate || !/^\d{4}-\d{2}-\d{2}$/.test(priceDate)) {
                        rowErrors.push({ field: 'Date', message: 'Missing or invalid Date (YYYY-MM-DD).' });
                        isValidRow = false;
                    }
                    if (!propertyPriceRoomType) {
                        rowErrors.push({ field: 'Room Type', message: 'Missing Room Type.' });
                        isValidRow = false;
                    }
                    // Validate price using the already parsed commonRate which uses 'Price' or 'price'
                    if (rowData.rate === undefined || rowData.rate === null) {
                        rowErrors.push({ field: 'Price', message: 'Missing or invalid Price.' });
                        isValidRow = false;
                    }
                    if (!platform) {
                        rowErrors.push({ field: 'Platform', message: 'Missing Platform.' });
                        isValidRow = false;
                    }

                    rowData = {
                        ...rowData,
                        date: priceDate || null,
                        roomType: propertyPriceRoomType || null, // Ensure roomType is set here
                        platform: platform || null, // Set the new platform field
                        // rate is already handled by commonRate
                    };
                    break;

                default:
                    // This case should ideally not be reached if the initial check for fileType is thorough
                    console.warn(`Unknown fileType: ${fileType}. No specific validation applied.`);
            }

            extractedDataRows.push({
                ...rowData,
                isValid: isValidRow,
                validationErrors: isValidRow ? [] : rowErrors,
            });

            if (!isValidRow) {
                errors.push({ rowIndex, errors: rowErrors });
            }
        });

        await UploadedExtractDataFile.bulkCreate(extractedDataRows, { transaction: t });
        await t.commit();

        res.status(200).json({
            message: 'File extracted and data preview generated successfully.',
            uploadId: uploadDataRecord.id,
            fileType: uploadDataRecord.fileType, // Confirm the fileType
            previewData: extractedDataRows,
            totalRows: parsedData.length,
            invalidRowsCount: errors.length,
            errors,
        });

    } catch (error) {
        await t.rollback();
        console.error('Error in extractAndPreviewData:', error);
        res.status(500).json({
            message: 'An unexpected error occurred during data extraction. Please try again.',
            error: error.message,
        });
    }
};

// --- API 2: Confirm and Save ---
// This API does not require specific changes for 'property_price_data'
// as it just confirms the `uploadId` and saves metadata, which are generic.
exports.confirmAndSaveData = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { uploadId, dateRangeFrom, dateRangeTo, dataSourceName, hotelPropertyId } = req.body;

        if (!uploadId) {
            return res.status(400).json({ message: 'Missing upload ID for confirmation.' });
        }

        const user = req.user;
        if (!user || !user.id || !user.company_id) {
            return res.status(401).json({ message: 'Authentication error: User ID or Company ID missing from token.' });
        }

        const uploadDataRecord = await UploadData.findOne({
            where: {
                id: uploadId,
                userId: user.id,
                companyId: user.company_id,
                status: 'extracted', // Ensure the file has been extracted first
            },
            transaction: t,
        });

        if (!uploadDataRecord) {
            return res.status(404).json({ message: 'Upload record not found or not in a savable state.' });
        }

        // Create MetaUploadData record
        const metaUploadDataRecord = await MetaUploadData.create({
            uploadDataId: uploadId,
            userId: user.id,
            dataSourceName: dataSourceName || null,
            hotelPropertyId: hotelPropertyId || null,
            fromDate: dateRangeFrom || null,
            toDate: dateRangeTo || null,
        }, { transaction: t });

        // Update the status of the main UploadData record
        await uploadDataRecord.update({ status: 'saved' }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: `Data from upload ID ${uploadId} confirmed and saved successfully.`,
            status: 'saved',
            uploadId,
            metaDataId: metaUploadDataRecord.id,
        });

    } catch (error) {
        await t.rollback();
        console.error('Error in confirmAndSaveData:', error);
        res.status(500).json({
            message: 'An unexpected error occurred while confirming data.',
            error: error.message,
        });
    }
};