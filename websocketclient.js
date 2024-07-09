const WebSocket = require('ws');

const url = 'ws://localhost:8081';
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected to the server');
});

ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);
});

ws.on('close', () => {
    console.log('Disconnected from the server');
});

ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`);
});
