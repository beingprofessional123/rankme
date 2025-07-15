const { Hotel, RateCategory, RoomType } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Step 1: Create Hotel
exports.createHotel = async (req, res) => {
  const { hotel_id, name, location, hotel_type, company_id,total_rooms } = req.body;

  if (!name || !location || !hotel_type || !company_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ✅ If hotel_id exists, update existing hotel
    if (hotel_id) {
      const existingHotel = await Hotel.findOne({ where: { id: hotel_id } });

      if (!existingHotel) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      await existingHotel.update({ name, location, hotel_type, company_id,total_rooms });

      return res.status(200).json({ message: 'Hotel updated successfully', hotel: existingHotel });
    }

    // ✅ Else, create new hotel
    const newHotel = await Hotel.create({
      id: uuidv4(),
      name,
      location,
      hotel_type,
      company_id,
      total_rooms,
    });

    return res.status(201).json({ message: 'Hotel created successfully', hotel: newHotel });
  } catch (error) {
    console.error('Hotel creation/updation error:', error.message);
    return res.status(500).json({ error: 'Failed to process hotel' });
  }
};

// Step 2: Add Rate Categories
exports.addRateCategories = async (req, res) => {
  const { hotel_id, categories } = req.body;

  if (!hotel_id || !Array.isArray(categories) || categories.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const processedCategories = [];

    for (const cat of categories) {
      if (cat.id) {
        // Update existing category
        const isUUID = typeof cat.id === 'string' && /^[0-9a-fA-F-]{36}$/.test(cat.id);
        let existing = null;
        if (isUUID) {
          existing = await RateCategory.findOne({ where: { id: cat.id, hotel_id } });
        }

        if (existing) {
          await existing.update({
            name: cat.name,
            description: cat.description || '',
          });
          processedCategories.push(existing);
        } else {
          // If ID is present but record not found, treat as new
          const newCat = await RateCategory.create({
            id: uuidv4(),
            name: cat.name,
            description: cat.description || '',
            hotel_id,
          });
          processedCategories.push(newCat);
        }
      } else {
        // Create new category
        const newCat = await RateCategory.create({
          id: uuidv4(),
          name: cat.name,
          description: cat.description || '',
          hotel_id,
        });
        processedCategories.push(newCat);
      }
    }

    return res.status(201).json({ message: 'Rate categories saved successfully', rateCategories: processedCategories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save rate categories' });
  }
};

// Delete Rate Category
exports.deleteRateCategories = async (req, res) => {
  const { hotel_id, category_ids } = req.body;

  if (!hotel_id || !Array.isArray(category_ids) || category_ids.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Delete rate categories that match both id and hotel_id
    const deletedCount = await RateCategory.destroy({
      where: {
        id: category_ids,
        hotel_id: hotel_id,
      },
    });

    return res.status(200).json({
      message: 'Rate categories deleted successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting rate categories:', error);
    return res.status(500).json({ error: 'Failed to delete rate categories' });
  }
};

// Step 3: Add Room Types
// Get Rate Categories
exports.getRateCategories = async (req, res) => {
  const { hotel_id } = req.query;

  if (!hotel_id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  try {
    const rate_categories = await RateCategory.findAll({
      where: { hotel_id },
    });

    return res.status(200).json({
      message: 'Rate categories fetched successfully',
      rate_categories,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Failed to fetch rate categories' });
  }
};

// GET Room Types
exports.getRoomTypes = async (req, res) => {
  const { hotel_id } = req.query;

  if (!hotel_id) {
    return res.status(400).json({ error: 'Hotel ID is required' });
  }

  try {
    const room_types = await RoomType.findAll({
      where: { hotel_id },
    });

    return res.status(200).json({
      message: 'Room types fetched successfully',
      room_types,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Failed to fetch room types.' });
  }
};

exports.addRoomTypes = async (req, res) => {
  const { hotel_id, rooms } = req.body;

  if (!hotel_id || !Array.isArray(rooms) || rooms.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const savedRooms = [];

    for (const room of rooms) {
      // Validate required fields
      if (!room.name || !room.capacity || !room.rate_category_id) {
        return res.status(400).json({ error: 'Missing room fields' });
      }

      let savedRoom;

      if (room.id) {
        // Try to find and update existing room
        const existingRoom = await RoomType.findByPk(room.id);

        if (existingRoom) {
          await existingRoom.update({
            name: room.name,
            capacity: room.capacity,
            hotel_id,
            rate_category_id: room.rate_category_id,
          });
          savedRoom = existingRoom;
        } else {
          // If ID is given but not found, optionally create new
          savedRoom = await RoomType.create({
            id: room.id, // keep the provided ID
            name: room.name,
            capacity: room.capacity,
            hotel_id,
            rate_category_id: room.rate_category_id,
          });
        }
      } else {
        // Create new room if no ID is provided
        savedRoom = await RoomType.create({
          id: uuidv4(),
          name: room.name,
          capacity: room.capacity,
          hotel_id,
          rate_category_id: room.rate_category_id,
        });
      }

      savedRooms.push(savedRoom);
    }

    return res.status(201).json({
      message: 'Room types processed successfully',
      roomTypes: savedRooms,
    });
  } catch (error) {
    console.error('Error in addRoomTypes:', error.message);
    return res.status(500).json({ error: 'Failed to process room types' });
  }
};

exports.deleteRoomTypes = async (req, res) => {
  const { hotel_id, room_type_id } = req.body;

  if (!hotel_id || !Array.isArray(room_type_id) || room_type_id.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // Delete rate categories that match both id and hotel_id
    const deletedCount = await RoomType.destroy({
      where: {
        id: room_type_id,
        hotel_id: hotel_id,
      },
    });

    return res.status(200).json({
      message: 'Room type deleted successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting room type:', error);
    return res.status(500).json({ error: 'Failed to delete room type' });
  }
};