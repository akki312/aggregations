const express = require('express');

const router = express.Router();
const patientMedicineService = require('../services/patientservice'); // Assuming your service is in this file




// Create a new patient medicine record
router.post('/api/patientMedicines', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.createPatientMedicine(req.body);
    res.status(201).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient medicine record by ID
router.get('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.getPatientMedicineById(req.params.id);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all patient medicine records
router.get('/api/patientMedicines', async (req, res) => {
  try {
    const patientMedicines = await patientMedicineService.getAllPatientMedicines();
    res.status(200).json(patientMedicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update patient medicine record
router.post('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.updatePatientMedicine(req.params.id, req.body);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete patient medicine record
router.post('/api/patientMedicines/:id', async (req, res) => {
  try {
    const patientMedicine = await patientMedicineService.deletePatientMedicine(req.params.id);
    res.status(200).json(patientMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggregate patient medicine records
router.get('/api/patientMedicines/aggregate', async (req, res) => {
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
    const result = await patientMedicineService.getCashFlowAnalysis(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sales-graph', async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;

  if (!startDate || !endDate || !groupBy) {
    return res.status(400).json({ error: 'Bad Request: Missing required query parameters' });
  }

  try {
    const data = await patientMedicineService.getSalesGraphData(startDate, endDate, groupBy);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sales graph data:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/order-summary', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const result = await patientMedicineService.getOrderSummary(startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/order-samples', async (req, res) => {
  try {
    const result = await patientMedicineService.getOrderSamples();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/top-customers', async (req, res) => {
  try {
    const topCustomers = await patientMedicineService.getTopCustomers();
    res.json(topCustomers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/financial-summary', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const summary = await patientMedicineService.getFinancialSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error.message);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
});


router.get('/sales-details', async (req, res) => {
  const { startDate, endDate, orderFrom } = req.query;

  if (!startDate || !endDate || !orderFrom) {
    return res.status(400).json({ message: 'startDate, endDate, and orderFrom are required' });
  }

  try {
    const details = await getSalesDetails(startDate, endDate, orderFrom);
    res.json(details);
  } catch (error) {
    console.error('Error fetching sales details:', error.message);
    res.status(500).json({ message: 'Failed to fetch sales details' });
  }
});


router.get('/sales-summary', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    const summary = await patientMedicineService.getSalesSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching sales summary:', error.message);
    res.status(500).json({ message: 'Failed to fetch sales summary' });
  }
});







module.exports= router;
