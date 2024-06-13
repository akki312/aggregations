const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryservice');

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
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
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
router.post('/inventory/:id', async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory(req.params.id, req.body);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete inventory item
router.post('/inventory/:id', async (req, res) => {
  try {
    const inventory = await inventoryService.deleteInventory(req.params.id);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
