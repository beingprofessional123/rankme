const { Op } = require('sequelize');
const db = require('../models');
const { UploadData, MetaUploadData, UploadedExtractDataFile, Hotel, Config } = db;
const OpenAI = require('openai');
const dayjs = require('dayjs');

// Remove the hardcoded initialization outside the function
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const cleanAndParseAIOutput = (rawText, daysToForecast) => {
  const lines = rawText.trim().split('\n').slice(0, daysToForecast);
  return lines.map(line => {
    const [date, value] = line.split(',').map(s => s.trim());
    return {
      date: dayjs(date).format("YYYY-MM-DD"),
      value: parseFloat(value),
    };
  }).filter(entry => !isNaN(entry.value));
};

exports.getHotelForecast = async (req, res) => {
  try {
    // --- Fetch API Key from Database ---
    const openaiKeyRecord = await Config.findOne({
      where: { key: 'OPENAI_API_KEY' }
    });

    if (!openaiKeyRecord) {
      return res.status(500).json({ error: 'OpenAI API key not found in the database.' });
    }

    const openai = new OpenAI({
      apiKey: openaiKeyRecord.value,
    });
    
    const { hotelId, startDate, endDate } = req.query;
    const { user } = req;
    const companyId = user.company_id;
    const userId = user.id;
    const daysToForecast = dayjs(endDate).diff(dayjs(startDate), 'days') + 1;

    if (!hotelId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Hotel ID, start date, and end date are required.' });
    }

    // Fetch Hotel Name to use in the query
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found.' });
    }
    const hotelName = hotel.name;

    // --- Fetch Historical Occupancy Data ---
    const occupancyUploads = await UploadData.findAll({
      where: {
        userId,
        companyId,
        fileType: 'booking',
        status: 'saved',
      },
      include: {
        model: MetaUploadData,
        as: 'metaData',
        where: {
          hotelPropertyId: hotelId,
        },
        required: true,
      },
    });

    const occupancyUploadIds = occupancyUploads.map(upload => upload.id);

    const historicalOccupancy = await UploadedExtractDataFile.findAll({
      where: {
        uploadDataId: { [Op.in]: occupancyUploadIds },
        isValid: true,
        checkIn: {
          [Op.not]: null
        }
      },
      attributes: ['checkIn', 'occupancy'],
      order: [['checkIn', 'ASC']],
    });

    // --- Fetch Historical Price Data ---
    const priceUploads = await UploadData.findAll({
      where: {
        userId,
        companyId,
        fileType: 'property_price_data',
        status: 'saved',
      },
      include: {
        model: MetaUploadData,
        as: 'metaData',
        where: {
          hotelPropertyId: hotelId,
        },
        required: true,
      },
    });

    const priceUploadIds = priceUploads.map(upload => upload.id);

    const historicalPrices = await UploadedExtractDataFile.findAll({
      where: {
        uploadDataId: { [Op.in]: priceUploadIds },
        isValid: true,
        competitorHotel: hotelName,
        checkIn: {
          [Op.not]: null
        },
        rate: {
          [Op.not]: null
        }
      },
      attributes: ['checkIn', 'rate'],
      order: [['checkIn', 'ASC']],
    });
    
    // Check if any data was found for either metric
    if (!historicalOccupancy.length && !historicalPrices.length) {
      return res.status(404).json({ message: 'No relevant historical data found to generate a forecast for either occupancy or price.' });
    }

    console.log(historicalPrices);
    
    let occupancyForecast = [];
    if (historicalOccupancy.length) {
      const occupancyDataStr = historicalOccupancy
        .map(d => `${d.checkIn}, ${d.occupancy}`)
        .join('\n');

      const occupancyPrompt = `
        You are an expert in hotel revenue management. Based on the following historical hotel occupancy data, predict the occupancy for the next ${daysToForecast} days starting from the date ${startDate}.
        Historical Data:
        date, occupancy_percentage
        ${occupancyDataStr}

        Rules:
        - Output exactly ${daysToForecast} lines.
        - Start the forecast from the day specified in the start date parameter.
        - Date format: YYYY-MM-DD
        - Occupancy as a number with a maximum of 2 decimal places (no % sign).
        - The output should only contain the forecast data in the following format:
        date, occupancy
      `;

      const aiOccupancyResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini", // Corrected model name
        messages: [{ role: "user", content: occupancyPrompt }],
        temperature: 0.7,
      });

      const forecastOccupancyText = aiOccupancyResponse.choices[0].message.content;
      occupancyForecast = cleanAndParseAIOutput(forecastOccupancyText, daysToForecast);
    }
    
    let priceForecast = [];
    if (historicalPrices.length) {
      const priceDataStr = historicalPrices
        .map(d => `${d.checkIn}, ${d.rate}`)
        .join('\n');

      const pricePrompt = `
        You are an expert in hotel revenue management. Based on the following historical hotel room rate data, predict the room rate for the next ${daysToForecast} days starting from the date ${startDate}.
        Historical Data:
        date, room_rate
        ${priceDataStr}

        Rules:
        - Output exactly ${daysToForecast} lines.
        - Start the forecast from the day specified in the start date parameter.
        - Date format: YYYY-MM-DD
        - Room rate as a number with a maximum of 2 decimal places (no $ sign).
        - The output should only contain the forecast data in the following format:
        date, rate
      `;

      const aiPriceResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini", // Corrected model name
        messages: [{ role: "user", content: pricePrompt }],
        temperature: 0.7,
      });

      const forecastPriceText = aiPriceResponse.choices[0].message.content;
        console.log('Raw AI Price Response:', forecastPriceText);
      priceForecast = cleanAndParseAIOutput(forecastPriceText, daysToForecast);
    }

    // Combine and format the final output
    const combinedForecast = [];
    const dates = new Set([...occupancyForecast.map(d => d.date), ...priceForecast.map(d => d.date)]);

    for (const date of Array.from(dates).sort()) {
      const occEntry = occupancyForecast.find(d => d.date === date);
      const priceEntry = priceForecast.find(d => d.date === date);

      combinedForecast.push({
        date,
        forecastedOccupancy: occEntry ? `${occEntry.value.toFixed(2)}%` : 'N/A',
        forecastedRate: priceEntry ? `$${priceEntry.value.toFixed(2)}` : 'N/A',
      });
    }

    res.status(200).json(combinedForecast);

  } catch (error) {
    console.error('Error fetching hotel forecast:', error);
    res.status(500).json({ error: 'Internal server error.', message: error.message });
  }
};