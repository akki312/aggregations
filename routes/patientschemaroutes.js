const express = require('express');
const  mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = express.Router;
const patientMedicineService = require('../services/patientschemaservice'); // Assuming your service is in this file




// Create a new patient medicine record
app.post('/api/patientMedicines', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.createPatientMedicine(req.body);
    res.status(201).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient medicine record by ID
app.get('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.getPatientMedicineById(req.params.id);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patient medicine records
app.get('/api/patientMedicines', async (req, res) => {
  try {
    const patientMedicines = await patientMedicineService.getAllPatientMedicines();
    res.status(200).json(patientMedicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient medicine record
app.put('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.updatePatientMedicine(req.params.id, req.body);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete patient medicine record
app.delete('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.deletePatientMedicine(req.params.id);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggregate patient medicine records
app.get('/api/patientMedicines/aggregate', async (req, res) => {
  try {
    const results = await patientMedicineService.aggregatePatientMedicines();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/cashflow', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const result = await getCashFlowAnalysis(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports= router;
