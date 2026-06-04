import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_PRICING } from "../constants/plans.js";
import { getRazorpayClient } from "../config/razorpay.js";
import { Payment } from "../models/payment.model.js";
import { HttpError } from "../utils/httpError.js";
import env from "../config/env.js";

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const { plan } = req.body;
  const selectedPlan = PLAN_PRICING[plan];

  if (!selectedPlan || selectedPlan.amount <= 0) {
    throw new HttpError(400, "Select a valid paid plan.");
  }

  const razorpay = getRazorpayClient();
  const receipt = `fincoach_${plan}_${Date.now()}`;
  const notes = {
    workspaceId: String(workspace._id),
    phone: workspace.phone,
    planId: plan
  };

  const order = await razorpay.orders.create({
    amount: selectedPlan.amount,
    currency: selectedPlan.currency,
    receipt,
    notes
  });

  await Payment.create({
    workspaceId: workspace._id,
    planId: plan,
    amount: order.amount,
    currency: order.currency,
    receipt,
    razorpayOrderId: order.id,
    status: order.status,
    notes
  });

  res.status(201).json({
    key: env.razorpayKeyId,
    order,
    plan: selectedPlan
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const {
    plan,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature
  } = req.body;

  const selectedPlan = PLAN_PRICING[plan];
  if (!selectedPlan || selectedPlan.amount <= 0) {
    throw new HttpError(400, "Invalid paid plan.");
  }

  const payment = await Payment.findOne({
    workspaceId: workspace._id,
    planId: plan,
    razorpayOrderId: razorpayOrderId
  });

  if (!payment) {
    throw new HttpError(404, "Payment order not found.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    payment.status = "failed";
    payment.razorpayPaymentId = razorpayPaymentId || "";
    payment.razorpaySignature = razorpaySignature || "";
    await payment.save();
    throw new HttpError(400, "Payment signature verification failed.");
  }

  payment.status = "verified";
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  await payment.save();

  workspace.plan = plan;
  await workspace.save();

  res.status(200).json({
    verified: true,
    plan: workspace.plan,
    payment: {
      id: payment._id,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      status: payment.status
    }
  });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const payments = await Payment.find({ workspaceId: workspace._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ payments });
});
