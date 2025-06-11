import React, { useEffect } from 'react';
import DataTable from 'react-data-table-component';
import MUIDataTable from 'mui-datatables';
import DashboardLayout from '../../components/DashboardLayout';
import ADRBarChart from './ADRBarChart';
import ORLineChart from './ORLineChart';
import RevPARMultiAxisChart from './RevPARMultiAxisChart';
import ForecastAccuracyChart from './ForecastAccuracyChart';

const ReportPage = () => {

    const adrReportcolumns = [
        { name: 'id', label: 'ID', options: { filter: true, sort: true, display: true } },
        { name: 'date', label: 'Date', options: { filter: true, sort: true } },
        { name: 'hotel', label: 'Hotel', options: { filter: true, sort: true } },
        { name: 'roomType', label: 'Room Type', options: { filter: true, sort: true } },
        { name: 'adr', label: 'ADR ($)', options: { filter: true, sort: true } },
        { name: 'roomsSold', label: 'Rooms Sold', options: { filter: true, sort: true } },
        { name: 'totalRevenue', label: 'Total Revenue ($)', options: { filter: true, sort: true } },
    ];

    const adrReportData = [
        { id: 1, date: '2025-06-05', hotel: 'Grand Royal', roomType: 'Deluxe King', adr: '80%', roomsSold: 50, totalRevenue: 4000 },
        { id: 2, date: '2025-06-04', hotel: 'Grand Royal', roomType: 'Deluxe King', adr: '90%', roomsSold: 60, totalRevenue: 5400 },
        { id: 3, date: '2025-06-06', hotel: 'Grand Royal', roomType: 'Deluxe King', adr: '70%', roomsSold: 70, totalRevenue: 4900 },
        { id: 4, date: '2025-06-08', hotel: 'Grand Royal', roomType: 'Deluxe King', adr: '60%', roomsSold: 80, totalRevenue: 4800 },
        { id: 5, date: '2025-06-07', hotel: 'Grand Royal', roomType: 'Deluxe King', adr: '70%', roomsSold: 70, totalRevenue: 4900 },
    ];

    const occupancyReportcolumns = [
        { name: 'id', label: 'ID', options: { filter: true, sort: true, display: true } },
        { name: 'date', label: 'Date', options: { filter: true, sort: true } },
        { name: 'hotel', label: 'Hotel', options: { filter: true, sort: true } },
        { name: 'roomType', label: 'Room Type', options: { filter: true, sort: true } },
        { name: 'occupancy', label: 'Occupancy %', options: { filter: true, sort: true } },
        { name: 'roomsAvailable', label: 'Rooms Available', options: { filter: true, sort: true } },
        { name: 'roomsSold', label: 'Rooms Sold', options: { filter: true, sort: true } },
    ];

    const occupancyReportData = [
        { id: 1, date: '2025-06-05', hotel: 'Grand Royal', roomType: 'Deluxe King', occupancy: '80%', roomsAvailable: 100, roomsSold: 50 },
        { id: 2, date: '2025-06-04', hotel: 'Grand Royal', roomType: 'Deluxe King', occupancy: '90%', roomsAvailable: 100, roomsSold: 60 },
        { id: 3, date: '2025-06-06', hotel: 'Grand Royal', roomType: 'Deluxe King', occupancy: '70%', roomsAvailable: 150, roomsSold: 70 },
        { id: 4, date: '2025-06-08', hotel: 'Grand Royal', roomType: 'Deluxe King', occupancy: '60%', roomsAvailable: 110, roomsSold: 80 },
        { id: 5, date: '2025-06-07', hotel: 'Grand Royal', roomType: 'Deluxe King', occupancy: '70%', roomsAvailable: 90, roomsSold: 70 },
    ];

     const RevPARReportcolumns = [
        { name: 'id', label: 'ID', options: { filter: true, sort: true, display: true  } },
        { name: 'date', label: 'Date', options: { filter: true, sort: true } },
        { name: 'hotel', label: 'Hotel', options: { filter: true, sort: true } },
        { name: 'roomType', label: 'Room Type', options: { filter: true, sort: true } },
        { name: 'RevPAR', label: 'RevPAR ($)', options: { filter: true, sort: true } },
        { name: 'adr', label: 'ADR ($)', options: { filter: true, sort: true } },
        { name: 'Occupancy', label: 'Occupancy %', options: { filter: true, sort: true } },
    ];

    const RevPARReportData = [
        { id: 1, date: '2025-06-01', hotel: 'Hotel A', roomType: 'Deluxe', RevPAR: 90, adr: 120, Occupancy: 75 },
        { id: 2, date: '2025-06-02', hotel: 'Hotel A', roomType: 'Deluxe', RevPAR: 80, adr: 110, Occupancy: 70 },
        { id: 3, date: '2025-06-03', hotel: 'Hotel A', roomType: 'Deluxe', RevPAR: 100, adr: 130, Occupancy: 80 },
        { id: 4, date: '2025-06-04', hotel: 'Hotel A', roomType: 'Deluxe', RevPAR: 85, adr: 125, Occupancy: 60 },
    ];

    const ForecastAccuracyReportcolumns = [
        { name: 'id', label: 'ID', options: { filter: true, sort: true, display: true  } },
        { name: 'date', label: 'Date', options: { filter: true, sort: true } },
        { name: 'hotel', label: 'Hotel', options: { filter: true, sort: true } },
        { name: 'roomType', label: 'Room Type', options: { filter: true, sort: true } },
        { name: 'forecastedOccupancy', label: 'Forecasted Occupancy', options: { filter: true, sort: true } },
        { name: 'actualOccupancy', label: 'Actual Occupancy', options: { filter: true, sort: true } },
        { name: 'accuracy', label: 'Accuracy', options: { filter: true, sort: true } },
        { name: 'forecastedRevenue', label: 'Forecasted Revenue', options: { filter: true, sort: true } },
        { name: 'actualRevenue', label: 'Actual Revenue', options: { filter: true, sort: true } },
    ];

    const ForecastAccuracyReportData = [
        { id: 1, date: '2025-06-01', hotel: 'Hotel A', roomType: 'Deluxe', forecastedOccupancy: 85, actualOccupancy: 80, accuracy: 94.1, forecastedRevenue: 10500, actualRevenue: 10000 },
        { id: 2, date: '2025-06-02', hotel: 'Hotel A', roomType: 'Standard', forecastedOccupancy: 75, actualOccupancy: 70, accuracy: 93.3, forecastedRevenue: 8500, actualRevenue: 7900 },
        { id: 3, date: '2025-06-03', hotel: 'Hotel A', roomType: 'Suite', forecastedOccupancy: 90, actualOccupancy: 95, accuracy: 95.8, forecastedRevenue: 12000, actualRevenue: 12500 },
        { id: 4, date: '2025-06-04', hotel: 'Hotel A', roomType: 'Deluxe', forecastedOccupancy: 88, actualOccupancy: 85, accuracy: 96.6, forecastedRevenue: 11000, actualRevenue: 10800 },
        { id: 5, date: '2025-06-05', hotel: 'Hotel A', roomType: 'Standard', forecastedOccupancy: 78, actualOccupancy: 80, accuracy: 97.4, forecastedRevenue: 9000, actualRevenue: 9200 },
    ];

    const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        responsive: 'standard',
        pagination: true,
    };




    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">

                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Reports</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><a href="#">Home</a></li>
                                        <li className="breadcrumb-item active" aria-current="page">Reports</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>


                    <div className="white-bg">
                        <div className="form-design">
                            <h6 className="infoline">Analyze your performance and download detailed reports by date, hotel, and room type."</h6>
                            <form>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Hotel Property</label>
                                            <select className="form-select form-control">
                                                <option>Hotel Property</option>
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label">Room Type</label>
                                            <select className="form-select form-control">
                                                <option>Room Type</option>
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="form-label">Date Range</label>
                                            <div className="daterange">
                                                <input type="date" className="form-control" id="" placeholder="Email Address" />
                                                <span>-</span>
                                                <input type="date" className="form-control" id="" placeholder="Email Address" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="form-label">Compare With</label>
                                            <select className="form-select form-control">
                                                <option>Compare With</option>
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group reportfilter-btn">
                                            <button type="submit" className="btn btn-info">Clear Filters</button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="report-tab">
                            <div className="report-tabdesign">
                                <ul className="nav nav-tabs" role="tablist">
                                    <li className="nav-item">
                                        <a className="nav-link active" data-bs-toggle="tab" href="#home1">ADR Report</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" data-bs-toggle="tab" href="#home2">Occupancy Report</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" data-bs-toggle="tab" href="#home3">RevPAR Report</a>
                                    </li>
                                    <li className="nav-item">
                                        <a className="nav-link" data-bs-toggle="tab" href="#home4">Forecast Accuracy Report</a>
                                    </li>
                                </ul>
                            </div>

                            <div className="tab-content">
                                <div id="home1" className="tab-pane active">
                                    <div className="report-tab-view">
                                        <div className="report-tab-head">
                                            <div className="report-innertab">
                                                <span>View</span>
                                                <ul className="nav nav-tabs" role="tablist">
                                                    <li className="nav-item">
                                                        <a className="nav-link active" data-bs-toggle="tab" href="#homeinner1">Table</a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-bs-toggle="tab" href="#homeinner2">Chart</a>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="report-tablebtn">
                                                <button type="submit" className="btn btn-report">Excel</button>
                                                <button type="submit" className="btn btn-report">PDF</button>
                                            </div>
                                        </div>

                                        <div className="report-tabcontent">
                                            <div className="tab-content">
                                                <div id="homeinner1" className="tab-pane active">
                                                    <div className="tabledesign">
                                                        <div className="table-responsive">
                                                            <MUIDataTable
                                                                title="ADR Report"
                                                                columns={adrReportcolumns}
                                                                data={adrReportData}
                                                                options={options}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="homeinner2" className="tab-pane fade">
                                                    <ADRBarChart data={adrReportData} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div id="home2" className="tab-pane fade">
                                    <div className="report-tab-view">
                                        <div className="report-tab-head">
                                            <div className="report-innertab">
                                                <span>View</span>
                                                <ul className="nav nav-tabs" role="tablist">
                                                    <li className="nav-item">
                                                        <a className="nav-link active" data-bs-toggle="tab" href="#homeinner3">Table</a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-bs-toggle="tab" href="#homeinner4">Chart</a>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="report-tablebtn">
                                                <button type="submit" className="btn btn-report">Excel</button>
                                                <button type="submit" className="btn btn-report">PDF</button>
                                            </div>
                                        </div>

                                        <div className="report-tabcontent">
                                            <div className="tab-content">
                                                <div id="homeinner3" className="tab-pane active">
                                                    <div className="tabledesign">
                                                        <div className="table-responsive">
                                                            <MUIDataTable
                                                                title="Occupancy Report"
                                                                columns={occupancyReportcolumns}
                                                                data={occupancyReportData}
                                                                options={options}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="homeinner4" className="tab-pane fade">
                                                    <ORLineChart data={occupancyReportData} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div id="home3" className="tab-pane fade">
                                    <div className="report-tab-view">
                                        <div className="report-tab-head">
                                            <div className="report-innertab">
                                                <span>View</span>
                                                <ul className="nav nav-tabs" role="tablist">
                                                    <li className="nav-item">
                                                        <a className="nav-link active" data-bs-toggle="tab" href="#homeinner5">Table</a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-bs-toggle="tab" href="#homeinner6">Chart</a>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="report-tablebtn pevparreport-switch">
                                                <button type="submit" className="btn btn-report">Excel</button>
                                                <button type="submit" className="btn btn-report">PDF</button>
                                                <h2>ADR and Occupancy <label className="switch">
                                                    <input type="checkbox" />
                                                    <span className="slider round"></span>
                                                </label></h2>

                                            </div>

                                        </div>

                                        <div className="report-tabcontent">
                                            <div className="tab-content">
                                                <div id="homeinner5" className="tab-pane active">
                                                    <div className="tabledesign">
                                                        <div className="table-responsive">
                                                            <MUIDataTable
                                                                title="RevPAR Report"
                                                                columns={RevPARReportcolumns}
                                                                data={RevPARReportData}
                                                                options={options}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="homeinner6" className="tab-pane fade">
                                                    <RevPARMultiAxisChart data={RevPARReportData} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div id="home4" className="tab-pane fade">
                                    <div className="report-tab-view">
                                        <div className="report-tab-head">
                                            <div className="report-innertab">
                                                <span>View</span>
                                                <ul className="nav nav-tabs" role="tablist">
                                                    <li className="nav-item">
                                                        <a className="nav-link active" data-bs-toggle="tab" href="#homeinner7">Table</a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a className="nav-link" data-bs-toggle="tab" href="#homeinner8">Chart</a>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="report-tablebtn">
                                                <button type="submit" className="btn btn-report">Excel</button>
                                                <button type="submit" className="btn btn-report">PDF</button>
                                            </div>

                                        </div>

                                        <div className="report-tabcontent">
                                            <div className="tab-content">
                                                <div id="homeinner7" className="tab-pane active">
                                                    <div className="tabledesign">
                                                        <div className="table-responsive">
                                                            <MUIDataTable
                                                                title="Forecast Accuracy Report"
                                                                columns={ForecastAccuracyReportcolumns}
                                                                data={ForecastAccuracyReportData}
                                                                options={options}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div id="homeinner8" className="tab-pane fade">
                                                    <ForecastAccuracyChart data={ForecastAccuracyReportData} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                        </div>



                    </div>






                </div>
            </div>

        </DashboardLayout>
    );
};

export default ReportPage;
