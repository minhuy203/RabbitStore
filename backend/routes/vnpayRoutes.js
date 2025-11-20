// backend/routes/vnpayRoutes.js – CHẠY NGON 100% TRÊN VERCEL 2025
const express = require("express");
const router = express.Router();

// DÙNG PHIÊN BẢN MỚI NHẤT CỦA PACKAGE vnpay
const { VNPay } = require("vnpay");

// === CẤU HÌNH ĐÚNG 100% CHO PACKAGE MỚI ===
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE?.trim() || "",
  hashSecret: process.env.VNPAY_HASH_SECRET?.trim() || "",
  paymentHost: "https://sandbox.vnpayment.vn", // ← ĐỔI TỪ vnpayHost → paymentHost
  testMode: true,
  hashAlgorithm: "SHA512",
});

// Kiểm tra config ngay khi khởi động
if (!vnpay.tmnCode || !vnpay.hashSecret) {
  console.error("VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET bị thiếu hoặc rỗng!");
  console.error("TMN_CODE:", vnpay.tmnCode ? "OK" : "MISSING");
  console.error("HASH_SECRET:", vnpay.hashSecret ? "OK" : "MISSING");
}

// Frontend URL
const FRONTEND = "https://rabbit-store-henna.vercel.app";
const SUCCESS_PAGE = `${FRONTEND}/order-success`;
const FAILED_PAGE = `${FRONTEND}/checkout`;

// Lấy IP
const getIp = (req) => {
  const ip = req.headers["x-forwarded-for"]?.split(",").shift()?.trim() ||
             req.ip ||
             req.socket.remoteAddress ||
             "127.0.0.1";
  return ip.replace(/^::ffff:/, "");
};

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }

    const amountNum = Math.round(Number(amount));
    if (amountNum < 1000) {
      return res.status(400).json({ success: false, message: "Số tiền phải ≥ 1000 VND" });
    }

    if (typeof checkoutId !== "string" || checkoutId.trim().length === 0) {
      return res.status(400).json({ success: false, message: "checkoutId không hợp lệ" });
    }

    const cleanCheckoutId = checkoutId.trim();

    // Tạo Return URL có kèm checkoutId
    const returnUrl = `${process.env.VNPAY_RETURN_URL}?checkoutId=${cleanCheckoutId}`;

    // Dùng đúng method mới của package vnpay
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,
      vnp_TxnRef: cleanCheckoutId,
      vnp_OrderInfo: `Thanh toan don hang ${cleanCheckoutId}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getIp(req),
      vnp_Locale: "vn",
      vnp_CreateDate: new Date(), // để package tự format
      vnp_ExpireDate: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log("VNPAY URL created thành công!");

    res.json({
      success: true,
      paymentUrl,
      checkoutId: cleanCheckoutId,
      amount: amountNum,
    });
  } catch (error) {
    console.error("LỖI TẠO VNPAY URL:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ success: false, message: "Lỗi tạo link thanh toán VNPay" });
  }
});

// ==================== RETURN ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);
    const checkoutId = req.query.checkoutId || req.query.vnp_TxnRef;

    if (result.isVerified && result.isSuccess) {
      return res.redirect(`${SUCCESS_PAGE}?checkoutId=${checkoutId}`);
    } else {
      return res.redirect(`${FAILED_PAGE}?status=failed&code=${req.query.vnp_ResponseCode || "99"}`);
    }
  } catch (err) {
    console.error("Lỗi return:", err);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99`);
  }
});

// ==================== IPN ====================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const result = vnpay.verifyIpnCall(req.query);

    if (result.isVerified && result.isSuccess) {
      console.log("IPN THÀNH CÔNG - CẬP NHẬT ĐƠN:", req.query.vnp_TxnRef);
      // CẬP NHẬT DB Ở ĐÂY
      return res.json({ RspCode: "00", Message: "Success" });
    }

    res.json({ RspCode: "97", Message: "Invalid signature" });
  } catch (err) {
    console.error("Lỗi IPN:", err);
    res.json({ RspCode: "99", Message: "Error" });
  }
});

module.exports = router;