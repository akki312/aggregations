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

function getStartEndDates(startDate, endDate, groupBy) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  let interval = {};
  if (groupBy === 'DAY') {
    interval = { day: { $dayOfMonth: "$orderedOn" }, month: { $month: "$orderedOn" }, year: { $year: "$orderedOn" } };
  } else if (groupBy === 'WEEK') {
    interval = { week: { $week: "$orderedOn" }, year: { $year: "$orderedOn" } };
  } else if (groupBy === 'MONTH') {
    interval = { month: { $month: "$orderedOn" }, year: { $year: "$orderedOn" } };
  }

  return { start, end, interval };
}

async function getSalesGraphData(startDate, endDate, groupBy) {
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
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 }
    }
  ]);

  return results.map(result => {
    let startDate;
    let endDate;
    if (groupBy === 'DAY') {
      startDate = new Date(result._id.year, result._id.month - 1, result._id.day);
      endDate = new Date(result._id.year, result._id.month - 1, result._id.day);
    } else if (groupBy === 'WEEK') {
      const startOfWeek = new Date(result._id.year, 0, (result._id.week - 1) * 7 + 1);
      const endOfWeek = new Date(result._id.year, 0, result._id.week * 7);
      startDate = startOfWeek;
      endDate = endOfWeek;
    } else if (groupBy === 'MONTH') {
      startDate = new Date(result._id.year, result._id.month - 1, 1);
      endDate = new Date(result._id.year, result._id.month, 0);
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalSales: result.totalSales
    };
  });
}




module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  getAggregatedData,
  getCashFlowAnalysis,
  getSalesGraphData
};
