import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    senderType: { type: String, enum: ['student', 'driver'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
