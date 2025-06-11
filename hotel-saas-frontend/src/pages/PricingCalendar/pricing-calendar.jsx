import React, { useState } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import helpsvg from '../../assets/images/help.svg';

const roomTypes = [
  { name: 'Deluxe King', price: 120, recommended: 160 },
  { name: 'Standard Twin', price: 180, recommended: 280 },
  { name: 'Studio Rooms', price: 280, recommended: 300 },
  { name: 'Triple Rooms', price: 280, recommended: 380 },
  { name: 'Connecting Rooms', price: 380, recommended: 430 },
];

const PricingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEventClick = async (info) => {
    setSelectedDate(info.event.start);
    const bootstrap = await import('bootstrap');
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    modal.show();
  };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Pricing Calendar</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="#">Home</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Pricing Calendar</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="white-bg form-design">
                <form>
                  <div className="row calendarfilter">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Hotel</label>
                        <input type="text" className="form-control" placeholder="Hotel" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Room Type</label>
                        <select className="form-select form-control">
                          <option>Room Type</option>
                          {roomTypes.map((room, idx) => (
                            <option key={idx} value={room.name}>{room.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Date Range</label>
                        <div className="daterange">
                          <input type="date" className="form-control" />
                          <span>-</span>
                          <input type="date" className="form-control" />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="white-bg">
                <div className="calendartop">
                  <h2>
                    Occupancy{' '}
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                  </h2>
                  <div className="help">
                    <img src={helpsvg} className="img-fluid" alt="" />
                  </div>
                </div>

                <div className="calendardesign">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={roomTypes.map((room, index) => ({
                      title: `₹${room.price} - ${room.name}`,
                      date: `2025-06-${5 + index * 5}` // Mock dates
                    }))}
                    eventClick={handleEventClick}
                    height="auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bootstrap Modal */}
        <div className="modal fade modaldesign" id="myModal">
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
               <h4 className="modal-title">
                  {selectedDate ? format(new Date(selectedDate), 'EEE, dd/MM/yyyy') : 'Event Date'}
                </h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" >&times;</button>
              </div>

              <div className="modal-body">
                <div className="calendar-room-price">
                  <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item">
                      <a className="nav-link active" data-bs-toggle="tab" href="#home">All Room Types</a>
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" data-bs-toggle="tab" href="#menu1">Edit Prices</a>
                    </li>
                  </ul>

                  <div className="tab-content">
                    <div id="home" className="tab-pane active">
                      <div className="modal-allroom">
                        <ul>
                          <li><span className="modal-room-name">Deluxe King</span><span className="modal-room-price">$120</span></li>
                          <li><span className="modal-room-name">Standard Twin</span><span className="modal-room-price">$180</span></li>
                          <li><span className="modal-room-name">Studio Rooms</span><span className="modal-room-price">$280</span></li>
                          <li><span className="modal-room-name">Triple Rooms</span><span className="modal-room-price">$280</span></li>
                          <li><span className="modal-room-name">Connecting Rooms</span><span className="modal-room-price">$380</span></li>
                        </ul>
                      </div>
                    </div>
                    <div id="menu1" className="tab-pane fade">
                      <div className="calendar-edit-price">
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Room Types</th>
                                <th>Edit Prices</th>
                                <th>Recommended Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Deluxe King</td>
                                <td><input type="text" className="form-control" id="" placeholder="$120" /></td>
                                <td>$160</td>
                              </tr>
                              <tr>
                                <td>Standard Twin</td>
                                <td><input type="text" className="form-control" id="" placeholder="$180" /></td>
                                <td>$280</td>
                              </tr>
                              <tr>
                                <td>Studio Rooms</td>
                                <td><input type="text" className="form-control" id="" placeholder="$280" /></td>
                                <td>$300</td>
                              </tr>
                              <tr>
                                <td>Triple Rooms</td>
                                <td><input type="text" className="form-control" id="" placeholder="$280" /></td>
                                <td>$380</td>
                              </tr>
                              <tr>
                                <td>Triple Rooms</td>
                                <td><input type="text" className="form-control" id="" placeholder="$380" /></td>
                                <td>$430</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="calendar-edit-btn">
                            <button type="submit" className="btn btn-info">Save</button>
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
      </div>
    </DashboardLayout >
  );
};

export default PricingCalendar;
