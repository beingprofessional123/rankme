// src/utils/csvTemplates.js

const csvTemplates = {
  booking: [
    "Check-in",
    "Check-out",
    "Room Type",
    "Rate",
    "Source",
    // Add any other specific booking fields your backend expects or are common
  ],
  str_ocr_report: [
    "Report Type",
    "Date",
    "Room Type",
    "Rate",
    "Occupancy",
    "ADR (USD)", // Use the exact header you provided in your CSV
    "RevPAR (USD)", // Use the exact header you provided in your CSV
  ],
  property_price_data: [ // ADD THIS NEW ENTRY
    'Date', // Assuming this is derived from the first column if the first row is metadata
    'My Property',
    'Comp Avg',
    'Comp #1',
    'Comp #2',
    'Comp #3',
    'Comp #4',
    'Comp #5',
  ],
};

export default csvTemplates;