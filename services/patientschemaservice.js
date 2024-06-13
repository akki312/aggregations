const mongoose = require('mongoose');
const PatientMedicine = require('../models/patientmedicineschema'); // Assuming your schema is in this file

// Create a new patient medicine record
async function createPatientMedicine(data) {
  const patientMedicine = new PatientMedicine(data);
  await patientMedicine.save();
  return patientMedicine;
}

// Get patient medicine record by ID
async function getPatientMedicineById(id) {
  const patientMedicine = await PatientMedicine.findById(id);
  if (!patientMedicine) {
    throw new Error('Patient medicine record not found');
  }
  return patientMedicine;
}

// Get all patient medicine records
async function getAllPatientMedicines() {
  return await PatientMedicine.find({});
}

// Update patient medicine record
async function updatePatientMedicine(id, data) {
  const patientMedicine = await PatientMedicine.findByIdAndUpdate(id, data, { new: true });
  if (!patientMedicine) {
    throw new Error('Patient medicine record not found');
  }
  return patientMedicine;
}

// Delete patient medicine record
async function deletePatientMedicine(id) {
  const patientMedicine = await PatientMedicine.findByIdAndDelete(id);
  if (!patientMedicine) {
    throw new Error('Patient medicine record not found');
  }
  return patientMedicine;
}

// Aggregate patient medicine records (example aggregation)
async function aggregatePatientMedicines() {
  const results = await PatientMedicine.aggregate([
    {
      $unwind: '$drugInfo'
    },
    {
      $group: {
        _id: '$patientID',
        totalDrugs: { $sum: 1 },
        totalQuantity: { $sum: '$drugInfo.quantity' },
        totalAmount: { $sum: '$drugInfo.amount' }
      }
    }
  ]);
  return results;
}

module.exports = {
  createPatientMedicine,
  getPatientMedicineById,
  getAllPatientMedicines,
  updatePatientMedicine,
  deletePatientMedicine,
  aggregatePatientMedicines
};
