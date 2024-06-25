const mongoose = require('mongoose');
// services/patientMedicineService.js
const PatientMedicine = require('../models/patientmedicineschema');

const createOrder = async (orderData) => {
  try {
    const newOrder = new PatientMedicine(orderData);
    return await newOrder.save();
  } catch (error) {
    throw new Error('Error creating order: ' + error.message);
  }
};

const updateOrder = async (orderId, updateData) => {
  try {
    return await PatientMedicine.findByIdAndUpdate(orderId, updateData, { new: true });
  } catch (error) {
    throw new Error('Error updating order: ' + error.message);
  }
};

const getOrderById = async (orderId) => {
  try {
    return await PatientMedicine.findById(orderId);
  } catch (error) {
    throw new Error('Error fetching order: ' + error.message);
  }
};

const getAllOrders = async () => {
  try {
    return await PatientMedicine.find();
  } catch (error) {
    throw new Error('Error fetching orders: ' + error.message);
  }
};

const getAggregatedData = async () => {
  try {
    const aggregationPipeline = [
      {
        $match: {
          status: 'ORDER_DELIVERED'
        }
      },
      {
        $group: {
          _id: '$patientID',
          totalAmountSpent: { $sum: '$totalAmount' },
          totalQuantityPurchased: { $sum: { $sum: '$drugInfo.quantity' } }
        }
      },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: '_id',
          as: 'patientDetails'
        }
      },
      {
        $unwind: '$patientDetails'
      },
      {
        $project: {
          patientID: '$_id',
          totalAmountSpent: 1,
          totalQuantityPurchased: 1,
          patientName: '$patientDetails.name',
          patientEmail: '$patientDetails.email'
        }
      }
    ];

    return await PatientMedicine.aggregate(aggregationPipeline);
  } catch (error) {
    throw new Error('Error fetching aggregated data: ' + error.message);
  }
};
async function getCashFlowAnalysis(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const result = await PatientMedicine.aggregate([
    {
      $match: {
        orderedOn: { $gte: start, $lte: end },
      }
    },
    {
      $group: {
        _id: "$modeOfPayment",
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $project: {
        modeOfPayment: "$_id",
        totalAmount: 1,
        _id: 0
      }
    }
  ]);

  return result;
}


const getStartEndDates = (startDate, endDate, groupBy) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Set end time to 23:59:59.999

  let interval;
  switch (groupBy) {
    case 'DAY':
      interval = {
        year: { $year: "$orderedOn" },
        month: { $month: "$orderedOn" },
        day: { $dayOfMonth: "$orderedOn" }
      };
      break;
    case 'WEEK':
      interval = {
        year: { $year: "$orderedOn" },
        week: { $week: "$orderedOn" }
      };
      break;
    case 'MONTH':
      interval = {
        year: { $year: "$orderedOn" },
        month: { $month: "$orderedOn" }
      };
      break;
  }
  return { start, end, interval };
};

const getSalesGraphData = async (startDate, endDate, groupBy, licenseNumber, amountKey) => {
  const interval = getStartEndDates(startDate, endDate, groupBy);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  try {
    const results = await PatientMedicine.aggregate([
      {
        $match: {
          licenseNumber: licenseNumber,
          status: {
            $in: [
              "ORDER_CONFIRMED",
              "ORDER_DISPATCHED",
              "ORDER_READYTOPICK",
              "ORDER_DELIVERED"
            ]
          },
          billType: { $ne: "RETURN" },
          orderedAt: {
            $gte: start,
            $lt: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: `$${amountKey}` }
        }
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1
        }
      },
      {
        $sort: {
          "interval.year": 1,
          ...(groupBy === 'MONTH' && { "interval.month": 1 }),
          ...(groupBy === 'WEEK' && { "interval.week": 1 }),
          ...(groupBy === 'DAY' && { "interval.month": 1, "interval.day": 1 })
        }
      }
    ]);

    return results.map(result => {
      let startDate, endDate;

      if (groupBy === 'DAY') {
        startDate = new Date(result.interval.year, result.interval.month - 1, result.interval.day);
        endDate = new Date(result.interval.year, result.interval.month - 1, result.interval.day);
      } else if (groupBy === 'WEEK') {
        const startOfWeek = new Date(result.interval.year, 0, (result.interval.week - 1) * 7 + 1);
        const endOfWeek = new Date(result.interval.year, 0, (result.interval.week * 7));
        startDate = startOfWeek;
        endDate = endOfWeek;
      } else if (groupBy === 'MONTH') {
        startDate = new Date(result.interval.year, result.interval.month - 1, 1);
        endDate = new Date(result.interval.year, result.interval.month, 0);
      }

      return {
        startDate: startDate.toISOString().split('T')[0],  // Format to YYYY-MM-DD
        endDate: endDate.toISOString().split('T')[0],  // Format to YYYY-MM-DD
        totalSales: result.totalAmount
      };
    });
  } catch (error) {
    console.error('Error fetching sales graph data:', error.message);
    throw error;
  }
};


async function getOrderSummary(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const results = await PatientMedicine.aggregate([
    {
      $match: {
        orderedAt: { $gte: start, $lte: end },
      }
    },
    {
      $group: {
        _id: "$orderFrom",
        totalOrders: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: "$totalOrders" },
        ordersByPlatform: {
          $push: {
            platform: "$_id",
            count: "$totalOrders"
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        ordersByPlatform: 1
      }
    }
  ]);

  if (results.length === 0) {
    return {
      totalOrders: 0,
      ordersByPlatform: []
    };
  }
  return results[0];
}


async function getOrderSamples() {
  const pipeline = [
    {
      $facet: {
        pendingOrders: [
          { $match: { status: "ORDER_PAYMENT_PENDING" } },
          { $limit: 5 }
        ],
        completedOrders: [
          { $match: { status: "ORDER_DELIVERED" } },
          { $limit: 5 }
        ],
        cancelledOrders: [
          { $match: { status: "ORDER_CANCELLED" } },
          { $limit: 5 }
        ]
      }
    },
    {
      $project: {
        pendingOrders: 1,
        completedOrders: 1,
        cancelledOrders: 1
      }
    }
  ];

  const results = await PatientMedicine.aggregate(pipeline);

  if (results.length === 0) {
    return {
      pendingOrders: [],
      completedOrders: [],
      cancelledOrders: []
    };
  }

  return results[0];
}

async function getTopCustomers() {
  const pipeline = [
    {
      $group: {
        _id: "$patientName",
        totalPurchases: { $sum: 1 }
      }
    },
    {
      $sort: { totalPurchases: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        _id: 0,
        patientName: "$_id",
        totalPurchases: 1
      }
    }
  ];

  const results = await PatientMedicine.aggregate(pipeline);
  return results;
}



module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  getAggregatedData,
  getCashFlowAnalysis,
  getSalesGraphData,
  getOrderSummary,
  getOrderSamples,
  getTopCustomers
};
