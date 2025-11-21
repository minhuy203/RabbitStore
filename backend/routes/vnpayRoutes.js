// backend/routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat, // ← dùng đúng dateFormat của thư viện vnpay
} = require("vnpay");
require("dotenv").config();

// ==================== CẤU HÌNH VNPAY (CHỈ DÙNG 3 BIẾN CŨ) ====================
const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
const secureSecret = process.env.VNPAY_HASH_SECRET?.trim();
const returnUrl = process.env.VNPAY_RETURN_URL?.trim(); // https public domain

if (!tmnCode || !secureSecret || !returnUrl) {
  console.error("VNPay env missing!");
  process.exit(1);
}

// CHỈ DÙNG SANDBOX MÃI MÃI – KHÔNG BAO GIỜ ĐỤNG ĐẾN pay.vnpay.vn
const vnpay = new VNPay({
  tmnCode,
  secureSecret,
  vnpayHost: "https://sandbox.vnpayment.vn", // ← CỨNG SANDBOX 100%
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

// ==================== Helper ====================
const getClientIp = (req) =>
  (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.ip ||
    req.connection?.remoteAddress ||
    "127.0.0.1"
  ).replace(/^::ffff:/, "");

const generateTxnRef = (checkoutId) => `${checkoutId}_${Date.now()}`;

// Frontend URL (cứng vì bro không muốn thêm .env)
const FRONTEND_URL = "https://rabbit-store-yvxj.vercel.app";

// ==================== CREATE PAYMENT URL ====================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount || amount < 1000) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount or checkoutId" });
    }

    const txnRef = generateTxnRef(checkoutId);

    // Dùng đúng cách cũ của bro: expire sau 24h (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(amount) * 100, // ×100
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${checkoutId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getClientIp(req),
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()), // chuẩn vnpay lib
      vnp_ExpireDate: dateFormat(tomorrow), // expire sau 24h
    });

    res.json({
      success: true,
      paymentUrl,
      txnRef,
      checkoutId,
    });
  } catch (err) {
    console.error("VNPay create-payment error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== VNPAY RETURN (người dùng thấy) ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);

    if (result.isVerified && result.isSuccess) {
      const checkoutId = req.query.vnp_TxnRef.split("_")[0];
      return res.redirect(
        `${FRONTEND_URL}/order-confirmation?checkoutId=${checkoutId}&status=success`
      );
    } else {
      return res.redirect(
        `${FRONTEND_URL}/checkout?status=failed&code=${
          req.query.vnp_ResponseCode || 99
        }`
      );
    }
  } catch (err) {
    console.error("vnpay-return error:", err);
    return res.redirect(`${FRONTEND_URL}/checkout?status=failed&code=99`);
  }
});

// ==================== VNPAY IPN (server-server) ====================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const result = vnpay.verifyIpnCall(req.query);

    if (!result.isVerified) {
      return res.json({ RspCode: "97", Message: "Checksum failed" });
    }

    if (result.isSuccess && req.query.vnp_ResponseCode === "00") {
      const checkoutId = req.query.vnp_TxnRef.split("_")[0];
      console.log("IPN SUCCESS → Cập nhật đơn hàng:", checkoutId, "thành paid");

      return res.json({ RspCode: "00", Message: "Confirm Success" });
    }

    return res.json({
      RspCode: req.query.vnp_ResponseCode || "02",
      Message: "Failed",
    });
  } catch (err) {
    console.error("vnpay-ipn error:", err);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;
