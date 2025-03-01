const busTrackingSocket = (io) => {
    let busLocation = { latitude: 30.0444, longitude: 31.2357 }; // Initial bus location (Cairo)

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Simulate real-time bus movement every 3 seconds will prolly use by using some GETS from the DB
        const interval = setInterval(() => {
            busLocation.latitude += (Math.random() - 0.5) * 0.002; // Small random movement
            busLocation.longitude += (Math.random() - 0.5) * 0.002;

            // Will need to handle it work with DB later
            io.emit('busLocation', {
                name: 'Simulated Bus',
                latitude: busLocation.latitude,
                longitude: busLocation.longitude
            });

            console.log(`Broadcasting Simulated Location: ${busLocation.latitude}, ${busLocation.longitude}`);
        }, 3000); // Update every 3 seconds

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            clearInterval(interval); // Stop simulation when client disconnects
        });
    });
};

export default busTrackingSocket;
