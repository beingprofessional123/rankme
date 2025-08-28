const db = require('../models');
const { Op } = require('sequelize');

const {
  UploadData,
  MetaUploadData,
  UploadedExtractDataFile,
} = db;

exports.getPropertyPrice = async (req, res) => {
  try {

    const {
      user_id: userId,
      company_id: companyId,
      hotel_id: hotelId,
      start_date: startDate,
      end_date: endDate,
    } = req.query;

    if (!userId || !companyId || !hotelId) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        status_message: 'BAD_REQUEST',
        message: 'Missing user_id, company_id, or hotel_id',
        results: null,
      });
    }

    // ✅ Support comma-separated hotel IDs
    let hotelIds = hotelId;
    if (typeof hotelId === 'string') {
      hotelIds = hotelId.split(',').map((id) => id.trim());
    }

    const data = await UploadData.findAll({
      where: {
        companyId,
        fileType: 'property_price_data',
        status: 'saved',
      },
      include: [
        {
          model: MetaUploadData,
          as: 'metaData',
          required: true,
          where: {
            hotelPropertyId: {
              [Op.in]: hotelIds,
            },
          },
          attributes: ['hotelPropertyId', 'fromDate', 'toDate'],
        },
        {
          model: UploadedExtractDataFile,
          as: 'extractedFiles',
          required: false,
          where: {
            checkIn: {
              [Op.between]: [startDate, endDate],
            },
            // Modify this line to fetch all relevant data
            property: {
              [Op.in]: ['myproperty', 'competitor'],
            },
          },
          attributes: ['checkIn', 'checkOut', 'rate', 'platform', 'remarks', 'property'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      status_code: 200,
      message: 'Property price data fetched successfully',
      count: data.length,
      results: data,
    });
  } catch (error) {
    console.error('Error fetching property prices:', error);
    res.status(500).json({
      status: 'error',
      status_code: 500,
      message: 'Failed to fetch property price data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};



exports.getBookingData = async (req, res) => {
  try {
    const {
      user_id: userId,
      company_id: companyId,
      hotel_id: hotelId,
      start_date: startDate,
      end_date: endDate,
    } = req.query;

    const fileType = 'booking';

    // ✅ Validate required query params
    if (!userId || !companyId || !hotelId) {
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        status_message: 'BAD_REQUEST',
        message: 'Missing user_id, company_id, or hotel_id',
        results: null,
      });
    }

    // ✅ Convert hotel_id string to array if comma-separated
    let hotelIds = hotelId;
    if (typeof hotelId === 'string') {
      hotelIds = hotelId.split(',').map(id => id.trim());
    }

    // ✅ Fetch booking data for all hotel IDs
    const data = await UploadData.findAll({
      where: {
        companyId,
        fileType,
        status: 'saved',
      },
      include: [
        {
          model: MetaUploadData,
          as: 'metaData',
          required: true,
          where: {
            hotelPropertyId: {
              [Op.in]: hotelIds,
            },
          },
          attributes: ['hotelPropertyId', 'fromDate', 'toDate'],
        },
        {
          model: UploadedExtractDataFile,
          as: 'extractedFiles',
          required: false,
          where: {
            property: 'myproperty',
            checkIn: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: ['checkIn', 'occupancy'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'Booking data fetched successfully',
      count: data.length,
      results: data,
    });
  } catch (error) {
    console.error('Error fetching Bookings:', error);

    res.status(500).json({
      status: 'error',
      status_code: 500,
      status_message: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Booking data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};
