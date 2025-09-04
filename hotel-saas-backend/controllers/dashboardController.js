// controllers/dashboardController.js
const { Op } = require('sequelize');
const db = require('../models');

exports.getDashboardData = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const today = new Date();
        const next7Days = new Date();
        const nextMonth = new Date();
        next7Days.setDate(today.getDate() + 7);
        nextMonth.setMonth(today.getMonth() + 1);

        // First, find the correct UploadData IDs based on hotelId and fileType
        const bookingUploadId = await db.UploadData.findOne({
            attributes: ['id'],
            where: { status: 'saved', fileType: 'booking' },
            include: [{
                model: db.MetaUploadData,
                as: 'metaData',
                required: true,
                where: { hotelPropertyId: hotelId },
            }],
            raw: true
        });

        const strOcrUploadId = await db.UploadData.findOne({
            attributes: ['id'],
            where: { status: 'saved', fileType: 'str_ocr_report' },
            include: [{
                model: db.MetaUploadData,
                as: 'metaData',
                required: true,
                where: { hotelPropertyId: hotelId },
            }],
            raw: true
        });

        const bookingId = bookingUploadId ? bookingUploadId.id : null;
        const strOcrId = strOcrUploadId ? strOcrUploadId.id : null;

        let occupancyResult = {};
        if (bookingId) {
            // Updated query to handle non-numeric values more gracefully
            occupancyResult = await db.UploadedExtractDataFile.findAll({
                attributes: [
                    [
                        db.sequelize.fn('avg', db.sequelize.cast(
                            db.sequelize.literal("CASE WHEN \"occupancy\" ~ '^[0-9.]+$' THEN \"occupancy\" ELSE NULL END"), 'float')), 
                        'avgOccupancy'
                    ]
                ],
                where: {
                    uploadDataId: bookingId,
                    checkIn: { [Op.between]: [today, next7Days] }
                },
                group: ['uploadDataId'],
                raw: true
            });
            occupancyResult = occupancyResult.length > 0 ? occupancyResult[0] : {};
        }

        console.log(occupancyResult);

        let revenueMetricsResult = {};
        if (strOcrId) {
             revenueMetricsResult = await db.UploadedExtractDataFile.findOne({
                attributes: [
                    [db.sequelize.fn('avg', db.sequelize.cast(db.sequelize.col('adrUsd'), 'float')), 'avgAdr'],
                    [db.sequelize.fn('avg', db.sequelize.cast(db.sequelize.col('revParUsd'), 'float')), 'avgRevPar']
                ],
                where: {
                    uploadDataId: strOcrId,
                    checkIn: { [Op.between]: [today, next7Days] }
                },
                raw: true
            });
        }

        const monthlyOccupancyChartData = bookingId ? await db.UploadedExtractDataFile.findAll({
            attributes: [
                [db.sequelize.fn('date_trunc', 'month', db.sequelize.col('checkIn')), 'month'],
                [db.sequelize.fn('avg', db.sequelize.cast(db.sequelize.col('occupancy'), 'float')), 'avg_occupancy'],
            ],
            where: {
                uploadDataId: bookingId,
                checkIn: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) }
            },
            group: [db.sequelize.fn('date_trunc', 'month', db.sequelize.col('checkIn'))],
            order: [[db.sequelize.literal('month'), 'ASC']],
            raw: true,
        }) : [];

        const revparChartData = strOcrId ? await db.UploadedExtractDataFile.findAll({
            attributes: ['checkIn', 'revParUsd'],
            where: {
                uploadDataId: strOcrId,
                checkIn: { [Op.between]: [today, nextMonth] }
            },
            order: [['checkIn', 'ASC']],
            raw: true,
        }) : [];


        const occupancy = occupancyResult?.avgOccupancy || 0;
        const adr = revenueMetricsResult?.avgAdr || 0;
        const revpar = revenueMetricsResult?.avgRevPar || 0;

        res.status(200).json({
            currentMetrics: {
                occupancy: occupancy,
                adr: adr,
                revpar: revpar,
            },
            occupancyData: {
                labels: monthlyOccupancyChartData.map(d => new Date(d.month).toLocaleString('default', { month: 'short' })),
                datasets: [{
                    label: 'Occupancy Rate',
                    data: monthlyOccupancyChartData.map(d => parseFloat(d.avg_occupancy)),
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    fill: false,
                    tension: 0.3,
                }]
            },
            revparData: {
                labels: revparChartData.map(d => new Date(d.checkIn).toLocaleString('default', { weekday: 'short' })),
                datasets: [{
                    label: 'RevPAR',
                    data: revparChartData.map(d => parseFloat(d.revParUsd)),
                    backgroundColor: '#facc15',
                }]
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};