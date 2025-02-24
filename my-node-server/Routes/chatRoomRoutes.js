import express from 'express';
import { joinChatRoom, sendMessage } from '../controllers/chatRoomController.js';

const router = express.Router();

router.post('/join', joinChatRoom);
router.post('/send', sendMessage);

export default router;
