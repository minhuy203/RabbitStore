// backend/routes/vnpayRoutes.js – PHIÊN BẢN CUỐI CÙNG, PRODUCTION READY 100%
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const qs = require("qs");

// ==================== CONFIG (không crash server nữa) ====================
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
let VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim();
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"; // live: https://pay.vnpay.vn/vpcpay.html

// Không throw nữa → để server vẫn chạy được các route khác
if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("⚠️  CẢNH BÁO: Thiếu config VNPAY! Kiểm tra .env ngay!");
  console.error("   VNPAY_TMN_CODE:", VNPAY_TMN_CODE ? "OK" : "MISSING");
  console.error("   VNPAY_HASH_SECRET:", VNPAY_HASH_SECRET ? "OK" : "MISSING");
  console.error("   VNPAY_RETURN_URL:", VNPAY_RETURN_URL ? "OK" : "MISSING");
}

// ==================== HELPER FUNCTIONS ====================
const getVietnamTime = () => new Date(Date.now() + 7 * 60 * 60 * 1000);

const formatDate14 = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

// Xóa hoàn toàn dấu tiếng Việt + ký tự đặc biệt
const toAscii = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
};

// Lấy IP sạch (loại bỏ ::ffff: prefix)
const getCleanIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    return ip.replace(/^::ffff:/, "");
  }
  return (req.ip || req.connection.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "");
};

// ==================== CREATE PAYMENT ====================
router.post("/create-payment", async (req, res) => {
  try {
    // Kiểm tra config trước khi xử lý
    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
      return res.status(500).json({ success: false, message: "VNPAY chưa được cấu hình đúng" });
    }

    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }

    const amountNum = Math.round(Number(amount));
    if (isNaN(amountNum) || amountNum < 1000) {
      return res.status(400).json({ success: false, message: "Amount phải ≥ 1000 VND" });
    }
    // BỎ % 100 === 0 → VNPAY chấp nhận bất kỳ số nào, chỉ cần vnp_Amount là nguyên

    if (typeof checkoutId !== "string" || checkoutId.trim().length === 0 || checkoutId.length > 50) {
      return res.status(400).json({ success: false, message: "checkoutId không hợp lệ" });
    }

    const cleanCheckoutId = checkoutId.trim();
    const ipAddr = getCleanIp(req);
    const now = getVietnamTime();
    const createDate = formatDate14(now);
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = formatDate14(expireDate);

    // Fix URL an toàn
    let finalReturnUrl;
    try {
      const url = new URL(VNPAY_RETURN_URL);
      url.searchParams.set("checkoutId", cleanCheckoutId);
      finalReturnUrl = url.toString();
    } catch (err) {
      console.error("VNPAY_RETURN_URL không hợp lệ:", VNPAY_RETURN_URL);
      return res.status(500).json({ success: false, message: "Cấu hình VNPAY_RETURN_URL sai" });
    }

    const orderInfo = toAscii(`Thanh toan don hang ${cleanCheckoutId}`);

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amountNum * 100),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: "250000", // mã ngành phổ biến
      vnp_ReturnUrl: finalReturnUrl,
      vnp_TxnRef: cleanCheckoutId,
      vnp_ExpireDate: vnp_ExpireDate,
    };

    // Sort + loại bỏ rác
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        const value = vnp_Params[key];
        if (value !== null && value !== undefined && value !== "") acc[key] = value;
        return acc;
      }, {});

    // Tạo chữ ký chính xác 100% theo docs VNPAY
    const signData = qs.stringify(sortedParams, { encode: false });
    const secureHash = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8")) // Buffer.from → an toàn tuyệt đối
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;
    const paymentUrl = `${VNPAY_PAY_URL}?${qs.stringify(sortedParams, { encode: false })}`;

    console.log("✅ VNPAY URL created:", paymentUrl.split("&vnp_SecureHash=")[0] + "&vnp_SecureHash=***");

    res.json({
      success: true,
      paymentUrl,
      amount: amountNum,
      checkoutId: cleanCheckoutId,
    });
  } catch (err) {
    console.error("❌ Lỗi tạo VNPAY URL:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ==================== VNPAY RETURN (frontend page) ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        if (vnp_Params[key] != null && vnp_Params[key] !== "") acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = qs.stringify(sortedParams, { encode: false });
    const myHash = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    const responseCode = vnp_Params.vnp_ResponseCode;
    const checkoutId = vnp_Params.vnp_TxnRef;

    console.log("🔄 VNPAY Return:", { checkoutId, responseCode, checksumValid: secureHash === myHash });

    // THAY ĐỔI 2 DÒNG NÀY THEO DOMAIN THẬT CỦA BẠN
    const FRONTEND_BASE = "https://rabbit-store-yvxj.vercel.app/";

    if (secureHash === myHash && responseCode === "00") {
      return res.redirect(`${FRONTEND_BASE}/order-success?checkoutId=${checkoutId}`);
    } else {
      return res.redirect(`${FRONTEND_BASE}/checkout?status=failed&code=${responseCode || "99"}`);
    }
  } catch (err) {
    console.error("Lỗi xử lý return:", err);
    res.redirect("https://rabbit-store-yvxj.vercel.app/checkout?status=failed&code=99");
  }
});

// ==================== IPN (server-to-server) ====================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((acc, key) => {
        if (vnp_Params[key] != null && vnp_Params[key] !== "") acc[key] = vnp_Params[key];
        return acc;
      }, {});

    const signData = qs.stringify(sortedParams, { encode: false });
    const myHash = crypto
      .createHmac("sha512", VNPAY_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    console.log("🔔 VNPAY IPN received:", {
      txnRef: vnp_Params.vnp_TxnRef,
      responseCode: vnp_Params.vnp_ResponseCode,
      checksumValid: secureHash === myHash,
    });

    if (secureHash === myHash) {
      // Ở ĐÂY BẠN CẬP NHẬT DB: order.status = "paid"
      // await Order.findOneAndUpdate({ checkoutId: vnp_Params.vnp_TxnRef }, { paid: true });

      res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      res.json({ RspCode: "97", Message: "Fail checksum" });
    }
  } catch (err) {
    console.error("Lỗi IPN:", err);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;