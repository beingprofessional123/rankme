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
import { Link } from 'react-router-dom';

const PricingCalendar = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelIds, setSelectedHotelIds] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchHotels = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!token || !companyId) throw new Error('Missing credentials');

      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      setHotels(data.hotels || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch hotels');
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const generateDateRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    return dates;
  };

useEffect(() => {
  const fetchCalendarData = async () => {
    if (!selectedHotelIds.length || !dateRange.start || !dateRange.end) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const companyId = user?.company_id;
    const userId = user?.id;
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    const hotelIdsStr = selectedHotelIds.join(',');

    try {
      const apiUrlPricing = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/property-price?company_id=${companyId}&user_id=${userId}&hotel_id=${hotelIdsStr}&start_date=${startDate}&end_date=${endDate}`;
      const apiUrlBooking = `${process.env.REACT_APP_API_BASE_URL}/api/pricing-calendar/booking-data?company_id=${companyId}&user_id=${userId}&hotel_id=${hotelIdsStr}&start_date=${startDate}&end_date=${endDate}`;

      const [pricingRes, bookingRes] = await Promise.all([
        fetch(apiUrlPricing, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrlBooking, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const pricingData = await pricingRes.json();
      const bookingData = await bookingRes.json();

      const allEvents = [];
      const extractedPriceRanges = [];
      const bookingCountsMap = {}; // { hotelId: { dateStr: count } }

      // Step 1: Extract pricing ranges
      for (const item of pricingData?.results || []) {
        const hotelPropertyId = item.metaData?.hotelPropertyId;
        const extractedFiles = item.extractedFiles || [];

        for (const file of extractedFiles) {
          const checkIn = new Date(file.checkIn);
          const checkOut = new Date(file.checkOut);
          const rate = parseFloat(file.rate) || 0;

          extractedPriceRanges.push({
            hotelId: hotelPropertyId,
            checkIn,
            checkOut,
            rate,
          });
        }
      }

      // Step 2: Extract and count bookings per day
      for (const bookingItem of bookingData?.results || []) {
        const hotelId = bookingItem.metaData?.hotelPropertyId;
        if (!selectedHotelIds.includes(hotelId)) continue;

        const extractedFiles = bookingItem.extractedFiles || [];

        for (const file of extractedFiles) {
          const checkIn = new Date(file.checkIn);
          const checkOut = new Date(file.checkOut);

          const bookingDates = [];

          if (file.checkIn === file.checkOut) {
            bookingDates.push(file.checkIn);
          } else {
            let curr = new Date(checkIn);
            while (curr < new Date(checkOut)) {
              bookingDates.push(curr.toISOString().split('T')[0]);
              curr.setDate(curr.getDate() + 1);
            }
          }

          for (const dateStr of bookingDates) {
            if (!bookingCountsMap[hotelId]) bookingCountsMap[hotelId] = {};
            if (!bookingCountsMap[hotelId][dateStr]) bookingCountsMap[hotelId][dateStr] = 0;
            bookingCountsMap[hotelId][dateStr] += 1;
          }
        }
      }

      // Step 3: Create calendar events with occupancy calculation
      for (const hotelId of selectedHotelIds) {
        const hotel = hotels.find(h => h.id === hotelId);
        if (!hotel) continue;

        const totalRooms = hotel.total_rooms || 0;
        const dates = generateDateRange(startDate, endDate); // assume this gives array of YYYY-MM-DD

        for (const dateStr of dates) {
          const currentDate = new Date(dateStr);

          const matchedRange = extractedPriceRanges.find(range =>
            range.hotelId === hotelId &&
            currentDate >= range.checkIn &&
            currentDate < range.checkOut
          );

          const averageRate = matchedRange?.rate || 0;
          const suggestedPrice = averageRate + 10;
          const historicalPrice = Math.max(0, averageRate - 10);

          const bookedRooms = bookingCountsMap[hotelId]?.[dateStr] || 0;
          const availableRooms = Math.max(0, totalRooms - bookedRooms);
          const occupancyPercent = totalRooms > 0
            ? `${Math.round((bookedRooms / totalRooms) * 100)}%`
            : '0%';

          const isFullOccupancy = totalRooms > 0 && bookedRooms >= totalRooms;

          const backgroundColor = isFullOccupancy
            ? '#FF4C4C' // 🔴 Red for 100% occupancy
            : matchedRange
              ? '#2CCDD9' // 🟦 Blue for available pricing
              : '#E5E5E5'; // ⚪ Gray for no pricing

          const borderColor = backgroundColor;
          const textColor = isFullOccupancy ? '#FFFFFF' : '#000000';

          allEvents.push({
            title: hotel.name,
            date: dateStr,
            backgroundColor,
            borderColor,
            textColor,
            extendedProps: {
              hotel_id: hotel.id,
              hotel_name: hotel.name,
              totalRooms,
              booked_rooms: bookedRooms,
              available_rooms: availableRooms,
              predicted_occupancy: occupancyPercent,
              average_price: averageRate,
              suggested_price: suggestedPrice,
              historical_price: historicalPrice,
            },
          });
        }
      }

      console.log(allEvents);
      setCalendarEvents(allEvents);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load pricing/booking data');
    }
  };

  fetchCalendarData();
}, [selectedHotelIds, dateRange, hotels]);

  const handleEventClick = async (info) => {
    setSelectedDate(info.event.start);
    const bootstrap = await import('bootstrap');
    const modal = new bootstrap.Modal(document.getElementById('myModal'));
    modal.show();
  };

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
                      <div class="">
                        <div class="mb-2 gap-4 d-flex justify-content-between">
                          <span>Predicted Occupancy:</span> <strong>${occupancy}</strong>
                        </div>
                        <div class="mb-2 gap-4 d-flex justify-content-between">
                          <span>Suggested Price:</span> <strong>$${suggested}</strong>
                        </div>
                        <div class="mb-2 gap-4 d-flex justify-content-between">
                          <span>Historical Price:</span> <strong>$${historical}</strong>
                        </div>
                      </div>
                    `,
                  allowHTML: true,
                  placement: 'top',
                  animation: 'shift-away',
                  theme: 'light-border custom-tooltip',
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
                    <li className="breadcrumb-item"><Link to=''>Home</Link></li>
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
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Hotel</label>
                        <Select isMulti
                          options={hotels.map(h => ({
                            label: h.name,
                            value: h.id,
                          }))}
                          value={selectedHotelIds.map(id => {
                            const h = hotels.find(hotel => hotel.id === id);
                            return h ? { label: h.name, value: h.id } : null;
                          }).filter(Boolean)}
                          onChange={(selected) => {
                            const ids = selected.map(opt => opt.value);
                            setSelectedHotelIds(ids);
                          }}

                          className="basic-multi-select"
                          classNamePrefix="select"
                        />

                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Date Range</label>
                        <div className="daterange d-flex gap-2 align-items-center">
                          <input
                            type="date"
                            className="form-control"
                            value={dateRange.start}
                            onChange={(e) =>
                              setDateRange((prev) => ({ ...prev, start: e.target.value }))
                            }
                          />
                          <span>-</span>
                          <input
                            type="date"
                            className="form-control"
                            value={dateRange.end}
                            onChange={(e) =>
                              setDateRange((prev) => ({ ...prev, end: e.target.value }))
                            }
                          />
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
                        hotel_name,
                        predicted_occupancy,
                        historical_price,
                        average_price,
                      } = arg.event.extendedProps;

                      const isGray = arg.event.backgroundColor === '#E5E5E5';

                      const container = document.createElement('div');
                      container.className = 'd-flex justify-content-between p-1';

                      container.setAttribute('data-occupancy', predicted_occupancy);
                      container.setAttribute('data-suggested', suggested_price);
                      container.setAttribute('data-historical', historical_price);

                      const roomSpan = document.createElement('span');
                      roomSpan.className = isGray ? 'room-type gray-room-type' : 'room-type blue-room-type';
                      roomSpan.style.cursor = 'pointer';
                      roomSpan.innerText = hotel_name;

                      const priceSpan = document.createElement('span');
                      priceSpan.className = 'price';
                      priceSpan.style.cursor = 'pointer';
                      priceSpan.style.color = 'green';
                      priceSpan.innerText = `$${average_price}`;

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
                                      <div class="mb-2 gap-4 d-flex justify-content-between">
                                        <span>Predicted Occupancy:</span> <strong>${predicted_occupancy}</strong>
                                      </div>
                                      <div class="mb-2 gap-4 d-flex justify-content-between">
                                        <span>Suggested Price:</span> <strong>$${suggested_price}</strong>
                                      </div>
                                      <div class="mb-2 gap-4 d-flex justify-content-between">
                                        <span>Historical Price:</span> <strong>$${historical_price}</strong>
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
