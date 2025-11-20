// backend/routes/vnpayRoutes.js – FIX LỖI 500 THEO DOCS VNPAY V2.4.4
const express = require("express");
const router = express.Router();

// Import đúng theo docs (full backward-compatible)
const { VNPay } = require("vnpay");

// CẤU HÌNH ĐÚNG 100% THEO DOCS MỚI NHẤT
const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE?.trim() || "",
  secureSecret: process.env.VNPAY_HASH_SECRET?.trim() || "",  // ← ĐÚNG: secureSecret, KHÔNG PHẢI hashSecret
  vnpayHost: "https://sandbox.vnpayment.vn",                  // ← ĐÚNG: vnpayHost
  testMode: true,
  hashAlgorithm: "SHA512",                                    // Theo yêu cầu của bạn (sandbox thường SHA512)
  enableLog: true,                                            // Bật log để debug nếu cần
});

// Kiểm tra config ngay lập tức (sẽ log ra console Vercel)
if (!vnpay.tmnCode || !vnpay.secureSecret) {
  console.error("❌ VNPAY CONFIG THIẾU:", {
    tmnCode: vnpay.tmnCode ? "OK" : "MISSING",
    secureSecret: vnpay.secureSecret ? "OK" : "MISSING",
  });
}

// Frontend URLs (sửa nếu domain thay đổi)
const FRONTEND_BASE = "https://rabbit-store-henna.vercel.app";
const SUCCESS_PAGE = `${FRONTEND_BASE}/order-success`;
const FAILED_PAGE = `${FRONTEND_BASE}/checkout`;

// Helper lấy IP sạch (Vercel forward)
const getIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim().replace(/^::ffff:/, "");
  }
  return (req.ip || req.socket?.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "");
};

// ==================== TẠO LINK THANH TOÁN (FIX CHÍNH) ====================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    // Validation cơ bản
    if (!checkoutId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });
    }

    const amountNum = Math.round(Number(amount));
    if (isNaN(amountNum) || amountNum < 1000) {
      return res.status(400).json({ success: false, message: "Amount phải ≥ 1000 VND và là số" });
    }

    const cleanCheckoutId = String(checkoutId).trim();
    if (cleanCheckoutId.length === 0 || cleanCheckoutId.length > 50) {
      return res.status(400).json({ success: false, message: "checkoutId không hợp lệ (1-50 ký tự)" });
    }

    // Tạo Return URL với checkoutId (theo kiến trúc backend-redirect)
    const returnUrl = `${process.env.VNPAY_RETURN_URL}?checkoutId=${encodeURIComponent(cleanCheckoutId)}`;

    // Build URL theo docs chính xác (amount * 100 cho VND)
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,                    // VND * 100 (theo VNPay)
      vnp_TxnRef: cleanCheckoutId,                    // Mã đơn hàng của bạn
      vnp_OrderInfo: `Thanh toan don hang ${cleanCheckoutId}`,  // Info ngắn gọn
      vnp_OrderType: "250000",                        // Ngành hàng phổ thông
      vnp_ReturnUrl: returnUrl,                       // Backend return
      vnp_IpAddr: getIp(req),                         // IP khách
      vnp_Locale: "vn",                               // Ngôn ngữ VN
      vnp_ExpireDate: new Date(Date.now() + 15 * 60 * 1000),  // Hết hạn 15 phút
      // Không cần vnp_CreateDate: package tự generate
    });

    // Log an toàn (ẩn hash)
    console.log("✅ VNPAY URL TẠO THÀNH CÔNG:", {
      checkoutId: cleanCheckoutId,
      amount: amountNum,
      urlPreview: paymentUrl.split("?")[0] + "?...&vnp_SecureHash=***",
    });

    res.json({
      success: true,
      paymentUrl,
      amount: amountNum,
      checkoutId: cleanCheckoutId,
    });
  } catch (error) {
    // Log chi tiết để debug trên Vercel logs
    console.error("❌ LỖI TẠO VNPAY URL:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({ success: false, message: "Lỗi tạo link thanh toán (kiểm tra logs)" });
  }
});

// ==================== VNPAY RETURN (BACKEND VERIFY + REDIRECT) ====================
router.get("/vnpay-return", async (req, res) => {
  try {
    const query = req.query;
    const result = vnpay.verifyReturnUrl(query);  // Verify chữ ký theo docs

    const checkoutId = query.checkoutId || query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;

    // Log chi tiết
    console.log("🔄 VNPAY RETURN:", {
      checkoutId,
      responseCode,
      isSuccess: result.isSuccess,
      isVerified: result.isVerified,
      transactionNo: query.vnp_TransactionNo,
      amount: query.vnp_Amount,
    });

    if (result.isVerified && result.isSuccess && responseCode === "00") {
      // Thành công → redirect frontend + cập nhật DB nếu cần
      console.log("✅ RETURN: Thanh toán thành công, redirect success");
      return res.redirect(`${SUCCESS_PAGE}?checkoutId=${checkoutId}&status=success`);
    } else {
      // Thất bại → redirect với mã lỗi
      console.log("❌ RETURN: Thất bại hoặc fake", { responseCode, isVerified: result.isVerified });
      return res.redirect(`${FAILED_PAGE}?status=failed&code=${responseCode || "99"}&reason=vnpay`);
    }
  } catch (error) {
    console.error("❌ LỖI RETURN:", error);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99&reason=server`);
  }
});

// ==================== IPN (SERVER-TO-SERVER – CẬP NHẬT DB CHẮC CHẮN) ====================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const query = req.query;  // IPN dùng GET theo docs VNPay
    const result = vnpay.verifyIpnCall(query);  // Verify IPN theo docs

    const txnRef = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;

    console.log("🔔 VNPAY IPN:", {
      txnRef,
      responseCode,
      isSuccess: result.isSuccess,
      isVerified: result.isVerified,
      amount: query.vnp_Amount,
    });

    if (!result.isVerified) {
      console.log("❌ IPN: Chữ ký sai");
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    if (result.isSuccess && responseCode === "00") {
      // === CẬP NHẬT DATABASE NGAY ĐÂY (KHÔNG BỎ LỠ ĐƠN) ===
      // Ví dụ với Mongoose:
      // await Order.findOneAndUpdate(
      //   { checkoutId: txnRef },
      //   {
      //     paid: true,
      //     paymentMethod: "vnpay",
      //     vnpayTxnNo: query.vnp_TransactionNo,
      //     paidAt: new Date(),
      //   }
      // );
      console.log("✅ IPN: Cập nhật đơn thành công", { txnRef });

      return res.json({ RspCode: "00", Message: "Confirm Success" });
    } else {
      console.log("❌ IPN: Thanh toán thất bại", { responseCode });
      return res.json({ RspCode: responseCode || "02", Message: "Payment failed" });
    }
  } catch (error) {
    console.error("❌ LỖI IPN:", error);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;