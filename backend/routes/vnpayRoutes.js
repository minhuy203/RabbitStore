// backend/routes/vnpayRoutes.js
const express = require("express");
const router = express.Router();
const { VNPay, dateFormat } = require("vnpay");

// ==== BƯỚC 1: LOAD ENV SỚM NHẤT CÓ THỂ (trước khi dùng process.env) ====
require("dotenv").config(); // ← Quan trọng nhất! Đảm bảo chạy trước mọi thứ

// ==== BƯỚC 2: Kiểm tra & log ngay lập tức ====
const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
const secureSecret = process.env.VNPAY_HASH_SECRET?.trim();

if (!tmnCode || !secureSecret) {
  console.error("❌ VNPAY CONFIG THIẾU HOẶC SAI TÊN BIẾN .env");
  console.error("   → VNPAY_TMN_CODE:", tmnCode ? "OK" : "MISSING");
  console.error("   → VNPAY_HASH_SECRET:", secureSecret ? "OK" : "MISSING");
  console.error(
    "   → Tất cả biến hiện có:",
    Object.keys(process.env).filter((k) => k.includes("VNPAY"))
  );
  // Không process.exit() để Vercel vẫn chạy được, nhưng bạn sẽ thấy lỗi ngay
}

// ==== BƯỚC 3: Khởi tạo VNPay chỉ khi config hợp lệ ====
let vnpay;
try {
  vnpay = new VNPay({
    tmnCode,
    secureSecret,
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true,
    hashAlgorithm: "SHA512",
    enableLog: true, // vẫn bật để debug
  });
  console.log("✅ VNPay instance khởi tạo thành công (sandbox)");
} catch (err) {
  console.error("❌ KHỞI TẠO VNPAY THẤT BẠI:", err.message);
}

// Frontend URLs
const FRONTEND_BASE = "https://rabbit-store-yvxj.vercel.app/";
const SUCCESS_PAGE = `${FRONTEND_BASE}/order-success`;
const FAILED_PAGE = `${FRONTEND_BASE}/checkout`;

// Helper lấy IP (Vercel/Netlify/Render)
const getIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded
      .split(",")[0]
      .trim()
      .replace(/^::ffff:/, "");
  }
  return (req.ip || req.connection?.remoteAddress || "127.0.0.1").replace(
    /^::ffff:/,
    ""
  );
};

// ==================== TẠO LINK THANH TOÁN ====================
router.post("/create-payment", async (req, res) => {
  if (!vnpay) {
    return res
      .status(500)
      .json({ success: false, message: "VNPay chưa được cấu hình" });
  }

  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }

    const amountNum = Math.round(Number(amount));
    if (isNaN(amountNum) || amountNum < 1000) {
      return res
        .status(400)
        .json({ success: false, message: "Amount phải ≥ 1000 VND" });
    }

    const cleanCheckoutId = String(checkoutId).trim();
    if (cleanCheckoutId.length === 0 || cleanCheckoutId.length > 50) {
      return res
        .status(400)
        .json({ success: false, message: "checkoutId không hợp lệ" });
    }

    const returnUrl = `${
      process.env.VNPAY_RETURN_URL
    }?checkoutId=${encodeURIComponent(cleanCheckoutId)}`;

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,
      vnp_TxnRef: cleanCheckoutId,
      vnp_OrderInfo: `Thanh toan don hang ${cleanCheckoutId}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getIp(req),
      vnp_Locale: "vn",
      vnp_ExpireDate: dateFormat(new Date(Date.now() + 15 * 60 * 1000)), // ← FIX CHUẨN
    });

    console.log(
      "✅ Tạo URL VNPay thành công:",
      cleanCheckoutId,
      amountNum + "đ"
    );

    res.json({
      success: true,
      paymentUrl,
      amount: amountNum,
      checkoutId: cleanCheckoutId,
    });
  } catch (error) {
    console.error("❌ LỖI /create-payment:", error);
    res.status(500).json({ success: false, message: "Lỗi server, xem logs" });
  }
});

// ==================== VNPAY RETURN ====================
router.get("/vnpay-return", async (req, res) => {
  if (!vnpay) {
    return res.redirect(`${FAILED_PAGE}?status=failed&code=99&reason=config`);
  }

  try {
    const query = req.query;
    const result = vnpay.verifyReturnUrl(query);

    const checkoutId = query.checkoutId || query.vnp_TxnRef;
    const code = query.vnp_ResponseCode;

    console.log("VNPAY RETURN:", {
      checkoutId,
      code,
      verified: result.isVerified,
      success: result.isSuccess,
    });

    if (result.isVerified && result.isSuccess && code === "00") {
      return res.redirect(
        `${SUCCESS_PAGE}?checkoutId=${checkoutId}&status=success`
      );
    } else {
      return res.redirect(
        `${FAILED_PAGE}?status=failed&code=${code || "99"}&reason=vnpay`
      );
    }
  } catch (error) {
    console.error("LỖI /vnpay-return:", error);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99&reason=server`);
  }
});

// ==================== VNPAY IPN (QUAN TRỌNG NHẤT) ====================
router.get("/vnpay-ipn", async (req, res) => {
  if (!vnpay) {
    return res.json({ RspCode: "99", Message: "VNPay not configured" });
  }

  try {
    const query = req.query;
    const result = vnpay.verifyIpnCall(query); // ← Đây là method đúng cho IPN

    console.log("VNPAY IPN nhận được:", {
      txnRef: query.vnp_TxnRef,
      code: query.vnp_ResponseCode,
      verified: result.isVerified,
      success: result.isSuccess,
    });

    if (!result.isVerified) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    if (result.isSuccess && query.vnp_ResponseCode === "00") {
      // CẬP NHẬT ĐƠN HÀNG Ở ĐÂY
      console.log(`IPN: Đơn ${query.vnp_TxnRef} đã thanh toán thành công`);
      return res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      return res.json({
        RspCode: query.vnp_ResponseCode || "02",
        Message: "Failed",
      });
    }
  } catch (error) {
    console.error("LỖI /vnpay-ipn:", error);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;
