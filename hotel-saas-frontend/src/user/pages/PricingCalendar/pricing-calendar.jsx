import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';


const PricingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [selectedHotelRooms, setSelectedHotelRooms] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);


  const fetchHotels = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!companyId) throw new Error('Company ID missing');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${companyId}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hotels');
      }

      const data = await response.json();
      setHotels(data.hotels || []);
      toast.success(data.message || 'Hotels loaded!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Update rooms dropdown when hotel changes
  const handleHotelChange = (e) => {
    const hotelId = e.target.value;
    setSelectedHotelId(hotelId);

    const selectedHotel = hotels.find((hotel) => hotel.id === hotelId);
    const rooms = selectedHotel?.Rooms || [];
    setSelectedHotelRooms(rooms);

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    // Find how many days are in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate events: each room on each day
    const events = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = format(date, 'yyyy-MM-dd');

      rooms.forEach((room) => {
        events.push({
          title: `₹2500 - ${room}`,
          date: dateString,
        });
      });
    }

    setCalendarEvents(events);
  };



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
          {/* Breadcrumb and Filter Section */}
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

          {/* Filter Section */}
          <div className="row">
            <div className="col-md-12">
              <div className="white-bg form-design">
                <form>
                  <div className="row calendarfilter">
                    {/* Hotel Dropdown */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Hotel</label>
                        <select
                          className="form-select form-control"
                          onChange={handleHotelChange}
                          value={selectedHotelId}
                        >
                          <option value="">Select Hotel</option>
                          {hotels.map((hotel) => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Room Type Dropdown */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Room Type</label>
                        <select className="form-select form-control">
                          <option value="">Select Room</option>
                          {selectedHotelRooms.map((room, index) => (
                            <option key={index} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date Range (static for now) */}
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

          {/* Calendar Section */}
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
                    <img src={`/user/images/help.svg`} className="img-fluid" alt="Help" />
                  </div>
                </div>

                <div className="calendardesign">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek',
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventDidMount={(info) => {
                      tippy(info.el, {
                        content: info.event.title,
                        placement: 'top',
                        animation: 'shift-away',
                      });
                    }}
                    dayCellDidMount={(info) => {
                      // // Show tooltip on hover
                      // tippy(info.el, {
                      //   content: `Date: ${info.date.toDateString()}`,
                      //   placement: 'top',
                      //   animation: 'shift-away',
                      // });

                      // Optional: handle click on the date cell to show tooltip or custom logic
                      info.el.addEventListener('click', () => {
                        tippy(info.el, {
                          content: `Clicked Date: ${info.date.toDateString()}`,
                          trigger: 'manual',
                          placement: 'top',
                          animation: 'shift-away',
                        }).show();
                      });
                    }}
                    height="auto"
                  />


                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
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
                            {selectedHotelRooms.map((room, i) => (
                              <li key={i}>
                                <span className="modal-room-name">{room}</span>
                                <span className="modal-room-price">₹2500</span>
                              </li>
                            ))}
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
                                {selectedHotelRooms.map((room, i) => (
                                  <tr key={i}>
                                    <td>{room}</td>
                                    <td><input type="text" className="form-control" placeholder="₹2500" /></td>
                                    <td>₹3000</td>
                                  </tr>
                                ))}
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
      </div>
    </DashboardLayout>
  );
};

export default PricingCalendar;
