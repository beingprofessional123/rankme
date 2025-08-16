const { Op } = require('sequelize');
const db = require('../models');
const { UploadData, MetaUploadData, UploadedExtractDataFile } = db;
const OpenAI = require('openai');
const dayjs = require('dayjs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
        userId,
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
      return res.status(404).json({ message: 'No forecast data found.' });
    }

    const forecastData = await UploadedExtractDataFile.findAll({
      where: { uploadDataId: metaData.uploadDataId },
      attributes: ['checkIn', 'occupancy'],
      order: [['checkIn', 'ASC']],
    });

    if (!forecastData.length) {
      return res.status(404).json({ message: 'No specific forecast data points found.' });
    }

    const historicalDataStr = forecastData
      .map(d => `${d.checkIn}, ${d.occupancy}`)
      .join('\n');

    const prompt = `
      You are given historical hotel occupancy data:
      date, occupancy_percentage
      ${historicalDataStr}

      Predict occupancy for the next 30 days after the last date.
      Rules:
      - Output exactly 30 lines.
      - Date format: YYYY-MM-DD
      - Occupancy as a number with max 2 decimals (no % sign).
      - Format: date, occupancy
    `;

    const aiResponse = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const forecastText = aiResponse.output_text.trim();

    // Parse AI output safely
    const futureForecast = forecastText
      .split("\n")
      .map(line => {
        const [date, occ] = line.split(",").map(s => s.trim());
        return {
          date: dayjs(date).format("YYYY-MM-DD"),
          forecastedOccupancy: parseFloat(occ),
        };
      })
      .filter(entry => !isNaN(entry.forecastedOccupancy));

    res.status(200).json({
      historical: forecastData.map(d => ({
        date: dayjs(d.checkIn).format("YYYY-MM-DD"),
        occupancy: parseFloat(d.occupancy),
      })),
      forecast: futureForecast,
    });

  } catch (error) {
    console.error('Error fetching hotel forecast:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
