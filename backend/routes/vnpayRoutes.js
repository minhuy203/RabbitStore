// backend/routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("querystring");
const moment = require("moment");
require("dotenv").config();

// ==================== CẤU HÌNH VNPAY (chỉ 3 biến cũ) ====================
const VNP_TMN_CODE = process.env.VNPAY_TMN_CODE?.trim();
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET?.trim();
const VNP_RETURN_URL = process.env.VNPAY_RETURN_URL?.trim(); // https public domain

if (!VNP_TMN_CODE || !VNP_HASH_SECRET || !VNP_RETURN_URL) {
  console.error(
    "VNPay env missing! Check VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_RETURN_URL"
  );
  process.exit(1);
}

// CỨNG SANDBOX MÃI MÃI – KHÔNG BAO GIỜ LỖI DNS
const VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const FRONTEND_URL = "https://rabbit-store-yvxj.vercel.app";

// Helper: Sắp xếp object theo key (bắt buộc để chữ ký đúng)
function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

// ==================== TẠO URL THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount || amount < 1000) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount or checkoutId" });
    }

    const ipAddr =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "127.0.0.1";
    const createDate = moment().format("YYYYMMDDHHmmss");
    const expireDate = moment().add(1, "days").format("YYYYMMDDHHmmss"); // 24h sau
    const txnRef = `${checkoutId}_${Date.now()}`;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Amount: Math.round(amount) * 100,
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${checkoutId}`,
      vnp_OrderType: "250000", // other
      vnp_Locale: "vn",
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_IpAddr: ipAddr.replace(/^::ffff:/, ""),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sắp xếp + tạo chữ ký
    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    const vnp_SecureHash = hmac.update(signData).digest("hex");

    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    const paymentUrl =
      VNP_URL + "?" + qs.stringify(vnp_Params, { encode: false });

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
router.get("/vnpay-return", (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const checkSum = hmac.update(signData).digest("hex");

  const checkoutId = req.query.vnp_TxnRef?.split("_")[0] || "";

  if (secureHash === checkSum && req.query.vnp_ResponseCode === "00") {
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
});

// ==================== VNPAY IPN (server-server) – QUAN TRỌNG NHẤT ====================
router.get("/vnpay-ipn", (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const checkSum = hmac.update(signData).digest("hex");

  if (secureHash === checkSum) {
    if (req.query.vnp_ResponseCode === "00") {
      const checkoutId = req.query.vnp_TxnRef?.split("_")[0] || "";
      console.log("IPN SUCCESS → Cập nhật đơn hàng:", checkoutId, "thành paid");

      return res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      return res.json({
        RspCode: req.query.vnp_ResponseCode,
        Message: "Failed",
      });
    }
  } else {
    console.log("IPN FAILED – Sai chữ ký");
    return res.json({ RspCode: "97", Message: "Checksum failed" });
  }
});

module.exports = router;
