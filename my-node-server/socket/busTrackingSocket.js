import User from '../../my-node-server/models/User.js'
import Bus from '../../my-node-server/models/Bus.js'

const busTrackingSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on("joinBusRoom", async ({ busId, userId }) => {
            socket.join(busId);
        
            try {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    console.log("Invalid userId:", userId);
                    return;
                }
        
                socket.data.userId = new mongoose.Types.ObjectId(userId);
                const user = await User.findById(socket.data.userId);
        
                if (!user) {
                    console.log("User not found!");
                    return;
                }
        
                if (user.role === "driver") {
                    console.log("Driver joined the room");
                    io.to(busId).emit("busMessage", {
                        senderType: "System",
                        content: "A driver is now sharing live location",
                    });
                } else if (user.role === "student") {
                    console.log("Student joined the room");
                    io.to(busId).emit("busMessage", {
                        senderType: "System",
                        content: "A student is now tracking the bus",
                    });
                }
            } catch (error) {
                console.error("Error processing joinBusRoom:", error);
            }
        });        

    socket.on("updateLocation", async ({ busId, latitude, longitude }) => {
        if (!socket.data.userId) {
            console.log("No user ID found on socket.");
            return;
        }
    
        const user = await User.findById(socket.data.userId);
        if (!user) {
            console.log("User not found.");
            return;
        }
    
        if (user.role !== "driver") {
            console.log("Unauthorized location update attempt.");
            return;
        }
    
        console.log(`Received location update for bus ${busId}: ${latitude}, ${longitude}`);
        await Bus.findByIdAndUpdate(busId, { latitude, longitude });
    
        io.to(busId).emit("busLocationUpdate", { busId, latitude, longitude });
        });    
    });
};

export default busTrackingSocket;