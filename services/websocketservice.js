// /services/websocketService.js
const WebSocket = require('ws');

let wss;

function initialize(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New WebSocket client connected');

        ws.on('message', (message) => {
            const parsedMessage = JSON.parse(message);
            handleWebSocketMessage(ws, parsedMessage);
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

function handleWebSocketMessage(ws, message) {
    // Handle the received message here
    console.log('Received message:', message);
    // Example: Echo the message back to the client
    ws.send(JSON.stringify({ type: 'echo', message }));
}

function broadcast(data) {
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

module.exports = {
    initialize,
    broadcast,
};
