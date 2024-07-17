// server.js
const http = require('http');
const app = require('./app');
const websocketService = require('./services/websocketservice');

const server = http.createServer(app);

websocketService.initialize(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});
