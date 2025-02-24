import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    driverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
}, { timestamps: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom;
