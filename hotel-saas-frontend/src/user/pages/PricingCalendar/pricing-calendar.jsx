import React, { useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import 'tippy.js/dist/tippy.css';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { addDays, startOfMonth, addMonths, format as formatDate } from 'date-fns';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // Optional: include default toolti

const PricingCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [allHotelRooms, setAllHotelRooms] = useState([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const calendarRef = useRef(null);
  const [rawEvents, setRawEvents] = useState([]);



  useEffect(() => {
    const modalElement = document.getElementById('myModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        // Re-render tooltips after modal closes
        if (calendarRef.current) {
          calendarRef.current.getApi().refetchEvents(); // optional if events change
          setTimeout(() => {
            const allEvents = document.querySelectorAll('.fc-event');
            allEvents.forEach((eventEl) => {
              const roomSpan = eventEl.querySelector('.room-type');
              const priceSpan = eventEl.querySelector('.price');

              const occupancy = eventEl.getAttribute('data-occupancy');
              const suggested = eventEl.getAttribute('data-suggested');
              const historical = eventEl.getAttribute('data-historical');

              if (roomSpan) {
                tippy(roomSpan, {
                  content: `
                    <div class="p-1">
                      <div class="mb-1 d-flex justify-content-between">
                        <span>Predicted Occupancy:</span> <span>${occupancy}</span>
                      </div>
                      <div class="mb-1 d-flex justify-content-between">
                        <span>Suggested Price:</span> <span>₹${suggested}</span>
                      </div>
                      <div class="mb-1 d-flex justify-content-between">
                        <span>Historical Price:</span> <span>₹${historical}</span>
                      </div>
                    </div>
                  `,
                  allowHTML: true,
                  placement: 'top',
                  animation: 'shift-away',
                  theme: 'light-border',
                });
              }

              if (priceSpan) {
                tippy(priceSpan, {
                  content: 'Good Pricing',
                  placement: 'top',
                  animation: 'scale',
                  theme: 'material',
                });
              }
            });
          }, 100); // short delay to ensure DOM is stable
        }
      });
    }
  }, []);

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

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // 👇 REPLACE your `handleHotelChange` function with this updated one:
  const handleHotelChange = async (e) => {
    const hotelId = e.target.value;
    setSelectedHotelId(hotelId);

    const selectedHotel = hotels.find((hotel) => hotel.id === hotelId);
    const rooms = selectedHotel?.Rooms || [];
    setAllHotelRooms(rooms);
    setSelectedRoomTypes([]); // reset filter

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      const userId = user?.id;

      if (!token || !companyId || !userId) throw new Error('Missing credentials');

      const apiUrlPricing = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/property-price?company_id=${companyId}&user_id=${userId}&hotel_id=${hotelId}`;
      const apiUrlBooking = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/booking-data?company_id=${companyId}&user_id=${userId}&hotel_id=${hotelId}`;

      const [pricingRes, bookingRes] = await Promise.all([
        fetch(apiUrlPricing, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(apiUrlBooking, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const pricingData = await pricingRes.json();
      const bookingData = await bookingRes.json();



      const allPricingRows = pricingData?.results?.flatMap(item => item.extractedFiles || []) || [];
      const allBookingRows = bookingData?.results?.flatMap(item => item.extractedFiles || []) || [];

      const today = new Date();
      const startDate = startOfMonth(today);
      const endDate = addMonths(startDate, 6);

      const allDates = [];
      for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
        allDates.push(formatDate(d, 'yyyy-MM-dd'));
      }

      const events = [];

      for (const date of allDates) {
        for (const roomType of rooms) {
          const matchingPriceRows = allPricingRows.filter(
            row => row.date === date && row.roomType === roomType
          );

          const availableCount = matchingPriceRows.length;

          const bookedCount = allBookingRows.filter(b =>
            b.roomType === roomType &&
            b.checkIn &&
            b.checkOut &&
            date >= b.checkIn &&
            date < b.checkOut
          ).length;

          // ✅ Predicted occupancy calculation (rounded, capped)
          let occupancy = availableCount ? (bookedCount / availableCount) * 100 : 0;
          occupancy = Math.min(occupancy, 100);
          const predicted_occupancy = `${Math.round(occupancy)}%`;

          // ✅ Get the min price instead of average
          const rates = matchingPriceRows.map(r => parseFloat(r.rate || 0)).filter(r => !isNaN(r));
          const minPrice = rates.length ? Math.min(...rates) : 0;

          const row = matchingPriceRows.find(r => parseFloat(r.rate) === minPrice); // pick the row with min price

          // ✅ Suggested and historical prices based on min price
          const suggested_price = (minPrice + 10).toFixed(0);
          const historical_price = Math.max(0, minPrice - 10).toFixed(0);

          const event = {
            title: `
            <div class="p-1 d-flex justify-content-between">
              <span>${roomType}</span>
              <span>₹${minPrice}</span>
            </div>
            <div class="small text-muted">
              Booked: ${bookedCount}, Occ: ${predicted_occupancy}
            </div>
          `,
            date,
            backgroundColor: row ? '#2CCDD9' : '#E5E5E5',
            borderColor: row ? '#2CCDD9' : '#E5E5E5',
            textColor: '#000000',
            extendedProps: {
              room_type: roomType,
              price: minPrice.toFixed(0),
              platform: row?.platform || 'N/A',
              remarks: row?.remarks || '',
              predicted_occupancy,
              suggested_price,
              historical_price,
              average_price: minPrice.toFixed(0),
              bookedCount,
              availableCount,
            },
          };

          events.push(event);
        }
      }



      setRawEvents(events); // filtered in useEffect
    } catch (error) {
      console.error("❌ Error in handleHotelChange:", error);
      toast.error(error.message || 'Failed to fetch pricing or booking data');
      setCalendarEvents([]);
    }
  };


  useEffect(() => {
    const filtered =
      selectedRoomTypes.length > 0
        ? rawEvents.filter(ev => selectedRoomTypes.includes(ev.extendedProps.room_type))
        : rawEvents;

    setCalendarEvents(filtered);
  }, [selectedRoomTypes, rawEvents]);




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
          {/* Breadcrumb */}
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

          {/* Filters */}
          <div className="row">
            <div className="col-md-12">
              <div className="white-bg form-design">
                <form>
                  <div className="row calendarfilter">
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
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="en"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventContent={(arg) => {
                      const {
                        suggested_price,
                        room_type,
                        predicted_occupancy,
                        historical_price,
                        average_price,
                      } = arg.event.extendedProps;

                      const container = document.createElement('div');
                      container.className = 'd-flex justify-content-between p-1';

                      // 🔥 Fix: add these attributes to persist tooltip info for modal re-renders
                      container.setAttribute('data-occupancy', predicted_occupancy);
                      container.setAttribute('data-suggested', suggested_price);
                      container.setAttribute('data-historical', historical_price);

                      const roomSpan = document.createElement('span');
                      roomSpan.className = 'room-type';
                      roomSpan.style.cursor = 'pointer';
                      roomSpan.innerText = room_type;

                      const priceSpan = document.createElement('span');
                      priceSpan.className = 'price';
                      priceSpan.style.cursor = 'pointer';
                      priceSpan.style.color = 'green';
                      priceSpan.innerText = `₹${average_price}`;

                      container.appendChild(roomSpan);
                      container.appendChild(priceSpan);

                      return { domNodes: [container] };
                    }}
                    eventDidMount={(info) => {
                      const {
                        predicted_occupancy,
                        suggested_price,
                        historical_price,
                      } = info.event.extendedProps;

                      // ✅ Attach tooltip data directly to the .fc-event root element
                      info.el.setAttribute('data-occupancy', predicted_occupancy);
                      info.el.setAttribute('data-suggested', suggested_price);
                      info.el.setAttribute('data-historical', historical_price);

                      const roomSpan = info.el.querySelector('.room-type');
                      const priceSpan = info.el.querySelector('.price');

                      if (roomSpan) {
                        let tooltipContent = `
                          <div class="p-1">
                            <div class="mb-1 d-flex justify-content-between">
                              <span>Predicted Occupancy:</span> <span>${predicted_occupancy}</span>
                            </div>
                            <div class="mb-1 d-flex justify-content-between">
                              <span>Suggested Price:</span> <span>₹${suggested_price}</span>
                            </div>
                            <div class="mb-1 d-flex justify-content-between">
                              <span>Historical Price:</span> <span>₹${historical_price}</span>
                            </div>
                          </div>
                        `;

                        tippy(roomSpan, {
                          content: tooltipContent,
                          allowHTML: true,
                          placement: 'top',
                          animation: 'shift-away',
                          theme: 'light-border',
                        });
                      }

                      if (priceSpan) {
                        tippy(priceSpan, {
                          content: 'Good Pricing',
                          placement: 'top',
                          animation: 'scale',
                          theme: 'material',
                        });
                      }
                    }}
                    dayCellDidMount={(info) => {
                      const el = info.el.querySelector('.fc-daygrid-day-number');
                      if (el) {
                        tippy(el, {
                          content: 'Testing',
                          placement: 'top',
                          animation: 'scale',
                          theme: 'light-border',
                          delay: [100, 0],
                        });
                      }
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
