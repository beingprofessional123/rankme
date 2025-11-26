// controllers/dashboardController.js
const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');

// Helper function to get the start of the day in UTC
const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

// Helper function to get the end of the day in UTC
const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
};

exports.getDashboardData = async (req, res) => {
    try {
        const { hotelId } = req.params;
        const companyId = req.user.company_id;

        const today = new Date();
        const todayStart = getStartOfDay(today);

        // --- Date Ranges ---
        const next7DaysEnd = getEndOfDay(new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)));
        const last30DaysStart = getStartOfDay(new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)));
        const nextMonthEnd = getEndOfDay(new Date(new Date().setMonth(today.getMonth() + 1)));
        const yearStart = getStartOfDay(new Date(new Date().getFullYear(), 0, 1));

        // 🛑 REMOVED baseWhere (as it caused the scope error).
        // The filtering must now be done entirely within the include statements.

        // Configuration for the JOIN (used in all queries below)
        const uploadJoinConfig = (fileType) => ({
            model: db.UploadData,
            attributes: [],
            as: 'UploadDatum', 
            required: true,
            where: { 
                // 🛑 FIXED: Moved companyId filtering here
                companyId: companyId, 
                fileType: fileType, 
                status: 'saved' 
            },
            include: [{
                model: db.MetaUploadData,
                attributes: [],
                as: 'metaData',
                required: true,
                where: { 
                    // 🛑 FIXED: Moved hotelPropertyId filtering here
                    hotelPropertyId: hotelId 
                }
            }]
        });

        // -----------------------------
        // 1️⃣ Current Week Occupancy (Next 7 Days Forecast)
        // -----------------------------
        const occupancyMetrics = await db.UploadedExtractDataFile.findOne({
            attributes: [
                [fn('AVG', literal('CAST("occupancy" AS NUMERIC)')), 'avgOccupancy']
            ],
            where: {
                checkIn: { [Op.between]: [todayStart, next7DaysEnd] },
                // 🛑 NO baseWhere HERE
            },
            include: [uploadJoinConfig('booking')],
            raw: true,
        });

        const avgOccupancy = parseFloat(occupancyMetrics.avgOccupancy) || 0;

        // -----------------------------
        // 2️⃣ Revenue Metrics (Last 30 Days Actual)
        // -----------------------------
        const revenueMetrics = await db.UploadedExtractDataFile.findOne({
            attributes: [
                [fn('AVG', literal('CAST("adrUsd" AS NUMERIC)')), 'avgAdr'],
                [fn('AVG', literal('CAST("revParUsd" AS NUMERIC)')), 'avgRevPar']
            ],
            where: {
                checkIn: { [Op.between]: [last30DaysStart, todayStart] },
                // 🛑 NO baseWhere HERE
            },
            include: [uploadJoinConfig('str_ocr_report')],
            raw: true,
        });

        const avgAdr = parseFloat(revenueMetrics.avgAdr) || 0;
        const avgRevPar = parseFloat(revenueMetrics.avgRevPar) || 0;

        // -----------------------------
        // 3️⃣ Monthly Occupancy Chart (Year-to-Date YTD)
        // -----------------------------
        const monthlyOccupancyRaw = await db.UploadedExtractDataFile.findAll({
            attributes: [
                [fn('TO_CHAR', col('checkIn'), 'YYYY-MM'), 'monthKey'],
                [fn('AVG', literal('CAST("occupancy" AS NUMERIC)')), 'avgOccupancy'],
            ],
            where: {
                checkIn: { [Op.gte]: yearStart },
                // 🛑 NO baseWhere HERE
            },
            include: [uploadJoinConfig('booking')],
            group: ['monthKey'],
            order: [[literal('"monthKey"'), 'ASC']],
            raw: true,
        });

        const monthlyOccupancyChartData = monthlyOccupancyRaw.map(d => ({
            month: d.monthKey,
            avg_occupancy: parseFloat(d.avgOccupancy),
        }));

        // -----------------------------
        // 4️⃣ RevPAR Chart (Forecast Next Month)
        // -----------------------------
        const revparChartDataRaw = await db.UploadedExtractDataFile.findAll({
            attributes: [
                'checkIn', 
                [literal('CAST("revParUsd" AS NUMERIC)'), 'revParUsd']
            ],
            where: {
                checkIn: { [Op.between]: [todayStart, nextMonthEnd] },
                // 🛑 NO baseWhere HERE
            },
            include: [uploadJoinConfig('str_ocr_report')],
            order: [['checkIn', 'ASC']],
            raw: true,
        });

        const revparChartData = revparChartDataRaw.map(row => ({
            checkIn: row.checkIn,
            revParUsd: parseFloat(row.revParUsd),
        }));


        // -----------------------------
        // 5️⃣ Response
        // -----------------------------
        res.status(200).json({
            currentMetrics: {
                occupancy: avgOccupancy, // Display as percentage
                adr: avgAdr,
                revpar: avgRevPar,
            },
            occupancyData: {
                labels: monthlyOccupancyChartData.map(d =>
                    new Date(`${d.month}-01`).toLocaleString('default', { month: 'short' })
                ),
                datasets: [{
                    label: 'Occupancy Rate (%)',
                    data: monthlyOccupancyChartData.map(d => d.avg_occupancy), // Multiply by 100 for % display
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    fill: false,
                    tension: 0.3,
                }]
            },
            revparData: {
                labels: revparChartData.map(d =>
                    new Date(d.checkIn).toLocaleString('default', { weekday: 'short' })
                ),
                datasets: [{
                    label: 'RevPAR (USD)',
                    data: revparChartData.map(d => d.revParUsd),
                    backgroundColor: '#facc15',
                }]
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};