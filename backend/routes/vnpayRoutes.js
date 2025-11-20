// backend/routes/vnpayRoutes.js – ĐÃ FIX LỖI 500 (phiên bản 2025)
const express = require("express");
const router = express.Router();
const { VNPay } = require("vnpay");

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE?.trim(),
  hashSecret: process.env.VNPAY_HASH_SECRET?.trim(),   // ← ĐÃ SỬA Ở ĐÂY
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
});

if (!vnpay.tmnCode || !vnpay.hashSecret) {
  console.error("VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET bị thiếu!");
}

const FRONTEND_BASE = "https://rabbit-store-henna.vercel.app";
const SUCCESS_PAGE = `${FRONTEND_BASE}/order-success`;
const FAILED_PAGE = `${FRONTEND_BASE}/checkout`;

const getIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",").shift()?.trim() ||
  req.ip ||
  req.socket.remoteAddress ||
  "127.0.0.1";

// TẠO LINK THANH TOÁN
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount) return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

    const amountNum = Math.round(Number(amount));
    if (amountNum < 1000) return res.status(400).json({ success: false, message: "Tối thiểu 1.000đ" });

    const returnUrl = `${process.env.VNPAY_RETURN_URL}?checkoutId=${checkoutId}`;

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,
      vnp_TxnRef: checkoutId,
      vnp_OrderInfo: `Thanh toan don hang ${checkoutId}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getIp(req),
      vnp_Locale: "vn",
      vnp_ExpireDate: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log("VNPAY URL created:", paymentUrl.replace(/vnp_SecureHash=[^&]+/, "vnp_SecureHash=***"));

    res.json({ success: true, paymentUrl });
  } catch (err) {
    console.error("Lỗi tạo VNPay URL:", err.message);
    res.status(500).json({ success: false, message: "Lỗi server VNPay" });
  }
});

// RETURN
router.get("/vnpay-return", async (req, res) => {
  try {
    const query = req.query;
    const result = vnpay.verifyReturnUrl(query);

    const checkoutId = query.checkoutId || query.vnp_TxnRef;

    console.log("VNPAY RETURN", { checkoutId, success: result.isSuccess, verified: result.isVerified });

    if (result.isVerified && result.isSuccess) {
      return res.redirect(`${SUCCESS_PAGE}?checkoutId=${checkoutId}`);
    }
    return res.redirect(`${FAILED_PAGE}?status=failed&code=${query.vnp_ResponseCode || "99"}`);
  } catch (err) {
    console.error("Lỗi return:", err);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99`);
  }
});

// IPN
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const result = vnpay.verifyIpnCall(req.query);

    if (result.isVerified && result.isSuccess) {
      // CẬP NHẬT DB Ở ĐÂY
      console.log("IPN THÀNH CÔNG - CẬP NHẬT ĐƠN:", req.query.vnp_TxnRef);
      return res.json({ RspCode: "00", Message: "Success" });
    }

    res.json({ RspCode: result.isSuccess ? "97" : "02", Message: "Failed" });
  } catch (err) {
    console.error("Lỗi IPN:", err);
    res.json({ RspCode: "99", Message: "Error" });
  }
});

module.exports = router;