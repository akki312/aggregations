const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryservice');
const mongoose = require('mongoose');
// Create a new inventory item
router.post('/inventory', async (req, res) => {
  try {
    const inventory = await inventoryService.createInventory(req.body);
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get inventory item by ID
router.get('/inventory/:id', async (req, res) => {
  const { id } = req.params; // Extract id from URL parameters
  try {
    const inventory = await inventoryService.getInventoryById(id);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all inventory items
router.get('/inventory', async (req, res) => {
  try {
    const inventories = await inventoryService.getAllInventories();
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update inventory item
router.put('/inventory/:id', async (req, res) => { // Changed from router.post to router.put
  try {
    const inventory = await inventoryService.updateInventory(req.params.id, req.body);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete inventory item
router.delete('/inventory/:id', async (req, res) => { // Changed from router.post to router.delete
  try {
    const inventory = await inventoryService.deleteInventory(req.params.id);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get financial summary
router.get('/inventory/summary', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  try {
    // Call your service or function to fetch inventory summary
    const summary = await inventoryService.getFinancialSummary(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching inventory summary:', error.message);
    res.status(500).json({ message: 'Failed to fetch inventory summary' });
  }
});


module.exports = router;
