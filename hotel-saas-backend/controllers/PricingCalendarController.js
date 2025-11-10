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

exports.updatePrice = async (req, res) => {
  try {
    const { company_id, user_id, data } = req.body;

    console.log('📥 Incoming Request:', JSON.stringify(req.body, null, 2));

    if (!company_id || !user_id || !Array.isArray(data) || data.length === 0) {
      console.warn('⚠️ Missing required fields or empty data array');
      return res.status(400).json({
        status: 'error',
        status_code: 400,
        message: 'Missing required fields or empty data array',
      });
    }

    let updatedCount = 0;
    let skipped = [];

    for (const item of data) {
      const { hotel_id, date, edited_price } = item;

      console.log('\n🔹 Processing item:', item);

      if (!hotel_id || !date || edited_price == null) {
        console.warn(`⚠️ Skipping due to missing hotel_id/date/price →`, item);
        skipped.push(item);
        continue;
      }

      console.log(`🔍 Looking for UploadData → company: ${company_id}, hotel: ${hotel_id}`);

      // 🔍 Find UploadData with matching company and hotel
      const uploadRecord = await db.UploadData.findOne({
        where: {
          companyId: company_id,
          fileType: 'property_price_data',
          status: 'saved',
        },
        include: [
          {
            model: db.MetaUploadData,
            as: 'metaData',
            required: true,
            where: { hotelPropertyId: hotel_id },
            attributes: ['id', 'hotelPropertyId'],
          },
        ],
      });

      if (!uploadRecord) {
        console.warn(`⚠️ No UploadData record found for hotel ${hotel_id}`);
        skipped.push(item);
        continue;
      }

      const meta = uploadRecord.metaData; // hasOne -> single object
      console.log(`✅ Found UploadData ID: ${uploadRecord.id} | Meta ID: ${meta.id}`);

      // ✅ Update UploadedExtractDataFile using uploadDataId (not metaUploadDataId)
      console.log(`💰 Updating checkIn: ${date} → new rate: ${edited_price}`);

      const [affectedRows] = await db.UploadedExtractDataFile.update(
        { rate: edited_price },
        {
          where: {
            uploadDataId: uploadRecord.id, // ✅ using uploadDataId
            checkIn: date,
          },
        }
      );

      console.log(`📊 Affected Rows: ${affectedRows}`);

      if (affectedRows > 0) {
        console.log(`✅ Updated hotel ${hotel_id} for date ${date}`);
        updatedCount++;
      } else {
        console.warn(`⚠️ No matching checkIn found for hotel ${hotel_id} on ${date}`);
        skipped.push(item);
      }
    }

    console.log('\n✅ Final Summary:', {
      updatedCount,
      skippedCount: skipped.length,
      skipped,
    });

    res.status(200).json({
      status: 'success',
      status_code: 200,
      message: `✅ ${updatedCount} record(s) updated. ⏭️ ${skipped.length} skipped.`,
      skipped,
    });
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    res.status(500).json({
      status: 'error',
      status_code: 500,
      message: 'Failed to update prices',
      error: error.message,
    });
  }
};




