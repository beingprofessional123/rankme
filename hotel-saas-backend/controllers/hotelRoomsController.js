// src/controllers/hotelRoomsController.js
const { Hotel, RoomType, RateCategory } = require('../models'); // Import all necessary models
const { sequelize } = require('../models');

exports.getHotels = async (req, res) => {
  const { company_id } = req.query;

  if (!company_id) {
    return res.status(400).json({ error: 'Company ID is required' });
  }

  try {
    const hotels = await Hotel.findAll({
      where: {
        company_id
      },
      include: [
        {
          model: RoomType,
          as: 'RoomTypes', // <--- IMPORTANT: Add the 'as' alias here
          attributes: ['name', 'capacity'],
        },
        // If you were to include RateCategory here, you'd also need its 'as' alias
        // {
        //   model: RateCategory,
        //   as: 'RateCategories',
        //   attributes: ['name'],
        // },
      ],
    });

    const formattedHotels = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      hotel_type: hotel.hotel_type,
      // Access the associated rooms via the alias property
      Rooms: hotel.RoomTypes ? hotel.RoomTypes.map(room => room.name) : [], // Add a check for null/undefined
    }));

    return res.status(200).json({
      message: 'Hotels fetched successfully',
      hotels: formattedHotels,
    });
  } catch (error) {
    console.error('Error fetching hotels in getHotels:', error.message); // More specific error message
    return res.status(500).json({ error: 'Failed to fetch hotels.' });
  }
};


exports.getHotelDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  try {
    const hotel = await Hotel.findByPk(id, {
      include: [
        {
          model: RoomType,
          as: 'RoomTypes', // IMPORTANT: Reference the alias defined in Hotel.js
          attributes: ['id', 'name', 'capacity'],
          // Remove `through` as it's not applicable for hasMany/belongsTo
          // through: { attributes: [] }
        },
        {
          model: RateCategory,
          as: 'RateCategories', // IMPORTANT: Reference the alias defined in Hotel.js
          attributes: ['id', 'name', 'description'],
          // Remove `through` as it's not applicable for hasMany/belongsTo
          // through: { attributes: [] }
        }
      ]
    });

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const formattedHotel = {
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      hotel_type: hotel.hotel_type,
      // Access via the alias: hotel.RoomTypes
      rooms: hotel.RoomTypes ? hotel.RoomTypes.map(room => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
      })) : [],
      // Access via the alias: hotel.RateCategories
      rateCategories: hotel.RateCategories ? hotel.RateCategories.map(rate => ({
        id: rate.id,
        name: rate.name,
        description: rate.description,
      })) : [],
    };

    return res.status(200).json({
      message: 'Hotel details fetched successfully',
      hotel: formattedHotel,
    });
  } catch (error) {
    console.error('Error fetching hotel details:', error.message);
    return res.status(500).json({ error: 'Failed to fetch hotel details.' });
  }
};

exports.deleteHotelDetails = async (req, res) => {
  const { id } = req.params; // This is the hotel_id

  if (!id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  let transaction; // Declare transaction variable outside try block

  try {
    // Start a transaction to ensure atomicity
    transaction = await sequelize.transaction();

    // 1. Delete associated RoomTypes
    await RoomType.destroy({
      where: { hotel_id: id },
      transaction, // Pass the transaction
    });

    // 2. Delete associated RateCategories
    await RateCategory.destroy({
      where: { hotel_id: id },
      transaction, // Pass the transaction
    });

    // 3. Delete the Hotel itself
    const deletedHotelCount = await Hotel.destroy({
      where: { id: id },
      transaction, // Pass the transaction
    });

    if (deletedHotelCount === 0) {
      await transaction.rollback(); // Rollback if hotel not found
      return res.status(404).json({ error: 'Hotel not found.' });
    }

    // Commit the transaction if all operations are successful
    await transaction.commit();

    return res.status(200).json({ message: 'Hotel and its associated rooms and rate categories deleted successfully.' });

  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback in case of any error
    console.error('Error deleting hotel and associated data:', error.message);
    return res.status(500).json({ error: 'Failed to delete hotel and associated data.' });
  }
};