import React, { useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import editsvg from '../../assets/images/edit.svg';
import deletetdsvg from '../../assets/images/deletetd.svg';
import warningsvg from '../../assets/images/warning.svg';
import uploadiconsvg from '../../assets/images/uploadicon.svg';
import downloadsvg from '../../assets/images/download.svg';
import failedsvg from '../../assets/images/failed.svg';


const CompetitorRatesPage = () => {

    const competitorRateColumns = [
        { name: 'id', label: 'ID', options: { sort: true, filter: false } },
        { name: 'hotel', label: 'Competitor Hotel', options: { sort: true, filter: true } },
        { name: 'date', label: 'Date', options: { sort: true, filter: true } },
        { name: 'roomType', label: 'Room Type', options: { filter: true } },
        { name: 'rate', label: 'Rate', options: { filter: false } },
        { name: 'enteredBy', label: 'Entered By', options: { filter: true } },
        {
            name: 'action',
            label: 'Action',
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <div className="tdaction">
                            <a href="#"><img src={editsvg} className="img-fluid" alt="Edit" /></a>
                            <a href="#"><img src={deletetdsvg} className="img-fluid" alt="Delete" /></a>
                        </div>
                    );
                },
            },
        },
    ];

    const competitorRateData = [
        { id: 1, hotel: 'Grand Plaza', date: '2025-06-05', roomType: 'Deluxe King', rate: '$150', enteredBy: 'John D.' },
        { id: 2, hotel: 'Urban Retreat', date: '2025-06-04', roomType: 'Standard', rate: '$100', enteredBy: 'Sarah M.' },
        { id: 3, hotel: 'Lakeview Inn', date: '2025-06-06', roomType: 'Suite', rate: '$250', enteredBy: 'Mike R.' },
        { id: 4, hotel: 'Grand Plaza', date: '2025-06-05', roomType: 'Deluxe Twin', rate: '$140', enteredBy: 'John D.' },
        { id: 5, hotel: 'Urban Retreat', date: '2025-06-07', roomType: 'Standard', rate: '$95', enteredBy: 'Sarah M.' },
    ];

    // Column configuration
    const competitorDataColumns = [
        { name: 'id', label: 'ID', options: { sort: true } },
        { name: 'hotel', label: 'Competitor Hotel', options: { sort: true } },
        { name: 'date', label: 'Date', options: { sort: true } },
        { name: 'roomType', label: 'Room Type', options: { sort: true } },
        {
            name: 'rate',
            label: 'Rate',
            options: {
                sort: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    const rowIndex = tableMeta.rowIndex;
                    const rowData = competitorDataData[rowIndex];
                    return (
                        <span className={rowData.warning ? 'warningtr-td' : ''}>
                            ${value}
                            {rowData.warning && (
                                <span style={{ marginLeft: 4 }}>
                                    <img src={warningsvg} className="img-fluid" alt="Warning" style={{ height: '16px' }} />
                                </span>
                            )}
                        </span>
                    );
                }
            }
        }
    ];


    // Dummy data
    const competitorDataData = [
        { id: 1, hotel: 'Grand Plaza', date: '2025-06-05', roomType: 'Deluxe King', rate: 150 },
        { id: 2, hotel: 'Urban Retreat', date: '2025-06-04', roomType: 'Standard', rate: 100 },
        { id: 3, hotel: 'Lakeview Inn', date: '2025-06-06', roomType: 'Suite', rate: 250, warning: true },
        { id: 4, hotel: 'Grand Plaza', date: '2025-06-08', roomType: 'Deluxe Twin', rate: 140 },
        { id: 5, hotel: 'Urban Retreat', date: '2025-06-07', roomType: 'Standard', rate: 95 },
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
                                <h2>Competitor Rates</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><a href="#">Home</a></li>
                                        <li className="breadcrumb-item active" aria-current="page">Competitor Rates</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>


                    <div className="white-bg competitor-rate">
                        <div className="report-tabdesign">
                            <ul className="nav nav-tabs" role="tablist">
                                <li className="nav-item">
                                    <a className="nav-link active" data-bs-toggle="tab" href="#home1">Manual Entry</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" data-bs-toggle="tab" href="#home2">Upload via CSV</a>
                                </li>
                            </ul>
                        </div>
                        <div className="tab-content">
                            <div id="home1" className="tab-pane active">
                                <form>
                                    <div className="form-design">
                                        <div className="row">
                                            <div className="col-md-4">
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
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label className="form-label">Competitor Hotel Name</label>
                                                    <input type="text" className="form-control" id="" placeholder="Data Source Name" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label className="form-label">Date</label>
                                                    <input type="date" className="form-control" id="" placeholder="" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
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
                                                    <label className="form-label">Rate</label>
                                                    <input type="text" className="form-control" id="" placeholder="Data Source Name" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label className="form-label">Currency (optional)</label>
                                                    <select className="form-select form-control">
                                                        <option>Select Currency</option>
                                                        <option>2</option>
                                                        <option>3</option>
                                                        <option>4</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="addentry-btn">
                                                    <button type="submit" className="btn btn-info">Add Entry</button>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </form>

                                <div className="data-uploadtable">
                                    <div className="data-uploadtop">
                                        <h2>Data</h2>
                                    </div>
                                    <div className="tabledesign">
                                        <div className="table-responsive">
                                            <MUIDataTable
                                                title="Data"
                                                columns={competitorRateColumns}
                                                data={competitorRateData}
                                                options={options}
                                                className="table dt-responsive categories_table"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div id="home2" className="tab-pane fade">
                                <form>
                                    <div className="form-design">
                                        <div className="form-group">
                                            <label className="form-label">File Attachment</label>
                                            <div className="upload-files-container">
                                                <div className="drag-file-area">
                                                    <span className="material-icons-outlined upload-icon"><img src={uploadiconsvg} className="img-fluid" alt="" /></span>
                                                    <h3 className="dynamic-message">Drag and drop your CSV/Excel file here, or</h3>
                                                    <label className="label"><span className="browse-files"> <input type="file" className="default-file-input" /> <span className="browse-files-text">Click to browse</span></span> </label>
                                                    <span className="cannot-upload-message"> <span className="material-icons-outlined">error</span> Please select a file first <span className="material-icons-outlined cancel-alert-button">cancel</span> </span>
                                                    <div className="file-block">
                                                        <div className="file-info"> <span className="material-icons-outlined file-icon"><i className="la la-file-import"></i></span> <span className="file-name"> </span> | <span className="file-size">  </span> </div>
                                                        <span className="material-icons remove-file-icon"><i className="la la-trash"></i></span>
                                                        <div className="progress-bar"> </div>
                                                    </div>
                                                    <button type="button" className="upload-button" style={{ width: '0px', opacity: 0, height: '0px', padding: '0px', margin: '0px' }}> Upload </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label className="form-label">Data Source Name</label>
                                                    <input type="email" className="form-control" id="" placeholder="Data Source Name" />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
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
                                        </div>
                                    </div>
                                </form>

                                <div className="data-uploadtable">
                                    <div className="data-uploadtop">
                                        <h2>Competitor Data</h2>
                                        <span><img src={downloadsvg} className="img-fluid" alt="" /></span>
                                    </div>
                                    <div className="tabledesign">
                                        <div className="table-responsive">
                                            <MUIDataTable
                                                title="Competitor Data"
                                                columns={competitorDataColumns}
                                                data={competitorDataData}
                                                options={options}
                                                className="table dt-responsive categories_table"
                                            />
                                        </div>
                                        <div className="data-upload-btn">
                                            <button type="submit" className="btn btn-info cancelbtn" data-bs-toggle="modal" data-bs-target="#myModal">Cancel</button>
                                            <button type="submit" className="btn btn-info">Confirm & Upload</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade modaldesign data-failed" id="myModal">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Detailed Explanation</h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal">&times;</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-design">
                                <img src={failedsvg} className="img-fluid" alt="" />
                                <h3>Upload failed</h3>
                                <p>Please select a region and try again.</p>
                                <div className="form-group">
                                    <select className="form-select form-control">
                                        <option>Select a region</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                    </select>
                                    <button type="submit" className="btn btn-info">Submit</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CompetitorRatesPage;
