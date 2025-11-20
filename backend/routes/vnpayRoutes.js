// backend/routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const { VNPay } = require("vnpay");

// ==== LOAD ENV ====
require("dotenv").config();

// Kiểm tra env
const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
const secureSecret = process.env.VNPAY_HASH_SECRET?.trim();

if (!tmnCode || !secureSecret) {
  console.error("❌ Thiếu biến môi trường VNPay");
  console.error("VNPAY_TMN_CODE:", tmnCode ? "OK" : "MISSING");
  console.error("VNPAY_HASH_SECRET:", secureSecret ? "OK" : "MISSING");
}

// ==== KHỞI TẠO VNPAY ====
let vnpay;
try {
  vnpay = new VNPay({
    tmnCode,
    secureSecret,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    enableLog: true,
  });
  console.log("✅ VNPay initialized");
} catch (err) {
  console.error("❌ Lỗi khởi tạo VNPay:", err.message);
}

// ==== FRONTEND URLS ====
const FRONTEND_BASE = "https://rabbit-store-yvxj.vercel.app";
const SUCCESS_PAGE = `${FRONTEND_BASE}/order-success`;
const FAILED_PAGE = `${FRONTEND_BASE}/checkout`;

// ==== Lấy IP ====
const getIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim().replace(/^::ffff:/, "");
  return (req.ip || req.connection?.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "");
};

// ==== Format thời gian VNPay (UTC+7) ====
function VNPayTimePlus(minutes) {
  const date = new Date(Date.now() + minutes * 60000);
  date.setHours(date.getHours() + 7); // chuyển từ UTC sang GMT+7

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
}

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  if (!vnpay) {
    return res.status(500).json({ success: false, message: "VNPay chưa cấu hình" });
  }

  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }

    const amountNum = Math.round(Number(amount));
    if (isNaN(amountNum) || amountNum < 1000) {
      return res.status(400).json({ success: false, message: "Amount phải ≥ 1000" });
    }

    const cleanCheckoutId = String(checkoutId).trim();
    if (cleanCheckoutId.length === 0 || cleanCheckoutId.length > 50) {
      return res.status(400).json({ success: false, message: "checkoutId không hợp lệ" });
    }

    const returnUrl =
      `${process.env.VNPAY_RETURN_URL}?checkoutId=${encodeURIComponent(cleanCheckoutId)}`;

    // Thời gian chuẩn VNPay
    const createDate = VNPayTimePlus(0);
    const expireDate = VNPayTimePlus(15); // 15 phút

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,
      vnp_TxnRef: cleanCheckoutId,
      vnp_OrderInfo: `Thanh toan don hang ${cleanCheckoutId}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getIp(req),
      vnp_Locale: "vn",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    });

    console.log("✅ Tạo URL thành công:", paymentUrl);

    res.json({
      success: true,
      paymentUrl,
      amount: amountNum,
      checkoutId: cleanCheckoutId,
    });
  } catch (error) {
    console.error("❌ LỖI /create-payment:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ==================== VNPAY RETURN ====================
router.get("/vnpay-return", async (req, res) => {
  if (!vnpay) {
    return res.redirect(`${FAILED_PAGE}?status=failed&code=99&reason=config`);
  }

  try {
    const query = req.query;
    const result = vnpay.verifyReturnUrl(query);

    const checkoutId = query.checkoutId || query.vnp_TxnRef;
    const code = query.vnp_ResponseCode;

    console.log("VNPAY RETURN:", { checkoutId, code, verified: result.isVerified });

    if (result.isVerified && result.isSuccess && code === "00") {
      return res.redirect(`${SUCCESS_PAGE}?checkoutId=${checkoutId}&status=success`);
    } else {
      return res.redirect(`${FAILED_PAGE}?status=failed&code=${code}&reason=vnpay`);
    }
  } catch (error) {
    console.error("LỖI /vnpay-return:", error);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99&reason=server`);
  }
});

// ==================== VNPAY IPN ====================
router.get("/vnpay-ipn", async (req, res) => {
  if (!vnpay) {
    return res.json({ RspCode: "99", Message: "VNPay not configured" });
  }

  try {
    const query = req.query;
    const result = vnpay.verifyIpnCall(query);

    console.log("VNPAY IPN:", {
      txnRef: query.vnp_TxnRef,
      code: query.vnp_ResponseCode,
      verified: result.isVerified,
      success: result.isSuccess,
    });

    if (!result.isVerified) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    if (result.isSuccess && query.vnp_ResponseCode === "00") {
      console.log(`IPN: Đơn ${query.vnp_TxnRef} thanh toán thành công`);
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      return res.json({ RspCode: query.vnp_ResponseCode || "02", Message: "Failed" });
    }
  } catch (error) {
    console.error("Lỗi /vnpay-ipn:", error);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;
