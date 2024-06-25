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
  
  // Ensure the end date includes the whole day
  end.setHours(23, 59, 59, 999);

  try {
    const result = await Inventory.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$sales" },
          totalPurchases: { $sum: "$purchases" }
        }
      }
    ]);

    // Return a single object instead of an array
    if (result.length > 0) {
      return result[0];
    } else {
      return { totalSales: 0, totalPurchases: 0 };
    }
  } catch (error) {
    console.error("Error in getFinancialSummary:", error);
    throw error; // or handle error as appropriate
  }
}


async function getLowStockDrugs() {
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
  return results;
}

async function getExpiredDrugs() {
  const today = new Date();
  const pipeline = [
    {
      $match: {
        expiryDate: { $lt: today }
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
  return results;
}

async function getDrugsExpiringSoon() {
  try {
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    const pipeline = [
      {
        $match: {
          expiryDate: { $gte: today, $lte: oneMonthLater }
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
    return results;
  } catch (error) {
    console.error('Error fetching drugs expiring soon:', error.message);
    throw error;
  }
}



module.exports = {
  createInventory,
  getInventoryById,
  getAllInventories,
  updateInventory,
  deleteInventory,
  getFinancialSummary,
  getLowStockDrugs,
  getExpiredDrugs,
  getDrugsExpiringSoon
};
