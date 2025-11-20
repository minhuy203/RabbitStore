// routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");
const Checkout = require("../models/Checkout");

// ==============================
// CẤU HÌNH VNPay - LẤY TỪ .env
// ==============================
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim();
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("⚠️ Thiếu cấu hình VNPay trong file .env");
}

// ==============================
// FORMAT NGÀY CHUẨN VNPay (YYYYMMDDHHmmss)
// NOTE: Node không đổi timezone runtime, nên ta tự cộng +7 giờ
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
// SORT OBJECT THEO KEY (tăng dần)
// ==============================
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) sorted[key] = obj[key];
  return sorted;
}

// ==============================
// HELPER: Lấy thời điểm "bây giờ" theo GMT+7
// ==============================
function nowInVN() {
  // Date.now() là ms ở UTC -> cộng 7 giờ để ra giờ VN
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

// ==============================
// ROUTE: Tạo payment URL
// ==============================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount, orderInfo = "Thanh toan don hang Rabbit Store" } = req.body;

    if (!checkoutId || !amount || isNaN(amount) || Number(amount) < 1000) {
      return res.status(400).json({ message: "Thiếu hoặc sai thông tin đầu vào" });
    }

    // Lấy thời gian theo GMT+7 đúng VNPay muốn
    const now = nowInVN();
    const createDate = formatDateVN(now);

    const expire = new Date(now.getTime() + 15 * 60 * 1000); // +15 phút
    const vnp_ExpireDate = formatDateVN(expire);

    // IP client (ép IPv4 nếu nhận IPv6)
    let ipAddr =
      (req.headers["x-forwarded-for"] || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)[0] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    // Nếu IPv6 loopback hoặc có dấu "::", chuyển về IPv4 loopback (sandbox VNPay có thể ko chấp nhận IPv6)
    if (!ipAddr) ipAddr = "127.0.0.1";
    if (ipAddr.includes("::") || ipAddr === "::1") ipAddr = "127.0.0.1";

    // Chuẩn bị params (tất cả là string)
    const vnp_TxnRef = String(checkoutId);
    const vnp_Amount = String(Number(amount) * 100); // nhân 100 theo quy định VNPay

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: vnp_Amount,
      vnp_CurrCode: "VND",
      vnp_TxnRef: vnp_TxnRef,
      // KHÔNG dùng encodeURIComponent ở đây — để qs.stringify({encode:false}) tạo query đúng theo chuẩn
      vnp_OrderInfo: `Thanh toan don hang - ID: ${checkoutId}`,
      vnp_OrderType: "other", // hoặc "fashion", "billpayment" ... chọn theo site bạn
      vnp_ReturnUrl: `${VNPAY_RETURN_URL}?checkoutId=${encodeURIComponent(checkoutId)}`,
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: vnp_ExpireDate,
      // Nếu bạn muốn hiện QR ngay lập tức, bỏ comment dòng dưới:
      // vnp_BankCode: "VNPAYQR",
    };

    // Sort theo key và tạo string để ký
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });

    // Tạo secure hash HMAC SHA512
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sortedParams.vnp_SecureHash = vnp_SecureHash;

    // Tạo payment URL (không encode các giá trị nữa vì đã chuẩn)
    const paymentUrl = VNPAY_PAY_URL + "?" + qs.stringify(sortedParams, { encode: false });

    // (Tùy chọn) log để debug — bạn có thể bật khi test
    // console.log("VNPay payload:", sortedParams);

    return res.json({
      success: true,
      paymentUrl,
      orderId: vnp_TxnRef,
      amount: Number(amount),
    });
  } catch (error) {
    console.error("❌ Lỗi tạo payment VNPay:", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// ==============================
// ROUTE: Xử lý return từ VNPay
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
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const checkoutId = req.query.checkoutId;

    if (secureHash !== signed) {
      console.warn("VNPay: secure hash không khớp");
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=97`);
    }

    // Thành công
    if (vnp_Params.vnp_ResponseCode === "00") {
      try {
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
      } catch (err) {
        console.error("Lỗi cập nhật đơn hàng:", err);
      }
      return res.redirect(`http://localhost:5173/order-success?checkoutId=${checkoutId}`);
    }

    // Thất bại
    return res.redirect(
      `http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode}`
    );
  } catch (err) {
    console.error("❌ Lỗi xử lý return VNPay:", err);
    return res.redirect(`http://localhost:5173/checkout?payment=failed&code=99`);
  }
});

module.exports = router;
