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


// Aggregate patient medicine records (deep aggregation)
async function aggregatePatientMedicines() {
  const results = await PatientMedicine.aggregate([
    // Unwind drugInfo array
    {
      $unwind: '$drugInfo'
    },
    // Match stage: filter out expired drugs
    {
      $match: {
        'drugInfo.expireDate': {
          $gte: new Date()
        }
      }
    },
    // Group stage: group by patientID, calculate total drugs, total quantity, and total amount
    {
      $group: {
        _id: '$patientID',
        totalDrugs: { $sum: 1 },
        totalQuantity: { $sum: '$drugInfo.quantity' },
        totalAmount: { $sum: '$drugInfo.amount' },
        drugDetails: { $push: '$drugInfo' }
      }
    },
    // Lookup stage: join with patients collection (example)
    {
      $lookup: {
        from: 'patients', // Assuming there is a patients collection
        localField: '_id',
        foreignField: 'patientID',
        as: 'patientDetails'
      }
    },
    // Unwind patientDetails array (optional, if there's only one matching document per patient)
    {
      $unwind: {
        path: '$patientDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    // Project stage: reshape the final output
    {
      $project: {
        patientID: '$_id',
        totalDrugs: 1,
        totalQuantity: 1,
        totalAmount: 1,
        drugDetails: 1,
        patientName: '$patientDetails.name', // Assuming the patients collection has a name field
        patientContact: '$patientDetails.contact' // Assuming the patients collection has a contact field
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
