// routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const querystring = require("qs");
const Checkout = require("../models/Checkout");

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL; // http://localhost:9000/api/vnpay/vnpay-return
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) sorted[key] = obj[key];
  return sorted;
}

// API tạo link thanh toán
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount, orderInfo = "Thanh toan don hang Rabbit Store" } = req.body;

    if (!checkoutId || !amount) {
      return res.status(400).json({ message: "Thiếu checkoutId hoặc amount" });
    }

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: amount * 100,
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14),
      vnp_CurrCode: "VND",
      vnp_IpAddr: req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: `${orderInfo} - ID: ${checkoutId}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: `${VNPAY_RETURN_URL}?checkoutId=${checkoutId}`,
      vnp_TxnRef: checkoutId + "_" + Date.now(),
    };

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params.vnp_SecureHash = signed;

    const paymentUrl = VNPAY_PAY_URL + "?" + querystring.stringify(vnp_Params, { encode: false });
    res.json({ paymentUrl });
  } catch (error) {
    console.error("Lỗi tạo link VNPay:", error);
    res.status(500).json({ message: "Lỗi server VNPay" });
  }
});

// Xử lý khi khách quay lại từ VNPay
router.get("/vnpay-return", async (req, res) => {
  let vnp_Params = req.query;
  let secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const checkoutId = req.query.checkoutId;

  if (secureHash === signed && vnp_Params.vnp_ResponseCode === "00") {
    // THANH TOÁN THÀNH CÔNG → CẬP NHẬT CHECKOUT THÀNH PAID
    try {
      const checkout = await Checkout.findById(checkoutId);
      if (checkout && checkout.paymentStatus === "pending") {
        checkout.paymentStatus = "paid";
        checkout.isPaid = true;
        checkout.paidAt = Date.now();
        checkout.paymentDetails = { method: "VNPay", transactionId: vnp_Params.vnp_TransactionNo };
        await checkout.save();
      }
    } catch (err) {
      console.error("Lỗi cập nhật checkout VNPay:", err);
    }

    res.redirect(`http://localhost:5173/order-confirmation?from=vnpay&checkoutId=${checkoutId}`);
  } else {
    res.redirect(`http://localhost:5173/checkout?vnpay=failed`);
  }
});

module.exports = router;