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
import Select from 'react-select';
import Swal from 'sweetalert2';

const PricingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [allHotelRooms, setAllHotelRooms] = useState([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [propertyPricing, setPropertyPricing] = useState([]);
  const [bookingData, setBookingData] = useState([]);


  const mapPropertyPricingToEvents = (pricingData = [], bookingData = []) => {
    if (!Array.isArray(pricingData)) {
      console.error("Invalid pricingData:", pricingData);
      pricingData = [];
    }

    if (!Array.isArray(bookingData)) {
      console.error("Invalid bookingData:", bookingData);
      bookingData = [];
    }

    const filtered = pricingData.filter(item => item.date);

    const events = filtered.map(item => {
      const { date, room_type } = item;

      // Count how many rooms of this type are available on this date
      const availableCount = filtered.filter(p =>
        p.date === date && p.room_type === room_type
      ).length;

      // Count bookings of this room type on this date
      const bookedCount = bookingData.filter(b =>
        b.room_type === room_type &&
        (
          (b.check_in === b.check_out && b.check_in === date) ||
          (date >= b.check_in && date < b.check_out)
        )
      ).length;

      const predicted_occupancy = availableCount
        ? `${Math.round((bookedCount / availableCount) * 100)}%`
        : '0%';

      const priceValue = parseFloat(item.price) || 0;

      // ✅ Updated logic:
      const suggested_price = (priceValue * 1.10).toFixed(2);   // 10% higher
      const historical_price = (priceValue * 0.90).toFixed(2);  // 10% lower

      return {
        title: `${item.room_type}: ₹${item.price}`,
        date: item.date,
        backgroundColor: '#2CCDD9', // 🎨 Add background color here
        borderColor: '#2CCDD9',     // Optional
        textColor: '#000000',       // Optional, ensures contrast
        extendedProps: {
          room_type: item.room_type,
          price: item.price,
          platform: item.platform || 'N/A',
          remarks: item.remarks || '',
          predicted_occupancy,
          suggested_price,
          historical_price,
        },
      };
    });

    setCalendarEvents(events);
  };

  useEffect(() => {
    const modalElement = document.getElementById('myModal');

    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        // Manually trigger re-render or reapply tooltips
        const allEventEls = document.querySelectorAll('.fc-event');

        allEventEls.forEach((el) => {
          const roomSpan = el.querySelector('.room-type');
          const priceSpan = el.querySelector('.price');

          // Clean up old tooltips
          if (roomSpan?._tippy) roomSpan._tippy.destroy();
          if (priceSpan?._tippy) priceSpan._tippy.destroy();

          const event = calendarEvents.find(ev => ev.title.includes(roomSpan?.innerText));
          if (!event) return;

          const { predicted_occupancy, suggested_price, historical_price } = event.extendedProps;

          let roomTooltip = '';
          if (predicted_occupancy) {
            roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Predicted Occupancy:</span> ${predicted_occupancy}</div>`;
          }

          if (suggested_price) {
            roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Suggested Price:</span> ₹${suggested_price}</div>`;
          }

          if (historical_price) {
            roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Historical Price:</span> ₹${historical_price}</div>`;
          }

          if (roomTooltip) {
            roomTooltip = `<div class="p-1">${roomTooltip}</div>`;
            if (roomSpan) {
              tippy(roomSpan, {
                content: roomTooltip,
                allowHTML: true,
                placement: 'top',
                animation: 'shift-away',
                theme: 'light-border',
              });
            }
          }

          if (priceSpan) {
            tippy(priceSpan, {
              content: 'This is a good price',
              placement: 'top',
              animation: 'scale',
              theme: 'material',
            });
          }
        });
      });
    }
  }, [calendarEvents]);







  const fetchHotels = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!token || !companyId) throw new Error('Missing token or company ID');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${companyId}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setHotels(data.hotels || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch hotels');
    }
  }, []);

  const fetchBookingData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      const userId = user?.id;

      if (!token || !companyId || !userId) throw new Error('Missing credentials');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/booking-data?company_id=${companyId}&user_id=${userId}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch booking data');

      setBookingData(data.results || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch booking data');
    }
  }, []);


  const getPropertyPricing = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      const userId = user?.id;
      if (!token || !companyId || !userId) throw new Error('Missing credentials');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/property-price?company_id=${companyId}&user_id=${userId}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch pricing');
      setPropertyPricing(data.results || []);
      mapPropertyPricingToEvents(data.results || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load pricing data');
    }
  }, []);

  useEffect(() => {
    fetchHotels();
    getPropertyPricing();
    fetchBookingData(); // 👈 Add this line
  }, [fetchHotels, getPropertyPricing, fetchBookingData]);

  useEffect(() => {
    if (propertyPricing.length > 0 && bookingData.length > 0) {
      mapPropertyPricingToEvents(propertyPricing, bookingData);
    }
  }, [propertyPricing, bookingData]);


  const handleHotelChange = (e) => {
    const hotelId = e.target.value;
    setSelectedHotelId(hotelId);
    const selectedHotel = hotels.find((hotel) => hotel.id === hotelId);
    const rooms = selectedHotel?.Rooms || [];
    setAllHotelRooms(rooms);
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

                    {/* Room Type Multi-select */}
                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="form-label">Room Types</label>
                        <Select
                          isMulti
                          options={allHotelRooms.map((room) => ({
                            label: room,
                            value: room,
                          }))}
                          value={selectedRoomTypes.map((room) => ({
                            label: room,
                            value: room,
                          }))}
                          onChange={(selectedOptions) =>
                            setSelectedRoomTypes(selectedOptions.map((opt) => opt.value))
                          }
                          className="basic-multi-select"
                          classNamePrefix="select"
                        />
                      </div>
                    </div>

                    {/* Date Range - static */}
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

          {/* Calendar */}
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
                    height="auto"

                    // ✅ 1. Custom event content to prevent default rendering
                    eventContent={(arg) => {
                      const {
                        suggested_price,
                        room_type,
                      } = arg.event.extendedProps;

                      const container = document.createElement('div');
                      container.className = 'd-flex justify-content-between text-white p-1';

                      const roomSpan = document.createElement('span');
                      roomSpan.className = 'room-type';
                      roomSpan.style.cursor = 'pointer';
                      roomSpan.innerText = room_type;

                      const priceSpan = document.createElement('span');
                      priceSpan.className = 'price';
                      priceSpan.style.cursor = 'pointer';
                      priceSpan.style.color = 'green';
                      priceSpan.innerText = `₹${suggested_price}`;

                      container.appendChild(roomSpan);
                      container.appendChild(priceSpan);

                      return { domNodes: [container] };
                    }}

                    // ✅ 2. Attach tooltips
                    eventDidMount={(info) => {
                      const {
                        predicted_occupancy,
                        suggested_price,
                        historical_price,
                      } = info.event.extendedProps;

                      const roomSpan = info.el.querySelector('.room-type');
                      const priceSpan = info.el.querySelector('.price');

                      if (roomSpan) {
                        let roomTooltip = '';

                        if (predicted_occupancy) {
                          roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Predicted Occupancy:</span> ${predicted_occupancy}</div>`;
                        }

                        if (suggested_price) {
                          roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Suggested Price:</span> ₹${suggested_price}</div>`;
                        }

                        if (historical_price) {
                          roomTooltip += `<div class="mb-2 d-flex justify-content-between text-white" ><span>Historical Price:</span> ₹${historical_price}</div>`;
                        }

                        if (roomTooltip) {
                          // Optional: wrap the whole tooltip in a container for padding
                          roomTooltip = `<div class="p-1">${roomTooltip}</div>`;

                          tippy(roomSpan, {
                            content: roomTooltip,
                            allowHTML: true,
                            placement: 'top',
                            animation: 'shift-away',
                            theme: 'light-border',
                          });
                        }
                      }


                      if (priceSpan) {
                        tippy(priceSpan, {
                          content: 'This is a good price',
                          placement: 'top',
                          animation: 'scale',
                          theme: 'material',
                        });
                      }
                    }}

                    // ✅ 3. Show popup on event click
                    eventClick={(info) => {
                      handleEventClick(info); // Pass the whole event click info
                    }}
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
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">&times;</button>
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
                            {(selectedRoomTypes.length > 0 ? selectedRoomTypes : allHotelRooms).map((room, i) => (
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
                                {(selectedRoomTypes.length > 0 ? selectedRoomTypes : allHotelRooms).map((room, i) => (
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
