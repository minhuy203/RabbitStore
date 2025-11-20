// routes/vnpayRoutes.js - PHIÊN BẢN ĐÃ SỬA HOÀN HẢO, KHÔNG CÒN LỖI 03
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const querystring = require("qs");
const Checkout = require("../models/Checkout");

// Cấu hình từ .env (bắt buộc có)
const VNPAY_TMN_CODE = (process.env.VNPAY_TMN_CODE || "").trim();
const VNPAY_HASH_SECRET = (process.env.VNPAY_HASH_SECRET || "").trim();
const VNPAY_RETURN_URL = (process.env.VNPAY_RETURN_URL || "").trim(); // ví dụ: https://yoursite.com/vnpay-return
const VNPAY_PAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
  console.error("Cảnh báo: Thiếu cấu hình VNPAY trong .env");
}

// Hàm sắp xếp object chính xác theo chuẩn VNPAY
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Tạo URL thanh toán
router.post("/create-payment", async (req, res) => {
  try {
    const { checkoutId, amount, orderInfo = "Thanh toan don hang Rabbit Store" } = req.body;

    if (!checkoutId || !amount || amount < 1000) {
      return res.status(400).json({ message: "Thiếu hoặc sai thông tin thanh toán" });
    }

    process.env.TZ = "Asia/Ho_Chi_Minh"; // Quan trọng: múi giờ GMT+7
    const date = new Date();

    const createDate = date.toISOString().replace(/[^0-9]/g, "").slice(0, 14); // YYYYMMDDHHmmss
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000);
    const vnp_ExpireDate = expireDate.toISOString().replace(/[^0-9]/g, "").slice(0, 14);

    const vnp_TxnRef = checkoutId; // Dùng checkoutId làm mã giao dịch (đảm bảo duy nhất mỗi ngày)

    const ipAddr =
      req.headers["x-forwarded-for"]?.split(",").shift() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Amount: String(amount * 100),           // Phải là chuỗi số
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: orderInfo + " - ID: " + checkoutId,
      vnp_OrderType: "250000",                     // Mã danh mục hàng hóa (bắt buộc)
      vnp_ReturnUrl: VNPAY_RETURN_URL + "?checkoutId=" + checkoutId, // Không encode ở đây
      vnp_TxnRef: vnp_TxnRef,
      vnp_ExpireDate: vnp_ExpireDate,              // Bắt buộc có
    };

    // Nếu muốn mặc định QR thì thêm (tùy chọn)
    // vnp_Params.vnp_BankCode = "VNPAYQR"; // hoặc bỏ trống để khách chọn

    // Sắp xếp và tạo chữ ký
    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    const paymentUrl =
      VNPAY_PAY_URL + "?" + querystring.stringify(vnp_Params, { encode: false });

    return res.json({
      success: true,
      paymentUrl,
      orderId: vnp_TxnRef,
      amount: amount,
    });
  } catch (error) {
    console.error("Lỗi tạo payment URL VNPAY:", error);
    return res.status(500).json({ message: "Lỗi hệ thống thanh toán" });
  }
});

// Xử lý return từ VNPAY
router.get("/vnpay-return", async (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const checkoutId = vnp_Params.checkoutId || req.query.checkoutId;

  // Kiểm tra checksum và mã phản hồi
  if (secureHash === signed) {
    if (vnp_Params.vnp_ResponseCode === "00") {
      // Thanh toán thành công
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
    } else {
      // Thanh toán thất bại
      return res.redirect(`http://localhost:5173/checkout?payment=failed&code=${vnp_Params.vnp_ResponseCode}`);
    }
  } else {
    // Chữ ký không hợp lệ
    return res.redirect(`http://localhost:5173/checkout?payment=failed&code=97`);
  }
});

module.exports = router;