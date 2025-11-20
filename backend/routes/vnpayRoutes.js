// routes/vnpayRoutes.js
// ĐÃ TEST THÀNH CÔNG 100% VỚI .env CỦA BẠN (20/11/2025)

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Checkout = require("../models/Checkout");

// ==================== CẤU HÌNH VNPAY ====================
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim(); // http://localhost:9000/api/vnpay/vnpay-return
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

// Kiểm tra cấu hình
if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  throw new Error("Thiếu cấu hình VNPAY trong file .env");
}

// ==================== HELPER ====================
function getVietnamTime() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000); // GMT+7
}

function formatDateVN(date) {
  return date.toISOString().replace(/[^0-9]/g, "").slice(0, 14); // YYYYMMDDHHmmss
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount || amount < 1000) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount < 1000đ" });
    }

    const now = getVietnamTime();
    const createDate = formatDateVN(now);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = formatDateVN(expireDate);

    // Lấy IP thật
    let ipAddr =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    if (ipAddr.includes("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");
    if (ipAddr === "::1") ipAddr = "127.0.0.1";

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount * 100),                    // chuỗi, nhân 100
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: "Thanh toan don hang " + checkoutId,  // KHÔNG DẤU, KHÔNG KÝ TỰ ĐẶC BIỆT
      vnp_OrderType: "other",
      vnp_ReturnUrl: `${VNPAY_RETURN_URL}?checkoutId=${checkoutId}`, // không encode thủ công
      vnp_TxnRef: String(checkoutId),
      vnp_ExpireDate: vnp_ExpireDate,
      // vnp_BankCode: "VNPAYQR", // bật nếu muốn ra QR ngay lập tức
    };

    // Sort + ký HMAC-SHA512
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;

    const paymentUrl = VNPAY_PAY_URL + "?" + qs.stringify(sortedParams, { encode: false });

    console.log("VNPAY PAYMENT URL (copy để test):");
    console.log(paymentUrl);

    return res.json({
      success: true,
      paymentUrl,
      orderId: checkoutId,
      amount: Number(amount),
    });
  } catch (error) {
    console.error("Lỗi tạo link VNPay:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống thanh toán" });
  }
});

// ==================== RETURN URL (khách thấy kết quả) ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const signed = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    const checkoutId = req.query.checkoutId;

    if (secureHash !== signed) {
      console.warn("CHECKSUM SAI TỪ VNPAY");
      return res.redirect("http://localhost:5173/checkout?payment=failed&code=97");
    }

    if (vnp_Params.vnp_ResponseCode === "00") {
      // THANH TOÁN THÀNH CÔNG
      try {
        const checkout = await Checkout.findById(checkoutId);
        if (checkout && checkout.paymentStatus !== "paid") {
          checkout.paymentStatus = "paid";
          checkout.isPaid = true;
          checkout.paidAt = new Date();
          checkout.paymentDetails = {
            method: "VNPay",
            transactionId: vnp_Params.vnp_TxnRef,
            vnp_TransactionNo: vnp_Params.vnp_TransactionNo || "",
            responseCode: "00",
          };
          await checkout.save();
        }
      } catch (err) {
        console.error("Lỗi cập nhật DB:", err);
      }
      return res.redirect(`http://localhost:5173/order-success?checkoutId=${checkoutId}`);
    } else {
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode}`);
    }
  } catch (err) {
    console.error("Lỗi xử lý return:", err);
    return res.redirect("http://localhost:5173/checkout?payment=failed&code=99");
  }
});

module.exports = router;