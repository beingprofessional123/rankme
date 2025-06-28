const db = require('../models');
const { Op } = require('sequelize');

const {
  UploadData,
  MetaUploadData,
  UploadedExtractDataFile,
} = db;

exports.getPropertyPrice = async (req, res) => {
  try {
    const { user_id: userId, company_id: companyId } = req.query;
    const fileType = 'property_price_data';

    // ✅ Validate query parameters
    if (!userId || !companyId) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        status_message: 'BAD_REQUEST',
        message: 'Missing user_id or company_id',
        results: null,
      });
    }

    // ✅ Fetch data
    const data = await UploadedExtractDataFile.findAll({
      where: { userId },
      attributes: ['uploadDataId', 'date', 'roomType', 'rate', 'platform', 'remarks'],
    });

    // ✅ Format result
    const formattedResults = data.map(item => ({
      date: item.date,
      room_type: item.roomType,
      price: item.rate,
      platform: item.platform,
      remarks: item.remarks,
    }));

    // ✅ Response with count
    res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'Property price data fetched successfully',
      count: formattedResults.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error('Error fetching property prices:', error);

    res.status(500).json({
      status: 'error',
      status_code: 500,
      status_message: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch property price data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};

exports.getBookingData = async (req, res) => {
  try {
    const { user_id: userId, company_id: companyId } = req.query;
    const fileType = 'booking'; // 🎯 change fileType here

    if (!userId || !companyId) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        status_message: 'BAD_REQUEST',
        message: 'Missing user_id or company_id',
        results: null,
      });
    }

    // Filter booking data only
    const data = await UploadedExtractDataFile.findAll({
      where: { userId },
      include: [
        {
          model: UploadData,
          as: 'UploadData', // make sure the alias matches your association
          where: {
            companyId,
            fileType,
          },
          required: true,
          attributes: [],
        },
      ],
      attributes: ['uploadDataId', 'checkIn', 'checkOut', 'roomType', 'rate', 'source', 'remarks'],
      order: [['uploadDataId', 'ASC']],
    });

    const formattedResults = data.map(item => ({
      check_in: item.checkIn,
      check_out: item.checkOut,
      room_type: item.roomType,
      price: item.rate,
      source: item.source,
      remarks: item.remarks,
    }));

    res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'Booking data fetched successfully',
      count: formattedResults.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error('Error fetching booking data:', error);

    res.status(500).json({
      status: 'error',
      status_code: 500,
      status_message: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch booking data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};

