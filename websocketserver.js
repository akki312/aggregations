const WebSocket = require('ws');
const { createInventory, getInventoryById, getAllInventories, updateInventory, deleteInventory, getLowStockDrugs, getExpiredDrugs, getDrugsExpiringSoon } = require('./services/inventoryservice');
const logger = require('../aggregations/loaders/logger'); // Adjust the path as necessary

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
    });
});

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

module.exports = { wss, broadcast };
