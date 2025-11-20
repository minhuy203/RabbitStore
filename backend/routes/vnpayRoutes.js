// routes/vnpayRoutes.js  ← COPY-PASTE TOÀN BỘ FILE NÀY LÀ XONG 100%
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const querystring = require("qs");
const Checkout = require("../models/Checkout");

const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim();
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) sorted[key] = obj[key];
  return sorted;
}

router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount, orderInfo = "Thanh toan don hang Rabbit Store" } = req.body;

    if (!checkoutId || !amount) {
      return res.status(400).json({ message: "Thiếu checkoutId hoặc amount" });
    }

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000); // +15 phút
    const vnp_ExpireDate = expireDate.toISOString().replace(/[-:T.]/g, "").slice(0, 14);

    const vnp_TxnRef = Date.now().toString(); // chỉ dùng số

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: amount * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: `${orderInfo} - ID: ${checkoutId}`,
      vnp_OrderType: "250000",           // QR category
      vnp_BankCode: "qrcode",            // chữ thường
      vnp_ReturnUrl: `${VNPAY_RETURN_URL}?checkoutId=${checkoutId}`,
      vnp_TxnRef: vnp_TxnRef,
      vnp_ExpireDate: vnp_ExpireDate,    // ← DÒNG DUY NHẤT CÒN THIẾU – BẮT BUỘC!
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

// Callback – giữ nguyên
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
    try {
      const checkout = await Checkout.findById(checkoutId);
      if (checkout && checkout.paymentStatus === "unpaid") {
        checkout.paymentStatus = "paid";
        checkout.isPaid = true;
        checkout.paidAt = Date.now();
        checkout.paymentDetails = { method: "VNPay", transactionId: vnp_Params.vnp_TransactionNo };
        await checkout.save();
      }
    } catch (err) {
      console.error("Lỗi cập nhật checkout:", err);
    }
    res.redirect(`http://localhost:5173/order-confirmation?from=vnpay&checkoutId=${checkoutId}`);
  } else {
    res.redirect(`http://localhost:5173/checkout?vnpay=failed`);
  }
});

module.exports = router;