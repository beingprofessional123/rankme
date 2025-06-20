import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Stepper from '../../components/Stepper'; // Adjust path if needed
import HotelInfo from './HotelInfo';
import RateCategories from './RateCategories';
import RoomTypes from './RoomTypes';


// Define steps as an array of objects to include IDs for the progressbar
const steps = [
    { name: 'Hotel Information', id: 'account' },
    { name: 'Rate Categories', id: 'personal' },
    { name: 'Room Types', id: 'payment' },
];


const HotelAndRoomCreate = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [hotelData, setHotelData] = useState(null); // Stores the hotel data after HotelInfo step

    // Listen for step navigation events
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

    // Effect to retrieve hotel data from localStorage if available (e.g., on page refresh)
    useEffect(() => {
        const savedHotelInfo = localStorage.getItem('hotel_info');
        if (savedHotelInfo) {
            try {
                const parsedInfo = JSON.parse(savedHotelInfo);
                // Assuming hotel_id from localStorage maps to hotelData.id
                setHotelData({ id: parsedInfo.hotel_id, name: parsedInfo.name, location: parsedInfo.location, hotel_type: parsedInfo.hotel_type });
            } catch (e) {
                console.error("Failed to parse hotel_info from localStorage", e);
            }
        }
    }, []);


    const handleHotelCreated = (hotel) => {
        if (hotel?.hotel?.id) {
            setHotelData(hotel?.hotel); // Set the entire hotel object received from API
        }
        window.dispatchEvent(new CustomEvent('step:next')); // trigger move to Rate Categories
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <HotelInfo onHotelCreated={handleHotelCreated} />;
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
                                <h2>Add Hotel & Room</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Add</li>
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
                                        <Stepper steps={steps.map(s => s.name)} currentStep={currentStep} /> {/* Pass only names for stepper */}
                                        {renderStep()}
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

export default HotelAndRoomCreate;
