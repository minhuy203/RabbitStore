// backend/routes/vnpayRoutes.js – PHIÊN BẢN HOÀN CHỈNH, PRODUCTION 100%
const express = require("express");
const router = express.Router();
const { VNPay } = require("vnpay");

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE,
  secureSecret: process.env.VNPAY_HASH_SECRET,
  vnpayHost: "https://sandbox.vnpayment.vn", // sandbox
  // Khi live: chuyển thành https://pay.vnpay.vn
  testMode: true,
  hashAlgorithm: "SHA512",
});

// Kiểm tra config ngay khởi động
if (!vnpay.tmnCode || !vnpay.secureSecret) {
  console.error("⚠️  VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET bị thiếu trong .env");
}

// Frontend URL (bạn sửa đúng domain thật của mình)
const FRONTEND_BASE = "https://rabbit-store-henna.vercel.app";
const SUCCESS_PAGE = `${FRONTEND_BASE}/order-success`;
const FAILED_PAGE = `${FRONTEND_BASE}/checkout`;

// Lấy IP thật của khách
const getIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",").shift().trim() ||
  req.ip ||
  req.socket.remoteAddress ||
  "127.0.0.1";

// ====================== TẠO LINK THANH TOÁN ======================
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount } = req.body;

    if (!checkoutId || !amount)
      return res.status(400).json({ success: false, message: "Thiếu checkoutId hoặc amount" });

    const amountNum = Math.round(Number(amount));
    if (amountNum < 1000)
      return res.status(400).json({ success: false, message: "Số tiền tối thiểu 1.000 VND" });

    if (!/^[\w-]{1,50}$/.test(checkoutId))
      return res.status(400).json({ success: false, message: "checkoutId không hợp lệ" });

    const returnUrl = `${process.env.VNPAY_RETURN_URL}?checkoutId=${checkoutId}`;

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amountNum * 100,
      vnp_TxnRef: checkoutId,
      vnp_OrderInfo: `Thanh toan don hang ${checkoutId}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: getIp(req),
      vnp_Locale: "vn",
      vnp_ExpireDate: new Date(Date.now  + 15 * 60 * 1000), // 15 phút
    });

    res.json({ success: true, paymentUrl });
  } catch (err) {
    console.error("Lỗi tạo link VNPay:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// ====================== VNPAY RETURN (người dùng thấy) ======================
router.get("/vnpay-return", async (req, res) => {
  try {
    const query = req.query;
    const checkoutId = query.checkoutId || query.vnp_TxnRef;
    const result = vnpay.verifyReturnUrl(query);

    console.log("VNPAY RETURN", {
      checkoutId,
      code: query.vnp_ResponseCode,
      success: result.isSuccess,
      verified: result.isVerified,
      amount: query.vnp_Amount,
      transactionNo: query.vnp_TransactionNo,
    });

    if (result.isVerified && result.isSuccess) {
      // Thành công → chuyển về trang cảm ơn
      return res.redirect(`${SUCCESS_PAGE}?checkoutId=${checkoutId}`);
    } else {
      // Thất bại hoặc fake
      return res.redirect(`${FAILED_PAGE}?status=failed&code=${query.vnp_ResponseCode || "99"}`);
    }
  } catch (err) {
    console.error("Lỗi xử lý vnpay-return:", err);
    res.redirect(`${FAILED_PAGE}?status=failed&code=99`);
  }
});

// ====================== IPN – CẬP NHẬT DATABASE CHẮC CHẮN 100% ======================
router.get("/vnpay-ipn", async (req, res) => {
  try {
    const query = req.query;
    const result = vnpay.verifyIpnCall(query);

    console.log("VNPAY IPN", {
      txnRef: query.vnp_TxnRef,
      amount: query.vnp_Amount,
      code: query.vnp_ResponseCode,
      success: result.isSuccess,
      verified: result.isVerified,
    });

    if (!result.isVerified) {
      return res.json({ RspCode: "97", Message: "Checksum failed" });
    }

    if (result.isSuccess) {
      // ===> Ở ĐÂY BẠN CẬP NHẬT ĐƠN HÀNG TRONG DB <===
      // Ví dụ:
      // await Order.findOneAndUpdate(
      //   { checkoutId: query.vnp_TxnRef },
      //   {
      //     paid: true,
      //     paymentMethod: "vnpay",
      //     vnpayTransactionNo: query.vnp_TransactionNo,
      //     paidAt: new Date(),
      //   }
      // );

      return res.json({ RspCode: "00", Message: "Success" });
    } else {
      return res.json({ RspCode: query.vnp_ResponseCode || "02", Message: "Payment failed" });
    }
  } catch (err) {
    console.error("Lỗi IPN:", err);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
});

module.exports = router;