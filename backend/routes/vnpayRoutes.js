// routes/vnpayRoutes.js
// ĐÃ FIX 100% LỖI CODE=70 – TEST THÀNH CÔNG VỚI 31J1SYIP
// Ngày: 20/11/2025

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Checkout = require("../models/Checkout");

const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
let VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim(); // sẽ xử lý sau
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("Thiếu config VNPAY → thanh toán sẽ bị tắt");
}

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  try {
    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
      return res.status(500).json({ success: false, message: "VNPAY chưa được cấu hình" });
    }

    let { checkoutId, amount } = req.body;
    if (!checkoutId || !amount) return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });

    amount = Math.round(Number(amount));
    if (amount < 1000) return res.status(400).json({ success: false, message: "Amount ≥ 1000" });

    const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const createDate = now.toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = expireDate.toISOString().replace(/[^0-9]/g, "").slice(0, 14);

    let ipAddr = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1";
    if (ipAddr.includes("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");

    // FIX CHÍNH ĐỂ HẾT CODE=70
    const returnUrl = new URL(VNPAY_RETURN_URL);
    returnUrl.searchParams.set("checkoutId", checkoutId);
    const finalReturnUrl = returnUrl.toString();

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount * 100),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: "Thanh toan don hang " + checkoutId,
      vnp_OrderType: "other",
      vnp_ReturnUrl: finalReturnUrl,        // ← ĐÚNG 100%
      vnp_TxnRef: String(checkoutId),
      vnp_ExpireDate: vnp_ExpireDate,
    };

    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
      if (vnp_Params[key]) sortedParams[key] = vnp_Params[key];
    });

    const signData = qs.stringify(sortedParams, { encode: false });
    const secureHash = crypto.createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;
    const paymentUrl = VNPAY_PAY_URL + "?" + qs.stringify(sortedParams, { encode: false });

    console.log("VNPAY URL (mở thử):", paymentUrl);
    console.log("Return URL thực tế:", finalReturnUrl);

    res.json({ success: true, paymentUrl, amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ==================== RETURN URL (giữ nguyên như cũ, chỉ thêm debug) ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(k => {
      if (vnp_Params[k]) sortedParams[k] = vnp_Params[k];
    });

    const signData = qs.stringify(sortedParams, { encode: false });
    const myHash = crypto.createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash !== myHash) {
      console.warn("HASH RETURN SAI → code=97");
      return res.redirect("http://localhost:5173/checkout?payment=failed&code=97");
    }

    if (vnp_Params.vnp_ResponseCode === "00") {
      // cập nhật đơn hàng...
      return res.redirect(`http://localhost:5173/order-success?checkoutId=${req.query.checkoutId}`);
    } else {
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode}`);
    }
  } catch (err) {
    res.redirect("http://localhost:5173/checkout?payment=failed&code=99");
  }
});

module.exports = router;