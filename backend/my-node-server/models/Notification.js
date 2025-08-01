import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const notificationSchema = new Schema(
  {
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientIds: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    busId: {
      type: Types.ObjectId,
      ref: "Bus",
      default: null,
    },
    type: {
      type: String,
      enum: ["ANNOUNCEMENT", "EMERGENCY", "ROUTE_UPDATE", "ARRIVAL", "DELAY", "CUSTOM"],
      required: true,
    },
    category: {
      type: String,
      enum: ["ALL_CLEAR", "TRAFFIC", "ACCIDENT", "DELAYED", null],
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    deletedBy: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model("Notification", notificationSchema);
