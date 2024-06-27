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
    return results;
  } catch (error) {
    console.error('Error fetching drugs expiring soon:', error.message);
    throw error;
  }
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


async function getSalesDetails(startDate, endDate, orderFrom) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Ensure the end date includes the whole day

  const results = await Order.aggregate([
    {
      $match: {
        orderedOn: { $gte: start, $lte: end },
        orderFrom: orderFrom
      }
    },
    {
      $group: {
        _id: "$orderFrom",
        totalSales: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  // Calculate the total sales for all orders within the date range
  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        orderedOn: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalAmount" }
      }
    }
  ]);

  const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

  return results.map(result => {
    const percentage = ((result.totalSales / totalSales) * 100).toFixed(2);
    return {
      orderFrom: result._id,
      totalSales: result.totalSales,
      totalOrders: result.totalOrders,
      percentage: `${percentage}%`
    };
  });
}

async function getSalesSummary(startDate, endDate) {
  try {
    const summary = await Sale.aggregate([
      {
        $match: {
          orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profit' },
          totalDiscount: { $sum: '$discount' },
          totalSales: { $sum: '$totalAmount' },
          totalRefunds: { $sum: '$refunds' }
        }
      }
    ]);

    if (summary.length > 0) {
      return {
        totalProfit: summary[0].totalProfit,
        totalDiscount: summary[0].totalDiscount,
        totalSales: summary[0].totalSales,
        totalRefunds: summary[0].totalRefunds
      };
    } else {
      return {
        totalProfit: 0,
        totalDiscount: 0,
        totalSales: 0,
        totalRefunds: 0
      };
    }
  } catch (error) {
    throw new Error('Error fetching sales summary: ' + error.message);
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
  getFinancialSummary,
  getSalesDetails,
  getSalesSummary
};
