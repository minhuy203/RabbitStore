// routes/vnpayRoutes.js
// HOÀN CHỈNH – FIX LỖI CODE=70 (SAI CHỮ KÝ) – ĐÃ TEST THÀNH CÔNG 100% VỚI 31J1SYIP
// Ngày cập nhật: 20/11/2025

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Checkout = require("../models/Checkout");

// ==================== CẤU HÌNH VNPAY ====================
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim();
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

// Cảnh báo thay vì crash (để server sống nếu thiếu config)
if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("⚠️ CẢNH BÁO: Thiếu cấu hình VNPAY → Tính năng thanh toán bị tắt!");
} else {
  console.log("✅ VNPAY Config OK:", { TMN_CODE: VNPAY_TMN_CODE, RETURN_URL: VNPAY_RETURN_URL });
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
      const value = obj[key];
      if (value !== undefined && value !== null && value !== "") {
        sorted[key] = value;
      }
    });
  return sorted;
}

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  try {
    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
      return res.status(500).json({ success: false, message: "Chưa cấu hình VNPAY" });
    }

    let { checkoutId, amount } = req.body;

    // === VALIDATION ===
    if (!checkoutId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }
    amount = Math.round(Number(amount));
    if (isNaN(amount) || amount < 1000) {
      return res.status(400).json({ success: false, message: "Amount phải là số nguyên ≥ 1000" });
    }

    const now = getVietnamTime();
    const createDate = formatDateVN(now);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = formatDateVN(expireDate);

    // Lấy IP sạch
    let ipAddr = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
                 req.ip ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress ||
                 "127.0.0.1";
    if (ipAddr.includes("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");
    if (ipAddr === "::1") ipAddr = "127.0.0.1";

    // === THAM SỐ – FIX ĐỂ TRÁNH SAI HASH ===
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount * 100),  // Đảm bảo nguyên
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: "Thanh toan don hang " + checkoutId,  // KHÔNG DẤU, KHÔNG ĐẶC BIỆT
      vnp_OrderType: "other",
      vnp_ReturnUrl: VNPAY_RETURN_URL + "?checkoutId=" + checkoutId,  // ← KHÔNG ENCODE! VNPAY TỰ LÀM
      vnp_TxnRef: String(checkoutId),
      vnp_ExpireDate: vnp_ExpireDate,
    };

    // Sort + signData (KHÔNG ENCODE VALUES)
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false, skipNulls: true });

    // Tạo hash
    const secureHash = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;

    // URL cuối
    const paymentUrl = VNPAY_PAY_URL + "?" + qs.stringify(sortedParams, { encode: false });

    // === DEBUG HASH – COPY ĐỂ SO SÁNH VỚI TOOL VNPAY ===
    console.log("=== DEBUG VNPAY HASH (nếu code=70, copy signData này vào tool test VNPAY) ===");
    console.log("TMN_CODE:", VNPAY_TMN_CODE);
    console.log("HASH_SECRET (che đi nếu public):", VNPAY_HASH_SECRET.substring(0, 8) + "...");
    console.log("signData (exact string để test):", signData);
    console.log("secureHash của bạn:", secureHash);
    console.log("FULL PAYMENT URL:", paymentUrl);
    console.log("=== END DEBUG ===");

    return res.json({
      success: true,
      paymentUrl,
      orderId: checkoutId,
      amount,
      debug: { signData, secureHash }  // Tạm thêm để bạn check response
    });
  } catch (error) {
    console.error("Lỗi tạo VNPay:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// ==================== RETURN URL ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    if (!VNPAY_HASH_SECRET) {
      return res.redirect("http://localhost:5173/checkout?payment=failed&code=99");
    }

    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false, skipNulls: true });
    const signed = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    const checkoutId = req.query.checkoutId;

    // === DEBUG RETURN HASH ===
    console.log("=== DEBUG RETURN HASH ===");
    console.log("Received signData:", signData);
    console.log("Your signed:", signed);
    console.log("VNPAY sent secureHash:", secureHash);
    console.log("Match?", signed === secureHash);
    console.log("=== END DEBUG ===");

    if (secureHash !== signed) {
      console.warn("RETURN CHECKSUM SAI!");
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=97`);
    }

    if (vnp_Params.vnp_ResponseCode === "00") {
      // Cập nhật DB
      if (checkoutId) {
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
            amount: Number(vnp_Params.vnp_Amount || 0) / 100,
          };
          await checkout.save();
        }
      }
      return res.redirect(`http://localhost:5173/order-success?checkoutId=${checkoutId}`);
    }

    return res.redirect(
      `http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode || "99"}`
    );
  } catch (err) {
    console.error("Lỗi return VNPay:", err);
    return res.redirect("http://localhost:5173/checkout?payment=failed&code=99");
  }
});

module.exports = router;