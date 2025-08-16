// src/controllers/forecastController.js
const { Op } = require('sequelize');
const db = require('../models');
const { UploadData, MetaUploadData, UploadedExtractDataFile } = db;
const OpenAI = require('openai'); // npm install openai

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // store your API key in .env
});

exports.getHotelForecast = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    const { user } = req;
    const companyId = user.company_id;
    const userId = user.id;

    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel ID is required.' });
    }

    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = startDate;
    if (endDate) dateFilter[Op.lte] = endDate;

    const metaData = await MetaUploadData.findOne({
      where: {
        userId: userId,
        hotelPropertyId: hotelId,
        ...(Object.keys(dateFilter).length > 0 && {
          [Op.or]: [
            { fromDate: dateFilter },
            { toDate: dateFilter }
          ]
        })
      },
      include: [
        {
          model: UploadData,
          required: true,
          where: { companyId },
        },
      ],
    });

    if (!metaData) {
      return res.status(404).json({ message: 'No forecast data found for the selected hotel and date range.' });
    }

    const forecastData = await UploadedExtractDataFile.findAll({
      where: { uploadDataId: metaData.uploadDataId },
      attributes: ['checkIn', 'occupancy'],
      order: [['checkIn', 'ASC']],
    });

    if (!forecastData || forecastData.length === 0) {
      return res.status(404).json({ message: 'No specific forecast data points found for this upload.' });
    }

    // Convert old data into CSV string for OpenAI prompt
    const historicalDataStr = forecastData
      .map(d => `${d.checkIn}, ${d.occupancy}%`)
      .join('\n');

    // OpenAI Prompt
    const prompt = `
        You are given historical occupancy data for a hotel in the format:
        date, occupancy_percentage
        ${historicalDataStr}

        Based on this historical trend, predict occupancy percentages for the next 30 days after the last given date.
        Output ONLY in the format:
        date, forecasted_occupancy_percentage
        `;

    // Call OpenAI
    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini", // lightweight but accurate
      input: prompt,
    });

    const forecastText = aiResponse.output_text.trim();

    // Parse AI response into JSON
    const futureForecast = forecastText.split("\n").map(line => {
      const [date, occ] = line.split(",").map(s => s.trim());
      return { date, forecastedOccupancy: occ };
    });

    // Send both historical and forecast data to frontend
    return res.status(200).json({
      historical: forecastData.map(d => ({
        date: d.checkIn,
        occupancy: `${d.occupancy}%`,
      })),
      forecast: futureForecast,
    });

  } catch (error) {
    console.error('Error fetching hotel forecast data:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
