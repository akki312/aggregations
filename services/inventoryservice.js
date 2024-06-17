const mongoose = require('mongoose');
const Inventory = require('../models/pharmacyinventory');

// Create a new inventory item
async function createInventory(data) {
  const inventory = new Inventory(data);
  await inventory.save();
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
        lastUPdatedDate: 1,
        totalValue: { $multiply: ['$quantity', '$rate'] }
      }
    }
  ]);
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
    console.error('Error:', error);
    throw new Error('Failed to retrieve inventory');
  }
}

// Get all inventory items
async function getAllInventories() {
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
}

// Update inventory item
async function updateInventory(id, data) {
  await Inventory.findByIdAndUpdate(id, data, { new: true });
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
}

// Delete inventory item
async function deleteInventory(id) {
  const inventory = await Inventory.findByIdAndDelete(id);
  if (!inventory) {
    throw new Error('Inventory item not found');
  }
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
}

async function getFinancialSummary(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return await Inventory.aggregate([
    {
      $match: {
        orderedOn: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$totalAmount' },
        totalDiscount: { $sum: '$discount' },
        totalProfit: { $sum: '$profit' },
        totalRefunds: {
          $sum: {
            $cond: [{ $eq: ['$status', 'ORDER_CANCELLED'] }, '$totalAmount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalDiscount: 1,
        totalProfit: 1,
        totalRefunds: 1,
      },
    },
  ]);
}


module.exports = {
  createInventory,
  getInventoryById,
  getAllInventories,
  updateInventory,
  deleteInventory,
  getFinancialSummary
};
