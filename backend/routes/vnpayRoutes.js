// routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Checkout = require("../models/Checkout");

// ==============================
// CẤU HÌNH VNPay
// ==============================
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim();
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("⚠️ Thiếu cấu hình VNPay trong file .env");
}

// ==============================
// HÀM FORMAT NGÀY CHUẨN VNPay GMT+7
// ==============================
function formatDateVN(date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

// ==============================
// SORT OBJECT CHUẨN VNPay
// ==============================
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) sorted[key] = obj[key];
  return sorted;
}

// ==============================
// TẠO URL THANH TOÁN VNPay
// ==============================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount, orderInfo = "Thanh toan don hang Rabbit Store" } = req.body;

    if (!checkoutId || !amount || amount < 1000) {
      return res.status(400).json({ message: "Thiếu hoặc sai thông tin đầu vào" });
    }

    // Múi giờ Việt Nam GMT+7
    process.env.TZ = "Asia/Ho_Chi_Minh";

    const date = new Date();
    const createDate = formatDateVN(date);

    const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = formatDateVN(expireDate);

    // Đảm bảo IP luôn là IPv4
    let ipAddr =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    if (ipAddr.includes("::")) ipAddr = "127.0.0.1";

    const vnp_TxnRef = String(checkoutId);

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: vnp_TxnRef,
      vnp_OrderInfo: encodeURIComponent(orderInfo + " - ID: " + checkoutId),
      vnp_OrderType: "other", // Chuẩn VNPay
      vnp_ReturnUrl: `${VNPAY_RETURN_URL}?checkoutId=${checkoutId}`,
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: vnp_ExpireDate
    };

    // Sort params
    vnp_Params = sortObject(vnp_Params);

    // Tạo HMAC SHA512
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const vnp_SecureHash = hmac.update(Buffer.from(signData)).digest("hex");

    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    // Tạo URL thanh toán
    const paymentUrl = VNPAY_PAY_URL + "?" + qs.stringify(vnp_Params, { encode: false });

    return res.json({
      success: true,
      paymentUrl,
      orderId: vnp_TxnRef,
      amount: amount,
    });

  } catch (error) {
    console.error("❌ Lỗi tạo payment VNPay:", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// ==============================
// XỬ LÝ RETURN VNPay
// ==============================
router.get("/vnpay-return", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData)).digest("hex");

    const checkoutId = req.query.checkoutId;

    if (secureHash !== signed) {
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=97`);
    }

    // Thành công (00)
    if (vnp_Params.vnp_ResponseCode === "00") {
      const checkout = await Checkout.findById(checkoutId);

      if (checkout && checkout.paymentStatus === "unpaid") {
        checkout.paymentStatus = "paid";
        checkout.isPaid = true;
        checkout.paidAt = new Date();
        checkout.paymentDetails = {
          method: "VNPay",
          transactionId: vnp_Params.vnp_TxnRef,
          vnp_TransactionNo: vnp_Params.vnp_TransactionNo || "",
          vnp_ResponseCode: vnp_Params.vnp_ResponseCode,
        };
        await checkout.save();
      }

      return res.redirect(`http://localhost:5173/order-success?checkoutId=${checkoutId}`);
    }

    // Thất bại
    return res.redirect(
      `http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode}`
    );

  } catch (err) {
    console.error("❌ Lỗi xử lý return VNPay:", err);
    res.redirect(`http://localhost:5173/checkout?payment=failed&code=99`);
  }
});

module.exports = router;
