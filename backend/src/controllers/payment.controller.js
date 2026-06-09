import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PLAN_PRICING } from "../constants/plans.js";
import { getRazorpayClient } from "../config/razorpay.js";
import { supabase } from "../config/db.js";
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
    workspaceId: String(workspace.id),
    phone: workspace.phone,
    planId: plan
  };

  const order = await razorpay.orders.create({
    amount: selectedPlan.amount,
    currency: selectedPlan.currency,
    receipt,
    notes
  });

  const { error } = await supabase.from("payments").insert({
    userId: workspace.id,
    planId: plan,
    amount: order.amount,
    currency: order.currency,
    receipt,
    razorpayOrderId: order.id,
    status: order.status,
    notes
  });
  if (error) throw new HttpError(500, `Could not record payment order: ${error.message}`);

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

  const { data: payment, error: findError } = await supabase
    .from("payments")
    .select("*")
    .eq("userId", workspace.id)
    .eq("planId", plan)
    .eq("razorpayOrderId", razorpayOrderId)
    .maybeSingle();
  if (findError) throw new HttpError(500, findError.message);
  if (!payment) {
    throw new HttpError(404, "Payment order not found.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        razorpayPaymentId: razorpayPaymentId || "",
        razorpaySignature: razorpaySignature || ""
      })
      .eq("id", payment.id);
    throw new HttpError(400, "Payment signature verification failed.");
  }

  const { data: updatedPayment, error: updateError } = await supabase
    .from("payments")
    .update({
      status: "verified",
      razorpayPaymentId,
      razorpaySignature
    })
    .eq("id", payment.id)
    .select("*")
    .single();
  if (updateError) throw new HttpError(500, updateError.message);

  workspace.plan = plan;
  await workspace.save();

  res.status(200).json({
    verified: true,
    plan: workspace.plan,
    payment: {
      id: updatedPayment.id,
      razorpayOrderId: updatedPayment.razorpayOrderId,
      razorpayPaymentId: updatedPayment.razorpayPaymentId,
      status: updatedPayment.status
    }
  });
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .eq("userId", workspace.id)
    .order("created_at", { ascending: false });
  if (error) throw new HttpError(500, error.message);

  res.status(200).json({ payments: payments || [] });
});
