import mongoose from 'mongoose';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';

export const joinChatRoom = async (req, res) => {
    const { chatRoomId, senderId, senderType } = req.body;

    try {
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom) return res.status(404).json({ error: 'Chat room not found' });

        res.status(200).json({ message: `Joined room ${chatRoomId} as ${senderType}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendMessage = async (req, res) => {
    const { chatRoomId, senderId, senderType, content } = req.body;

    try {
        const message = new Message({
            content,
            senderType,
            senderId: new mongoose.Types.ObjectId(senderId),
        });
        await message.save();

        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (chatRoom) {
            chatRoom.messages.push(message._id);
            await chatRoom.save();

            io.to(chatRoomId).emit('receiveMessage', { message });
            res.status(200).json({ message: 'Message sent' });
        } else {
            res.status(404).json({ error: 'Chat room not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
