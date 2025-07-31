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
  const [showOccupancy, setShowOccupancy] = useState(true);
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
        const priceMap = {}; // hotelId => { date => [rates] }
        const occupancyMap = {}; // hotelId => { date => occupancy }

        // Step 1: Extract pricing per day per hotel
        for (const item of pricingData?.results || []) {
          const hotelPropertyId = item.metaData?.hotelPropertyId;
          const extractedFiles = item.extractedFiles || [];

          for (const file of extractedFiles) {
            const checkIn = new Date(file.checkIn);
            const checkOut = file.checkOut ? new Date(file.checkOut) : null;
            const rate = parseFloat(file.rate) || 0;

            let current = new Date(checkIn);
            const end = checkOut ? new Date(checkOut) : new Date(checkIn);
            end.setDate(end.getDate() + (checkOut ? 0 : 1));

            while (current < end) {
              const dateStr = current.toISOString().split('T')[0];
              if (!priceMap[hotelPropertyId]) priceMap[hotelPropertyId] = {};
              if (!priceMap[hotelPropertyId][dateStr]) priceMap[hotelPropertyId][dateStr] = [];
              priceMap[hotelPropertyId][dateStr].push(rate);
              current.setDate(current.getDate() + 1);
            }
          }
        }

        // Step 2: Extract occupancy directly
        for (const item of bookingData?.results || []) {
          const hotelPropertyId = item.metaData?.hotelPropertyId;
          const extractedFiles = item.extractedFiles || [];

          for (const file of extractedFiles) {
            const dateStr = new Date(file.checkIn).toISOString().split('T')[0];
            const occupancy = Number(file.occupancy);
            if (!occupancyMap[hotelPropertyId]) occupancyMap[hotelPropertyId] = {};
            occupancyMap[hotelPropertyId][dateStr] = occupancy;
          }
        }

        // Step 3: Create calendar events
        for (const hotelId of selectedHotelIds) {
          const hotel = hotels.find(h => h.id === hotelId);
          if (!hotel) continue;

          const dates = generateDateRange(startDate, endDate);

          for (const dateStr of dates) {
            const occupancy = occupancyMap[hotelId]?.[dateStr] ?? null;
            const ratesForDate = priceMap[hotelId]?.[dateStr] || [];
            const minRate = ratesForDate.length ? Math.min(...ratesForDate) : 0;
            const suggestedPrice = minRate + 10;
            const historicalPrice = Math.max(0, minRate - 10);

            const backgroundColor = occupancy === 100
              ? '#FF4C4C'
              : ratesForDate.length
                ? '#2CCDD9'
                : '#E5E5E5';

            const textColor = occupancy === 100 ? '#FFFFFF' : '#000000';

            allEvents.push({
              title: hotel.name,
              date: dateStr,
              backgroundColor,
              borderColor: backgroundColor,
              textColor,
              extendedProps: {
                hotel_id: hotel.id,
                hotel_name: hotel.name,
                predicted_occupancy: occupancy !== null ? `${occupancy}%` : '0%',
                average_price: minRate,
                suggested_price: suggestedPrice,
                historical_price: historicalPrice,
              },
            });
          }
        }

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

  const handleHidden = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents(); // Optional if events change

      setTimeout(() => {
        const allEvents = document.querySelectorAll('.fc-event');

        allEvents.forEach((eventEl) => {
          const roomSpan = eventEl.querySelector('.room-type');
          const occupancy = eventEl.getAttribute('data-occupancy');

          // Remove any existing tippy instances
          if (roomSpan && roomSpan._tippy) {
            roomSpan._tippy.destroy();
          }

          // Conditionally re-apply tippy only if occupancy display is enabled
          if (roomSpan && showOccupancy) {
            tippy(roomSpan, {
              content: `
                <div class="">
                  <div class="mb-2 gap-4 d-flex justify-content-between">
                    <span>Predicted Occupancy:</span> <strong>${occupancy}</strong>
                  </div>
                </div>
              `,
              allowHTML: true,
              placement: 'top',
              animation: 'shift-away',
              theme: 'light-border custom-tooltip',
            });
          }
        });
      }, 100); // Ensure DOM is ready
    }
  };

  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', handleHidden);
  }

  // Cleanup on unmount
  return () => {
    if (modalElement) {
      modalElement.removeEventListener('hidden.bs.modal', handleHidden);
    }
  };
}, [showOccupancy]); // Depend on showOccupancy

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
                      <input
                        type="checkbox"
                        checked={showOccupancy}
                        onChange={(e) => setShowOccupancy(e.target.checked)}
                      />
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

                    if (roomSpan && showOccupancy) {
                        let tooltipContent = `
                                    <div class="p-1">
                                      <div class="mb-2 gap-4 d-flex justify-content-between">
                                        <span>Predicted Occupancy:</span> <strong>${predicted_occupancy}</strong>
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

                      // if (priceSpan) {
                      //   tippy(priceSpan, {
                      //     content: 'Good Pricing',
                      //     placement: 'top',
                      //     animation: 'scale',
                      //     theme: 'material',
                      //   });
                      // }
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
