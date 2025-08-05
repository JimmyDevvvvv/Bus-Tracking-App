import express from 'express';
import {
  getOrCreateChatRoom,
  getChatMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  getUserChatRooms
} from '../controllers/chatController.js';

const router = express.Router();

// Chat room management
router.get('/chat/rooms', getUserChatRooms);
router.get('/chat/rooms/:busId', getOrCreateChatRoom);

// Message management
router.get('/chat/rooms/:roomId/messages', getChatMessages);
router.post('/chat/messages', sendMessage);
router.put('/chat/rooms/:roomId/read', markAsRead);
router.put('/chat/messages/:messageId', editMessage);
router.delete('/chat/messages/:messageId', deleteMessage);

export default router; 