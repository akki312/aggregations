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
        week: { $isoWeek: "$orderedOn" }
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

const getSalesGraphData = async (startDate, endDate, groupBy) => {
  try {
    const { start, end, interval } = getStartEndDates(startDate, endDate, groupBy);

    const results = await PatientMedicine.aggregate([
      {
        $match: {
          orderedOn: { $gte: start, $lte: end },
        }
      },
      {
        $group: {
          _id: interval,
          totalSales: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          ...(groupBy === 'MONTH' && { "_id.month": 1 }),
          ...(groupBy === 'WEEK' && { "_id.week": 1 }),
          ...(groupBy === 'DAY' && { "_id.month": 1, "_id.day": 1 })
        }
      }
    ]);

    return results.map(result => {
      let startDate, endDate;

      if (groupBy === 'DAY') {
        startDate = new Date(result._id.year, result._id.month - 1, result._id.day);
        endDate = new Date(result._id.year, result._id.month - 1, result._id.day);
      } else if (groupBy === 'WEEK') {
        const firstDayOfYear = new Date(result._id.year, 0, 1);
        const weekStartDate = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + (result._id.week - 1) * 7));
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        startDate = weekStartDate;
        endDate = weekEndDate;
      } else if (groupBy === 'MONTH') {
        startDate = new Date(result._id.year, result._id.month - 1, 1);
        endDate = new Date(result._id.year, result._id.month, 0);
      }

      

      return {
        startDate: startDate,
        endDate: endDate,
        totalSales: result.totalSales
      };
    });
  } catch (error) {
    console.error('Error in getSalesGraphData:', error.message);
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
        orderedOn: { $gte: start, $lte: end },
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
