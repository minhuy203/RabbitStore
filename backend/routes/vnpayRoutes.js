// backend/routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const { VNPay, ignoreLogger, ProductCode, VnpLocale } = require("vnpay");
require("dotenv").config();

// ==================== CẤU HÌNH VNPAY (chỉ dùng 3 biến cũ) ====================
const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
const secureSecret = process.env.VNPAY_HASH_SECRET?.trim();
const returnUrl = process.env.VNPAY_RETURN_URL?.trim(); // bắt buộc https public

if (!tmnCode || !secureSecret || !returnUrl) {
  console.error("VNPay env missing!");
  process.exit(1);
}

const vnpay = new VNPay({
  tmnCode,
  secureSecret,
  vnpayHost:
    process.env.NODE_ENV === "production"
      ? "https://pay.vnpayment.vn"
      : "https://sandbox.vnpayment.vn",
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

const formatVNPayDate = (minutes = 0) => {
  const d = new Date(Date.now() + minutes * 60000);
  return d
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
};

const generateTxnRef = (checkoutId) => `${checkoutId}_${Date.now()}`;

// Frontend URL cứng luôn (bro đang deploy Vercel)
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

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(amount) * 100,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${checkoutId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getClientIp(req),
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: formatVNPayDate(0),
      vnp_ExpireDate: formatVNPayDate(15),
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

// ==================== VNPAY IPN (server-server) – QUAN TRỌNG NHẤT ====================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const result = vnpay.verifyIpnCall(req.query);

    if (!result.isVerified) {
      return res.json({ RspCode: "97", Message: "Checksum failed" });
    }

    if (result.isSuccess && req.query.vnp_ResponseCode === "00") {
      const checkoutId = req.query.vnp_TxnRef.split("_")[0];

      // Ở ĐÂY BRO CẬP NHẬT ĐƠN HÀNG THÀNH "paid"
      // Ví dụ: await Checkout.findByIdAndUpdate(checkoutId, { paymentStatus: "paid" });

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
