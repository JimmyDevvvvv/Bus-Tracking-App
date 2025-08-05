import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';

// Create or get chat room for a bus
export const getOrCreateChatRoom = async (req, res) => {
  try {
    const { busId } = req.params;
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    let chatRoom = await ChatRoom.findOne({ busId, isActive: true });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        roomId: `bus-${busId}`,
        busId,
        participants: [{
          userId,
          role: userRole
        }]
      });
      await chatRoom.save();
    } else {
      // Add user to existing room if not already a participant
      const isParticipant = chatRoom.participants.some(p => p.userId.toString() === userId);
      if (!isParticipant) {
        chatRoom.participants.push({
          userId,
          role: userRole
        });
        await chatRoom.save();
      }
    }

    res.json({ success: true, chatRoom });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get chat room messages
export const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      roomId, 
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email role')
      .populate('readBy.userId', 'name');

    const total = await Message.countDocuments({ roomId, isDeleted: false });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalMessages: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { roomId, content, messageType = 'text', metadata } = req.body;
    const senderId = req.headers['x-user-id'];

    const message = new Message({
      roomId,
      senderId,
      content,
      messageType,
      metadata
    });

    await message.save();

    // Update chat room's last message
    await ChatRoom.findOneAndUpdate(
      { roomId },
      {
        lastMessage: {
          content,
          senderId,
          timestamp: new Date()
        }
      }
    );

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email role');

    // Emit real-time message via Socket.IO
    req.app.get('io').to(roomId).emit('new-message', populatedMessage);

    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'];

    await Message.updateMany(
      { 
        roomId, 
        isDeleted: false,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.headers['x-user-id'];

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate('senderId', 'name email role');

    // Emit real-time update
    req.app.get('io').to(message.roomId).emit('message-edited', populatedMessage);

    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.headers['x-user-id'];

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    // Emit real-time update
    req.app.get('io').to(message.roomId).emit('message-deleted', { messageId });

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user's chat rooms
export const getUserChatRooms = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const chatRooms = await ChatRoom.find({
      'participants.userId': userId,
      isActive: true
    })
      .populate('busId', 'busNumber licensePlate')
      .populate('lastMessage.senderId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, chatRooms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}; 