const { Op } = require('sequelize');
const db = require('../models');
const { UploadData, MetaUploadData, UploadedExtractDataFile } = db;

exports.getAllstrocrReports = async (req, res) => {
  try {
    const {
      user_id: userId,
      company_id: companyId,
      hotel_id: hotelId,
      start_date: startDate,
      end_date: endDate
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

    const fileType = 'str_ocr_report';

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
          where: { hotelPropertyId: hotelId },
          attributes: ['hotelPropertyId', 'fromDate', 'toDate'],
        },
        {
          model: UploadedExtractDataFile,
          as: 'extractedFiles',
          required: false,
          where: startDate && endDate
            ? {
                checkIn: {
                  [Op.between]: [startDate, endDate]
                }
              }
            : {},
          attributes: ['reportType', 'checkIn', 'roomType', 'rate', 'occupancy', 'adrUsd', 'revParUsd', 'totalRevenue'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Flatten the data to only return extracted file rows
    const flattenedData = data.flatMap(upload =>
      upload.extractedFiles.map(file => ({
        report_type: file.reportType || '-',
        date: file.checkIn || '-',
        room_type: file.roomType || '-',
        rate: file.rate || '-',
        occupancy: file.occupancy || '-',
        adr: file.adrUsd || '-',
        revpar: file.revParUsd || '-',
        total_revanue: file.totalRevenue || '-',
      }))
    );

    return res.status(200).json({
      status: 'success',
      status_code: 200,
      status_message: 'OK',
      message: 'STROCR Report data fetched successfully',
      count: flattenedData.length,
      results: flattenedData,
    });
  } catch (error) {
    console.error('Error fetching STROCR Reports:', error);
    return res.status(500).json({
      status: 'error',
      status_code: 500,
      status_message: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch STROCR Report data',
      error: error.message || 'Unknown error',
      results: null,
    });
  }
};
