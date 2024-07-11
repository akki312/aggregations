const mongoose = require('mongoose');
const Inventory = require('../models/pharmacyinventory');
const logger = require('../loaders/logger'); // Adjust the path as necessary
const { broadcast } = require('./websocketservice'); // Adjust the path as necessary

// Create a new inventory item
async function createInventory(data) {
  try {
    const inventory = new Inventory(data);
    await inventory.save();
    logger.info('Inventory item created successfully');
    broadcast({ event: 'create', data: inventory }); // Notify clients
    return await Inventory.aggregate([
      { $match: { _id: inventory._id } },
      {
        $project: {
          email: 1,
          supplierName: 1,
          drugName: 1,
          composition: 1,
          drugType: 1,
          batchID: 1,
          quantity: 1,
          supplierLicenseNumber: 1,
          drugLicenseNumber: 1,
          expireDate: 1,
          mrp: 1,
          rate: 1,
          amount: 1,
          free: 1,
          hsnCode: 1,
          discount: 1,
          box: 1,
          thresholdValue: 1,
          previousQuantity: 1,
          createdby: 1,
          createdUserRole: 1,
          createdDate: 1,
          lastUpdatedDate: 1,
          totalValue: { $multiply: ['$quantity', '$rate'] }
        }
      }
    ]);
  } catch (error) {
    logger.error(`Failed to create inventory item: ${error.message}`);
    throw new Error('Failed to create inventory item');
  }
}

// Get inventory item by ID
async function getInventoryById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }

  try {
    const inventory = await Inventory.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id)
        }
      },
      {
        $project: {
          email: 1,
          supplierName: 1,
          drugName: 1,
          composition: 1,
          drugType: 1,
          batchID: 1,
          quantity: 1,
          supplierLicenseNumber: 1,
          drugLicenseNumber: 1,
          expireDate: 1,
          mrp: 1,
          rate: 1,
          amount: 1,
          totalValue: { $multiply: ['$quantity', '$rate'] }
          // Add more fields as needed
        }
      }
    ]);

    if (inventory.length === 0) {
      throw new Error('Inventory item not found');
    }

    return inventory[0]; // Assuming _id is unique, return the first (and only) result
  } catch (error) {
    logger.error(`Failed to retrieve inventory item: ${error.message}`);
    throw new Error('Failed to retrieve inventory item');
  }
}

// Get all inventory items
async function getAllInventories() {
  try {
    return await Inventory.aggregate([
      {
        $match: { quantity: { $gt: 0 } }
      },
      {
        $group: {
          _id: '$supplierLicenseNumber',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$rate'] } }
        }
      },
      {
        $project: {
          supplierLicenseNumber: '$_id',
          totalQuantity: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);
  } catch (error) {
    logger.error(`Failed to fetch all inventory items: ${error.message}`);
    throw new Error('Failed to fetch all inventory items');
  }
}

// Update inventory item
async function updateInventory(id, data) {
  try {
    await Inventory.findByIdAndUpdate(id, data, { new: true });
    logger.info(`Inventory item updated successfully with ID: ${id}`);
    broadcast({ event: 'update', data: { id, ...data } }); // Notify clients
    return await Inventory.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $project: {
          email: 1,
          supplierName: 1,
          drugName: 1,
          composition: 1,
          drugType: 1,
          batchID: 1,
          quantity: 1,
          supplierLicenseNumber: 1,
          drugLicenseNumber: 1,
          expireDate: 1,
          mrp: 1,
          rate: 1,
          amount: 1,
          free: 1,
          hsnCode: 1,
          discount: 1,
          box: 1,
          thresholdValue: 1,
          previousQuantity: 1,
          createdby: 1,
          createdUserRole: 1,
          createdDate: 1,
          lastUPdatedDate: 1,
          totalValue: { $multiply: ['$quantity', '$rate'] }
        }
      }
    ]);
  } catch (error) {
    logger.error(`Failed to update inventory item with ID ${id}: ${error.message}`);
    throw new Error(`Failed to update inventory item with ID ${id}`);
  }
}

// Delete inventory item
async function deleteInventory(id) {
  try {
    const inventory = await Inventory.findByIdAndDelete(id);
    if (!inventory) {
      throw new Error('Inventory item not found');
    }
    logger.info(`Inventory item deleted successfully with ID: ${id}`);
    broadcast({ event: 'delete', data: { id } }); // Notify clients
    return await Inventory.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $project: {
          email: 1,
          supplierName: 1,
          drugName: 1,
          composition: 1,
          drugType: 1,
          batchID: 1,
          quantity: 1,
          supplierLicenseNumber: 1,
          drugLicenseNumber: 1,
          expireDate: 1,
          mrp: 1,
          rate: 1,
          amount: 1,
          free: 1,
          hsnCode: 1,
          discount: 1,
          box: 1,
          thresholdValue: 1,
          previousQuantity: 1,
          createdby: 1,
          createdUserRole: 1,
          createdDate: 1,
          lastUPdatedDate: 1,
          totalValue: { $multiply: ['$quantity', '$rate'] }
        }
      }
    ]);
  } catch (error) {
    logger.error(`Failed to delete inventory item with ID ${id}: ${error.message}`);
    throw new Error(`Failed to delete inventory item with ID ${id}`);
  }
}

// Get low stock drugs
async function getLowStockDrugs() {
  try {
    const pipeline = [
      {
        $match: {
          quantity: { $lt: 10 }
        }
      },
      {
        $project: {
          drugName: 1,
          quantity: 1,
          thresholdValue: 1,
          supplierName: 1,
          drugType: 1,
          batchID: 1,
          expireDate: 1,
          mrp: 1,
          rate: 1
        }
      }
    ];

    const results = await Inventory.aggregate(pipeline);
    logger.info('Retrieved low stock drugs successfully');
    broadcast({ event: 'lowStock', data: results }); // Notify clients
    return results;
  } catch (error) {
    logger.error(`Failed to fetch low stock drugs: ${error.message}`);
    throw new Error('Failed to fetch low stock drugs');
  }
}

// Get expired drugs
async function getExpiredDrugs() {
  try {
    const today = new Date();
    const pipeline = [
      {
        $match: {
          expireDate: { $lt: today }
        }
      },
      {
        $project: {
          drugName: 1,
          quantity: 1,
          expiryDate: 1,
          supplierName: 1,
          drugType: 1,
          batchID: 1,
          mrp: 1,
          rate: 1
        }
      }
    ];

    const results = await Inventory.aggregate(pipeline);
    logger.info('Retrieved expired drugs successfully');
    broadcast({ event: 'expired', data: results }); // Notify clients
    return results;
  } catch (error) {
    logger.error(`Failed to fetch expired drugs: ${error.message}`);
    throw new Error('Failed to fetch expired drugs');
  }
}

// Get drugs expiring soon
async function getDrugsExpiringSoon() {
  try {
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    const pipeline = [
      {
        $match: {
          expireDate: { $gte: today, $lte: oneMonthLater }
        }
      },
      {
        $project: {
          drugName: 1,
          quantity: 1,
          expiryDate: 1,
          supplierName: 1,
          drugType: 1,
          batchID: 1,
          mrp: 1,
          rate: 1
        }
      },
      {
        $sort: {
          expiryDate: 1
        }
      },
      {
        $group: {
          _id: "$drugType",
          drugs: {
            $push: {
              drugName: "$drugName",
              quantity: "$quantity",
              expiryDate: "$expiryDate",
              supplierName: "$supplierName",
              batchID: "$batchID",
              mrp: "$mrp",
              rate: "$rate"
            }
          },
          totalQuantity: { $sum: "$quantity" },
          averageMRP: { $avg: "$mrp" }
        }
      },
      {
        $project: {
          _id: 0,
          drugType: "$_id",
          drugs: 1,
          totalQuantity: 1,
          averageMRP: { $round: ["$averageMRP", 2] }
        }
      },
      {
        $sort: {
          drugType: 1
        }
      }
    ];

    const results = await Inventory.aggregate(pipeline);
    logger.info('Retrieved drugs expiring soon successfully');
    broadcast({ event: 'expiringSoon', data: results }); // Notify clients
    return results;
  } catch (error) {
    logger.error(`Failed to fetch drugs expiring soon: ${error.message}`);
    throw new Error('Failed to fetch drugs expiring soon');
  }
}

module.exports = {
  createInventory,
  getInventoryById,
  getAllInventories,
  updateInventory,
  deleteInventory,
  getLowStockDrugs,
  getExpiredDrugs,
  getDrugsExpiringSoon,
};
