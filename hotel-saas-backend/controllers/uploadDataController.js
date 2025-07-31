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

        // Handle CSV
        if (mimeType === 'text/csv' || originalname.endsWith('.csv')) {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    // For CSV, dates are usually strings, so no specific Excel date conversion needed here.
                    // However, we can still attempt to normalize common date fields if they are inconsistent.
                    const dateColumns = ['Date', 'date', 'Check-in', 'Check-out', 'check_in', 'check_out', 'Checkin Date', 'Checkout Date'];
                    const normalizedResults = results.map(row => {
                        const newRow = { ...row };
                        for (const col of dateColumns) {
                            if (newRow[col] && typeof newRow[col] === 'string') {
                                // Attempt to parse and reformat if it looks like a date
                                const parsed = new Date(newRow[col]);
                                if (!isNaN(parsed.getTime())) {
                                    newRow[col] = parsed.toISOString().split('T')[0];
                                }
                            }
                        }
                        return newRow;
                    });
                    resolve(normalizedResults);
                })
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
                // For Excel, dateNf: true will automatically format Excel dates into 'YYYY-MM-DD' strings for sheet_to_json.
                // However, for 'str_ocr_report' we need raw: true to get the header as an array for manual mapping.
                // So, we won't use dateNf here, and will handle date conversion for dates when raw:true is used.
                const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) return reject(new Error('Excel file is empty or has no accessible sheets.'));

                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) return reject(new Error('Excel worksheet could not be read.'));

                // For generic Excel parsing (not property_price_data or str_ocr_report which handle raw data),
                // use sheet_to_json to get objects directly.
                // Note: If you want dates here as YYYY-MM-DD, you'd use dateNf: true
                const jsonData = xlsx.utils.sheet_to_json(worksheet); // { raw: false, dateNf: true } could be added here if needed

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

        const user = req.user; // Assuming req.user is populated by authentication middleware
        if (!user || !user.id || !user.company_id) {
            return res.status(401).json({ message: 'Authentication error: User ID or Company ID missing from token.' });
        }

        const { fileType, hotel_property_name } = req.body; // Destructure hotel_property_name from req.body
        if (!fileType || !['booking', 'competitor', 'str_ocr_report', 'property_price_data'].includes(fileType)) {
            return res.status(400).json({ message: 'Invalid or missing fileType in request body. Must be "booking", "competitor", "str_ocr_report", or "property_price_data".' });
        }

        const fileBuffer = req.file.buffer;
        const originalname = req.file.originalname;
        const mimeType = req.file.mimetype;

        let parsedData; // This will hold the parsed data from parseFile for generic cases.

        // Helper function to get value robustly, considering various header formats
        const getValue = (rowObject, fields) => {
            for (const field of fields) {
                const trimmedField = field.trim();
                // Direct match
                if (rowObject[trimmedField] !== undefined && rowObject[trimmedField] !== null) {
                    return String(rowObject[trimmedField]).trim();
                }
                // Case-insensitive, no-space match
                const noSpaceNormalizedField = trimmedField.toLowerCase().replace(/ /g, '');
                for (const key in rowObject) {
                    if (key.trim().toLowerCase().replace(/ /g, '') === noSpaceNormalizedField) {
                        if (rowObject[key] !== undefined && rowObject[key] !== null) {
                            return String(rowObject[key]).trim();
                        }
                    }
                }
                // Case-insensitive match (with spaces)
                const lowerCaseField = trimmedField.toLowerCase();
                for (const key in rowObject) {
                    if (key.trim().toLowerCase() === lowerCaseField) {
                        if (rowObject[key] !== undefined && rowObject[key] !== null) {
                            return String(rowObject[key]).trim();
                        }
                    }
                }
            }
            return null;
        };
        const uploadDataRecord = await UploadData.create({
            userId: user.id,
            companyId: user.company_id,
            originalFileName: originalname,
            filePath: null, // filePath will be handled by a storage service, or removed if not needed.
            fileType: fileType,
            status: 'extracted',
        }, { transaction: t });

        const extractedDataRows = [];
        const errors = [];

        // Special handling for property_price_data and str_ocr_report due to specific Excel structure
        if (fileType === 'property_price_data') {
            try {
                // Re-read with header: 1 to get raw array of arrays and handle headers manually.
                const workbook = xlsx.read(fileBuffer, { type: 'buffer' }); // Read raw for manual processing
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) throw new Error('Sheet is empty.');

                const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true }); // Get raw numbers for dates
                if (rawRows.length < 2) {
                    await t.rollback();
                    return res.status(400).json({ message: 'File must contain at least 2 rows: headers and data.' });
                }

                const headerRow = rawRows[0]; // e.g., "", "My Property", "Comp Avg", "Comp #1"
                const actualHotelNamesRow = rawRows[1]; // e.g., "Property", "Baymont by Wyndham Adairsville", "Martket Average Rate", "Quality Inn Adairsville - Calhoun South, Ad"
                const dataRows = rawRows.slice(2); // Actual data starts from the third row onwards

                const finalData = []; // This will store only valid records
                const dateRowErrors = [];

                const dateColIndex = 0; // Assuming date is always the first column
                const myPropertyNameFromHeader = headerRow[1] || null; // "My Property"

                // HERE IS THE CHANGE: Use req.body.hotel_property_name as fallback
                const myActualHotelName = (actualHotelNamesRow[1] && actualHotelNamesRow[1].trim() !== '') ? actualHotelNames[1].trim() : (hotel_property_name || null);

                const sourceValue = 'Online';
                const platform = 'Online';

                const hotelNameMap = {};
                // Populate hotelNameMap with actual hotel names from the second row
                // Map header (e.g., "My Property", "Comp #1") to actual hotel name
                headerRow.forEach((headerName, idx) => {
                    if (headerName && typeof headerName === 'string' && actualHotelNamesRow[idx] && typeof actualHotelNamesRow[idx] === 'string') {
                        hotelNameMap[headerName.trim()] = actualHotelNamesRow[idx].trim();
                    }
                });

                const competitorHeaders = headerRow
                    .map((val, i) => ({ index: i, name: val }))
                    .filter(obj =>
                        obj.index > 1 && // skip Date and My Property
                        obj.name &&
                        typeof obj.name === 'string' &&
                        obj.name.trim().toLowerCase() !== 'comp avg'
                    );


                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    const rowIndex = i + 3; // 1-based index, accounting for 2 header rows
                    const dateRaw = row[dateColIndex]; // This will be the raw Excel number

                    let formattedDate = null;
                    let isDateRowValid = true; // Still validate the date itself
                    let currentRecordErrors = []; // Errors specific to rates in this row

                    if (dateRaw === undefined || dateRaw === null) {
                        currentRecordErrors.push(`Missing date at row ${rowIndex}`);
                        isDateRowValid = false;
                    } else {
                        if (typeof dateRaw === 'number') {
                            // Convert Excel serial date number to JavaScript Date
                            const parsedDate = xlsx.SSF.parse_date_code(dateRaw);
                            if (parsedDate && !isNaN(parsedDate.y) && !isNaN(parsedDate.m) && !isNaN(parsedDate.d)) {
                                formattedDate = `${parsedDate.y.toString().padStart(4, '0')}-${parsedDate.m.toString().padStart(2, '0')}-${parsedDate.d.toString().padStart(2, '0')}`;
                            } else {
                                currentRecordErrors.push(`Invalid date format at row ${rowIndex}`);
                                isDateRowValid = false;
                            }
                        } else if (typeof dateRaw === 'string') {
                            // If it's already a string, try to parse it
                            const parsed = new Date(dateRaw);
                            if (!isNaN(parsed.getTime())) {
                                formattedDate = parsed.toISOString().split('T')[0];
                            } else {
                                currentRecordErrors.push(`Invalid date string format at row ${rowIndex}`);
                                isDateRowValid = false;
                            }
                        } else {
                            currentRecordErrors.push(`Unexpected date type at row ${rowIndex}`);
                            isDateRowValid = false;
                        }
                    }

                    // Only proceed to process rates if the date itself is valid
                    if (isDateRowValid) {
                        const myRate = parseFloat(row[1]);
                        if (!isNaN(myRate) && myRate >= 0) {
                            finalData.push({
                                uploadDataId: uploadDataRecord.id,
                                userId: user.id,
                                competitorHotel: myActualHotelName, // Use the potentially fallback name here
                                rate: myRate,
                                checkIn: formattedDate,
                                compAvg: parseFloat(row[2]) || null, // compAvg can be null if invalid
                                platform,
                                source: sourceValue,
                                property: 'myproperty'
                            });
                        } else {
                            currentRecordErrors.push(`Invalid 'My Property' rate at row ${rowIndex}. Value: '${row[1]}'`);
                        }

                        // Competitor entries
                        for (const comp of competitorHeaders) {
                            const compRate = parseFloat(row[comp.index]);
                            if (!isNaN(compRate) && compRate >= 0) {
                                const actualCompetitorName = hotelNameMap[comp.name.trim()]; // Get actual name using the header as key
                                if (actualCompetitorName) { // Ensure we found a mapping
                                    finalData.push({
                                        uploadDataId: uploadDataRecord.id,
                                        userId: user.id,
                                        competitorHotel: actualCompetitorName,
                                        rate: compRate,
                                        checkIn: formattedDate,
                                        compAvg: parseFloat(row[2]) || null, // compAvg can be null if invalid
                                        platform,
                                        source: sourceValue,
                                        property: 'competitor'
                                    });
                                }
                            } else {
                                // Only add error to currentRecordErrors, but don't set isDateRowValid to false
                                currentRecordErrors.push(`Invalid '${comp.name}' rate at row ${rowIndex}. Value: '${row[comp.index]}'`);
                            }
                        }
                    }

                    // If there were any errors for this row (either date or individual rates)
                    if (currentRecordErrors.length > 0) {
                        dateRowErrors.push({ rowIndex, errors: currentRecordErrors });
                    }
                }

                if (finalData.length === 0 && dateRowErrors.length > 0) {
                    await t.rollback();
                    return res.status(400).json({
                        message: 'No valid data found to save. All rows had errors or contained only invalid rates.',
                        errors: dateRowErrors,
                    });
                } else if (finalData.length === 0) {
                    await t.rollback();
                    return res.status(400).json({
                        message: 'No valid data found.',
                        errors: ['Empty or invalid sheet content.'],
                    });
                }

                await UploadedExtractDataFile.bulkCreate(finalData, { transaction: t });
                await t.commit();

                return res.status(200).json({
                    message: '✅ Property price data extracted and saved successfully.',
                    uploadId: uploadDataRecord.id,
                    fileType: uploadDataRecord.fileType,
                    previewData: finalData, // This will now contain only the valid records that were pushed
                    totalRows: dataRows.length,
                    savedCount: finalData.length,
                    errors: dateRowErrors // These are the errors for rows with *any* invalid data
                });

            } catch (error) {
                await t.rollback();
                console.error('❌ Error in property_price_data handler:', error);
                return res.status(500).json({
                    message: '🚨 Internal server error while processing property price data.',
                    error: error.message,
                    trace: error.stack,
                });
            }
        }else if (fileType === 'str_ocr_report') {
                try {
                    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet) {
                        await t.rollback();
                        return res.status(400).json({ message: 'Sheet is empty or could not be read.' });
                    }

                    // Get raw data (array of arrays).
                    // {header: 1} means the first row will be returned as the first element of the outer array.
                    // {raw: true} means dates will be raw Excel serial numbers.
                    const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: true });
                    if (rawRows.length < 2) { // Need at least 2 rows for the two header lines
                        await t.rollback();
                        return res.status(400).json({ message: 'STR OCR report file must contain at least 2 rows: property name and headers.' });
                    }

                    // Extract the actual data headers from the second row of the rawRows array
                    const headers = rawRows[1].map(h => String(h).trim()); // Convert headers to strings and trim
                    const dataRows = rawRows.slice(2); // Actual data starts from the third row (index 2)

                    const extractedDataRows = []; // Renamed from processedStrOcrData for clarity with your existing logic
                    const errors = []; // Renamed from strOcrErrors to match your existing logic for errors array

                    // Define expected headers and their corresponding DB fields
                    const fieldMappings = {
                        'Date': 'checkIn', // Renaming 'Date' to 'checkIn' for DB
                        'HOTEL OCCUPANCY': 'occupancy',
                        'HOTEL ADR': 'adrUsd',
                        'REVPAR': 'revParUsd',
                        'TOTAL REVENUE': 'totalRevenue' // New field
                    };

                    // Create a mapping from header name to its index for efficient lookup
                    const headerIndexMap = {};
                    headers.forEach((header, index) => {
                        headerIndexMap[header] = index;
                    });

                    // Helper function to convert Excel serial date to YYYY-MM-DD string
                    const excelSerialDateToYYYYMMDD = (serial) => {
                        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
                        // Handle potential time zone issues by getting UTC date components
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };

                    // Helper function to parse "Month DD, YYYY" string to YYYY-MM-DD
                    const parseMonthDayYearToYYYYMMDD = (dateString) => {
                        const months = {
                            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
                            'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                        };
                        const parts = dateString.match(/(\w{3})\s(\d{1,2}),\s(\d{4})/);
                        if (parts && parts.length === 4) {
                            const month = months[parts[1]];
                            const day = parts[2].padStart(2, '0');
                            const year = parts[3];
                            return `${year}-${month}-${day}`;
                        }
                        return null;
                    };


                    for (let i = 0; i < dataRows.length; i++) {
                        const row = dataRows[i];
                        const rowIndex = i + 3; // 1-based index, accounting for two header rows
                        let currentRowErrors = [];
                        let isValidRow = true;

                        // Skip empty rows that might be present due to `raw: true` parsing
                        if (row.length === 0 || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
                            continue; // Skip completely empty rows
                        }

                        let rowData = {
                            uploadDataId: uploadDataRecord.id,
                            userId: user.id,
                            reportType: 'STR_OCR', // Assuming a static report type
                            checkIn: null,
                            occupancy: null,
                            adrUsd: null,
                            revParUsd: null,
                            totalRevenue: null, // Initialize new field
                            platform: 'Manual Upload', // Example default
                            source: 'STR OCR Report' // Example default
                        };

                        // Process 'Date' column first
                        const dateColIdx = headerIndexMap['Date'];
                        if (dateColIdx !== undefined && row[dateColIdx] !== undefined && row[dateColIdx] !== null) {
                            let dateValue = row[dateColIdx];
                            let parsedDate = null;

                            if (typeof dateValue === 'number') {
                                // Convert Excel serial date number to JavaScript Date
                                parsedDate = excelSerialDateToYYYYMMDD(dateValue);
                            } else if (typeof dateValue === 'string') {
                                // Remove day of week in parentheses like "(Sun)", "(Mon)"
                                const cleanedDateString = String(dateValue).trim().replace(/\s*\(\w+\)/g, '');
                                parsedDate = parseMonthDayYearToYYYYMMDD(cleanedDateString);
                            }

                            if (parsedDate) {
                                rowData.checkIn = parsedDate;
                            } else {
                                currentRowErrors.push({ field: 'Date', message: `Invalid date format at row ${rowIndex}. Value: '${row[dateColIdx]}'` });
                                isValidRow = false;
                            }
                        } else {
                            currentRowErrors.push({ field: 'Date', message: `Missing Date at row ${rowIndex}.` });
                            isValidRow = false;
                        }

                        // Process other numeric fields
                        const fieldsToProcess = [
                            { header: 'HOTEL OCCUPANCY', dbField: 'occupancy' },
                            { header: 'HOTEL ADR', dbField: 'adrUsd' },
                            { header: 'REVPAR', dbField: 'revParUsd' },
                            { header: 'TOTAL REVENUE', dbField: 'totalRevenue' }
                        ];

                        fieldsToProcess.forEach(({ header, dbField }) => {
                            const colIdx = headerIndexMap[header];
                            if (colIdx !== undefined && row[colIdx] !== undefined && row[colIdx] !== null) {
                                const value = parseFloat(row[colIdx]);
                                if (!isNaN(value) && value >= 0) {
                                    if (dbField === 'occupancy') {
                                        rowData[dbField] = value * 100; // Store as 64.08 instead of 0.6408
                                    } else {
                                        rowData[dbField] = value;
                                    }
                                } else {
                                    currentRowErrors.push({ field: header, message: `Invalid ${header} format at row ${rowIndex}. Value: '${row[colIdx]}'` });
                                    isValidRow = false;
                                }
                            } else {
                                if (headerIndexMap[header] !== undefined) { // Only if header exists in the sheet
                                    currentRowErrors.push({ field: header, message: `Missing ${header} at row ${rowIndex}.` });
                                    isValidRow = false;
                                }
                            }
                        });

                        // Only add to extractedDataRows if the row is valid
                        if (isValidRow) {
                            extractedDataRows.push({
                                ...rowData,
                                isValid: true,
                                validationErrors: []
                            });
                        } else {
                            // Store errors for invalid rows
                            errors.push({ rowIndex, errors: currentRowErrors });
                        }
                    } // End of for loop for dataRows

                    if (extractedDataRows.length === 0 && errors.length > 0) {
                        await t.rollback();
                        return res.status(400).json({
                            message: 'No valid data found to save. All rows had errors.',
                            errors: errors,
                        });
                    } else if (extractedDataRows.length === 0) {
                        await t.rollback();
                        return res.status(400).json({
                            message: 'No valid data found.',
                            errors: ['Empty or invalid sheet content.'],
                        });
                    }

                    await UploadedExtractDataFile.bulkCreate(extractedDataRows, { transaction: t });
                    await t.commit();

                    return res.status(200).json({
                        message: '✅ STR OCR Report data extracted and saved successfully.',
                        uploadId: uploadDataRecord.id,
                        fileType: uploadDataRecord.fileType,
                        previewData: extractedDataRows,
                        totalRows: dataRows.length,
                        savedCount: extractedDataRows.length,
                        errors: errors
                    });

                } catch (error) {
                    await t.rollback();
                    console.error('❌ Error in str_ocr_report handler:', error);
                    return res.status(500).json({
                        message: '🚨 Internal server error while processing STR OCR Report data.',
                        error: error.message,
                        trace: error.stack,
                    });
                }
            } else { // Generic handling for booking, competitor, etc., using parseFile
            try {
                parsedData = await parseFile(fileBuffer, originalname, mimeType);
            } catch (parseError) {
                await t.rollback(); // Rollback on parsing error
                return res.status(400).json({ message: `File parsing error: ${parseError.message}` });
            }

            if (!parsedData.length) {
                await t.rollback();
                return res.status(400).json({ message: 'Uploaded file is empty or contains no valid data rows after parsing.' });
            }

            // At this point, `parsedData` should be an array of objects for 'booking' or 'competitor'
            // and `getValue` function can be used.

            for (const [index, row] of parsedData.entries()) {
                const rowIndex = index + 1; // 1-based index for user readability
                let rowErrors = [];
                let isValidRow = true;
                let rowData = {
                    uploadDataId: uploadDataRecord.id,
                    userId: user.id,
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
                    platform: null
                };

                const commonRoomType = getValue(row, ['Room Type', 'room_type', 'RoomType']);
                if (commonRoomType) {
                    rowData.roomType = commonRoomType;
                }

                const commonRate = getValue(row, ['Rate', 'rate', 'Price', 'price']);
                if (commonRate) {
                    const cleanedRate = String(commonRate).replace(/[^0-9.]/g, '');
                    if (!isNaN(parseFloat(cleanedRate)) && parseFloat(cleanedRate) >= 0) {
                        rowData.rate = parseFloat(cleanedRate);
                    } else {
                        rowErrors.push({ field: 'Rate/Price', message: 'Invalid Rate/Price format. Must be a non-negative number.' });
                        isValidRow = false;
                    }
                }

                switch (fileType) {
                    case 'booking':
                        const checkIn = getValue(row, ['Check-in', 'check_in', 'Checkin Date']);
                        const checkOut = getValue(row, ['Check-out', 'check_out', 'Checkout Date']);
                        const source = getValue(row, ['Source', 'source']);

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
                        const competitorHotel = getValue(row, ['Competitor Hotel', 'competitor_hotel', 'CompetitorHotel']);
                        const competitorDate = getValue(row, ['Date', 'date']);
                        const competitorPlatform = getValue(row, ['Platform', 'platform']);

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
                        if (competitorPlatform) {
                            rowData.platform = competitorPlatform;
                        }

                        rowData = {
                            ...rowData,
                            competitorHotel: competitorHotel || null,
                            date: competitorDate || null,
                        };
                        break;
                    default:
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
            } // End of for...of loop for other file types

            await UploadedExtractDataFile.bulkCreate(extractedDataRows.filter(row => row.isValid), { transaction: t });
            await t.commit();
            console.log(extractedDataRows); // Changed from previewData to extractedDataRows
            res.status(200).json({
                message: 'File extracted and data preview generated successfully.',
                uploadId: uploadDataRecord.id,
                fileType: uploadDataRecord.fileType,
                previewData: extractedDataRows,
                totalRows: parsedData.length,
                invalidRowsCount: errors.length,
                errors,
            });
        }


    } catch (error) {
        await t.rollback();
        console.error('Error in extractAndPreviewData:', error);
        res.status(500).json({
            message: 'An unexpected error occurred during data extraction. Please try again.',
            error: error.message,
            trace: error.stack
        });
    }
};

// --- API 2: Confirm and Save ---
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
                status: 'extracted',
            },
            transaction: t,
        });

        if (!uploadDataRecord) {
            return res.status(404).json({ message: 'Upload record not found or not in a savable state.' });
        }

        const metaUploadDataRecord = await MetaUploadData.create({
            uploadDataId: uploadId,
            userId: user.id,
            dataSourceName: dataSourceName || null,
            hotelPropertyId: hotelPropertyId || null,
            fromDate: dateRangeFrom || null,
            toDate: dateRangeTo || null,
        }, { transaction: t });

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
            trace: error.stack
        });
    }
};