const WebSocket = require('ws');

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const urlParts = req.url.split('/');
    const busId = urlParts[urlParts.length - 1];

    console.log(`Bus WebSocket connected: ${busId}`);

    const interval = setInterval(() => {
      ws.send(JSON.stringify({
        location: { latitude: 30.1234, longitude: 31.1234 },
        eta: "5 mins"
      }));
    }, 5000);

    ws.on('close', () => {
      clearInterval(interval);
      console.log(`Bus WebSocket disconnected: ${busId}`);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for bus ${busId}:`, err);
    });
  });
};
