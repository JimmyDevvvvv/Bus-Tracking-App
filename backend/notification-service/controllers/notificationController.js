import Notification from '../models/Notification.js';
import nodemailer from 'nodemailer';

// Create notification
export const createNotification = async (req, res) => {
  try {
    const {
      recipientIds,
      busId,
      type,
      category,
      title,
      message,
      isUrgent,
      priority,
      metadata,
      expiresAt
    } = req.body;
    const senderId = req.headers['x-user-id'];

    const notification = new Notification({
      senderId,
      recipientIds,
      busId,
      type,
      category,
      title,
      message,
      isUrgent,
      priority,
      metadata,
      expiresAt
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    if (recipientIds && recipientIds.length > 0) {
      recipientIds.forEach(recipientId => {
        req.app.get('io').to(`user-${recipientId}`).emit('new-notification', {
          notification,
          timestamp: new Date()
        });
      });
    }

    // Send email notification for urgent messages
    if (isUrgent && recipientIds) {
      await sendEmailNotification(notification, recipientIds);
    }

    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { recipientIds: userId },
        { recipientIds: { $size: 0 } } // Broadcast notifications
      ],
      deletedBy: { $ne: userId }
    };

    if (unreadOnly === 'true') {
      query.readBy = { $not: { $elemMatch: { userId } } };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email')
      .populate('busId', 'busNumber licensePlate');

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalNotifications: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Check if user is a recipient
    const isRecipient = notification.recipientIds.includes(userId) || notification.recipientIds.length === 0;
    if (!isRecipient) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Add to readBy if not already there
    const alreadyRead = notification.readBy.some(read => read.userId.toString() === userId);
    if (!alreadyRead) {
      notification.readBy.push({
        userId,
        readAt: new Date()
      });
      await notification.save();
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Check if user is a recipient
    const isRecipient = notification.recipientIds.includes(userId) || notification.recipientIds.length === 0;
    if (!isRecipient) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Add to deletedBy if not already there
    const alreadyDeleted = notification.deletedBy.includes(userId);
    if (!alreadyDeleted) {
      notification.deletedBy.push(userId);
      await notification.save();
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get bus-specific notifications
export const getBusNotifications = async (req, res) => {
  try {
    const { busId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ busId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email')
      .populate('busId', 'busNumber licensePlate');

    const total = await Notification.countDocuments({ busId });

    res.json({
      success: true,
      notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalNotifications: total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const total = await Notification.countDocuments({
      $or: [
        { recipientIds: userId },
        { recipientIds: { $size: 0 } }
      ],
      deletedBy: { $ne: userId }
    });

    const unread = await Notification.countDocuments({
      $or: [
        { recipientIds: userId },
        { recipientIds: { $size: 0 } }
      ],
      deletedBy: { $ne: userId },
      readBy: { $not: { $elemMatch: { userId } } }
    });

    const urgent = await Notification.countDocuments({
      $or: [
        { recipientIds: userId },
        { recipientIds: { $size: 0 } }
      ],
      deletedBy: { $ne: userId },
      isUrgent: true
    });

    res.json({
      success: true,
      stats: {
        total,
        unread,
        urgent
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Send email notification
const sendEmailNotification = async (notification, recipientIds) => {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    // In a real implementation, you would fetch user emails from the User service
    // For now, we'll just log the notification
    console.log('Email notification would be sent:', {
      notification: notification.title,
      recipients: recipientIds
    });

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: userEmails,
    //   subject: notification.title,
    //   text: notification.message
    // });
  } catch (error) {
    console.error('Email notification error:', error);
  }
}; 