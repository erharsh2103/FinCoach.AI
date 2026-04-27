import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    planId: {
      type: String,
      enum: ["pro", "elite"],
      required: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    receipt: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    status: {
      type: String,
      enum: ["created", "verified", "failed"],
      default: "created"
    },
    notes: { type: Object, default: {} }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
