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

module.exports = {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  getAggregatedData
};
