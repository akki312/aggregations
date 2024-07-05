const mongoose = require('mongoose');
const logger = require('../loaders/logger'); // Adjust the path as necessary
const PatientMedicine = require('../models/patientmedicineschema');


const createOrder = async (orderData) => {
  try {
    const newOrder = new PatientMedicine(orderData);
    const savedOrder = await newOrder.save();
    logger.info('Order created successfully');
    
    return savedOrder;
  } catch (error) {
    logger.error('Error creating order: ' + error.message);
    throw new Error('Error creating order: ' + error.message);
  }
};

const updateOrder = async (orderId, updateData) => {
  try {
    const updatedOrder = await PatientMedicine.findByIdAndUpdate(orderId, updateData, { new: true });
    logger.info('Order updated successfully');
    return updatedOrder;
  } catch (error) {
    logger.error('Error updating order: ' + error.message);
    throw new Error('Error updating order: ' + error.message);
  }
};

const getOrderById = async (orderId) => {
  try {
    const order = await PatientMedicine.findById(orderId);
    logger.info('Order fetched successfully');
    return order;
  } catch (error) {
    logger.error('Error fetching order: ' + error.message);
    throw new Error('Error fetching order: ' + error.message);
  }
};

const getAllOrders = async () => {
  try {
    const orders = await PatientMedicine.find();
    logger.info('Orders fetched successfully');
    return orders;
  } catch (error) {
    logger.error('Error fetching orders: ' + error.message);
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

    const data = await PatientMedicine.aggregate(aggregationPipeline);
    logger.info('Aggregated data fetched successfully');
    return data;
  } catch (error) {
    logger.error('Error fetching aggregated data: ' + error.message);
    throw new Error('Error fetching aggregated data: ' + error.message);
  }
};

const getCashFlowAnalysis = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const result = await PatientMedicine.aggregate([
      {
        $match: {
          orderedAt: { $gte: start, $lte: end },
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

    logger.info('Cash flow analysis fetched successfully');
    return result;
  } catch (error) {
    logger.error('Error fetching cash flow analysis: ' + error.message);
    throw new Error('Error fetching cash flow analysis: ' + error.message);
  }
};

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
  logger.info('Start and end dates calculated');
  return { start, end, interval };
};

const getSalesGraphData = async (startDate, endDate, groupBy, licenseNumber, amountKey) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const createIntervalObject = (groupBy) => {
      switch (groupBy) {
        case 'DAY':
          return {
            year: { $year: "$orderedAt" },
            month: { $month: "$orderedAt" },
            day: { $dayOfMonth: "$orderedAt" }
          };
        case 'WEEK':
          return {
            year: { $year: "$orderedAt" },
            week: { $week: "$orderedAt" }
          };
        case 'MONTH':
          return {
            year: { $year: "$orderedAt" },
            month: { $month: "$orderedAt" }
          };
        default:
          throw new Error(`Invalid groupBy value: ${groupBy}`);
      }
    };

    const interval = createIntervalObject(groupBy);
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
          _id: interval,
          totalAmount: { $sum: `$${amountKey}` }
        }
      },
      {
        $project: {
          _id: 0,
          interval: "$_id",
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

    logger.info('Sales graph data fetched successfully');
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
    logger.error('Error fetching sales graph data: ' + error.message);
    throw new Error('Error fetching sales graph data: ' + error.message);
  }
};

const getOrderSummary = async (startDate, endDate) => {
  try {
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
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        }
      },
      {
        $project: {
          orderFrom: "$_id",
          totalOrders: 1,
          totalAmount: 1,
          _id: 0,
        }
      }
    ]);

    logger.info('Order summary fetched successfully');
    return results;
  } catch (error) {
    logger.error('Error fetching order summary: ' + error.message);
    throw new Error('Error fetching order summary: ' + error.message);
  }
};

const getOrderDetails = async (startDate, endDate) => {
  try {
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
        $lookup: {
          from: "patients",
          localField: "patientID",
          foreignField: "_id",
          as: "patientDetails"
        }
      },
      {
        $unwind: "$patientDetails"
      },
      {
        $project: {
          orderID: 1,
          orderedAt: 1,
          status: 1,
          totalAmount: 1,
          modeOfPayment: 1,
          patientName: "$patientDetails.name",
          patientEmail: "$patientDetails.email"
        }
      },
      {
        $sort: { orderedAt: -1 }  // Sort by most recent orders
      }
    ]);

    logger.info('Order details fetched successfully');
    return results;
  } catch (error) {
    logger.error('Error fetching order details: ' + error.message);
    throw new Error('Error fetching order details: ' + error.message);
  }
};

const getTopCustomers = async (startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set end time to 23:59:59.999

    const results = await PatientMedicine.aggregate([
      {
        $match: {
          orderedAt: { $gte: start, $lte: end },
          status: 'ORDER_DELIVERED'
        }
      },
      {
        $group: {
          _id: '$patientID',
          totalAmountSpent: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
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
          totalOrders: 1,
          patientName: '$patientDetails.name',
          patientEmail: '$patientDetails.email'
        }
      },
      {
        $sort: { totalAmountSpent: -1 }
      },
      {
        $limit: 10  // Top 10 customers
      }
    ]);

    logger.info('Top customers fetched successfully');
    return results;
  } catch (error) {
    logger.error('Error fetching top customers: ' + error.message);
    throw new Error('Error fetching top customers: ' + error.message);
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  getAggregatedData,
  getCashFlowAnalysis,
  getSalesGraphData,
  getOrderSummary,
  getOrderDetails,
  getTopCustomers
};
