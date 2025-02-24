import User from '../models/User.js';

const chatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Handle joining a room
        socket.on('joinRoom', async ({ chatRoomId, userId }) => {
            socket.join(chatRoomId);

            const user = await User.findById(userId);
            if (user) {
                socket.data.userName = user.name;
                io.to(chatRoomId).emit('receiveMessage', { senderType: 'System', content: `${user.name} joined the room.` });
                console.log(`${user.name} joined room: ${chatRoomId}`);
            } else {
                io.to(chatRoomId).emit('receiveMessage', { senderType: 'System', content: 'Unknown user joined the room.' });
            }
        });

        // Handle sending a message
        socket.on('sendMessage', async ({ chatRoomId, content }) => {
            const userName = socket.data.userName || 'Anonymous';
            console.log(`Message from ${userName}: ${content}`);
            io.to(chatRoomId).emit('receiveMessage', { senderType: userName, content });
        });

        // Handle user disconnecting
        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });
};

export default chatSocket;
