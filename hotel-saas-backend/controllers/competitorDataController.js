const { Op } = require('sequelize');
const db = require('../models');
const { UploadData, MetaUploadData, UploadedExtractDataFile } = db;

exports.getAllCompetitorData = async (req, res) => {
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

    const fileType = 'competitor';

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
            hotelPropertyId: hotelId,
          },
          attributes: ['hotelPropertyId', 'fromDate', 'toDate'],
        },
        {
          model: UploadedExtractDataFile,
          as: 'extractedFiles',
          required: false,
          where:
            startDate && endDate
              ? {
                  date: {
                    [Op.between]: [startDate, endDate],
                  },
                }
              : {},
          attributes: ['competitorHotel', 'date', 'roomType', 'rate'],
        },
      ],
      order: [['createdAt', 'DESC']], // ✅ fixed typo here
    });

    res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'Competitor data fetched successfully',
      count: data.length,
      results: data,
    });
  } catch (error) {
    console.error('Error fetching Competitor Data:', error);
    res.status(500).json({
      status: 'error',
      status_code: 500,
      status_message: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Competitor data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};
