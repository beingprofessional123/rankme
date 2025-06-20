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
  competitor: [
    "Competitor Hotel",
    "Date",
    "Room Type",
    "Rate",
    // Add any other specific competitor fields
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
};

export default csvTemplates;