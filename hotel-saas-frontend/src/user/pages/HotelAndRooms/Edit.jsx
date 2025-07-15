import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import Stepper from '../../components/Stepper';
import HotelInfo from './HotelInfo';
import RateCategories from './RateCategories';
import RoomTypes from './RoomTypes';

const steps = [
    { name: 'Hotel Information', id: 'account' },
    { name: 'Rate Categories', id: 'personal' },
    { name: 'Room Types', id: 'payment' },
];

const HotelAndRoomEdit = () => {
    const { id } = useParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [hotel, setHotel] = useState(null);
    const [hotelData, setHotelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleNextStep = () => {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        };
        const handlePrevStep = () => {
            setCurrentStep((prev) => Math.max(prev - 1, 0));
        };
        window.addEventListener('step:next', handleNextStep);
        window.addEventListener('step:back', handlePrevStep);
        return () => {
            window.removeEventListener('step:next', handleNextStep);
            window.removeEventListener('step:back', handlePrevStep);
        };
    }, []);

    useEffect(() => {
        const savedHotelInfo = localStorage.getItem('hotel_info');
        if (savedHotelInfo) {
            try {
                const parsed = JSON.parse(savedHotelInfo);
                setHotelData({
                    id: parsed.hotel_id,
                    name: parsed.name,
                    location: parsed.location,
                    hotel_type: parsed.hotel_type,
                    total_rooms: parsed.total_rooms,
                });
            } catch (err) {
                console.error('Failed to parse hotel_info from localStorage', err);
            }
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        const fetchHotel = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/hotels/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch hotel details');
                const result = await response.json();
                setHotel(result.hotel);
                setHotelData(result.hotel); // Ensure form steps have access to hotel id
            } catch (err) {
                console.error(err);
                toast.error(err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    const handleHotelCreated = (hotelResponse) => {
        if (hotelResponse?.hotel?.id) {
            setHotelData(hotelResponse.hotel);
        }
        window.dispatchEvent(new CustomEvent('step:next'));
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <HotelInfo onHotelCreated={handleHotelCreated} editInitialData={hotelData} />;
            case 1:
                return <RateCategories hotelId={hotelData?.id} />;
            case 2:
                return <RoomTypes hotelId={hotelData?.id} />;
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Edit Hotel & Room</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Edit</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="white-bg add-hotel-room">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="formheading">
                                    <h1>Hotel Setup Form</h1>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12">
                                <div className="stepform">
                                    <form id="msform">
                                        {/* <Stepper steps={steps.map(s => s.name)} currentStep={currentStep} /> */}
                                        {loading ? (
                                            <p>Loading...</p>
                                        ) : error ? (
                                            <p className="text-danger">{error}</p>
                                        ) : (
                                            renderStep()
                                        )}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HotelAndRoomEdit;
