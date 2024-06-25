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



router.get('/low-stock-drugs', async (req, res) => {
  try {
    const lowStockDrugs = await inventoryService.getLowStockDrugs();
    res.json(lowStockDrugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/expired-drugs', async (req, res) => {
  try {
    const expiredDrugs = await inventoryService.getExpiredDrugs();
    res.json(expiredDrugs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/drugs/expiring-soon', async (req, res) => {
  try {
    const results = await inventoryService.getDrugsExpiringSoon();
    res.json(results);
  } catch (error) {
    console.error('Error in API route:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
