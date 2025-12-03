const express = require("express");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const CryptoJS = require("crypto-js");

const router = express.Router();

//@route POST /api/checkout
//@desc Create new checkout session
//@access Private
router.post("/", protect, async (req, res) => {
  const {
    checkoutItems,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    totalPrice,
  } = req.body;

  // Validate required fields
  if (
    !checkoutItems ||
    !Array.isArray(checkoutItems) ||
    checkoutItems.length === 0
  ) {
    console.log("Validation failed: No items in checkout", { checkoutItems });
    return res.status(400).json({ message: "No items in checkout" });
  }
  if (!shippingAddress || !paymentMethod || !totalPrice) {
    console.log("Validation failed: Missing required fields", {
      shippingAddress,
      paymentMethod,
      totalPrice,
    });
    return res.status(400).json({
      message:
        "Missing required fields: shippingAddress, paymentMethod, or totalPrice",
    });
  }
  if (!["paid", "unpaid"].includes(paymentStatus)) {
    console.log("Validation failed: Invalid paymentStatus", { paymentStatus });
    return res
      .status(400)
      .json({ message: "Invalid paymentStatus. Must be 'paid' or 'unpaid'" });
  }
  if (!req.user || !req.user._id) {
    console.log("Validation failed: User not authenticated", {
      user: req.user,
    });
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    console.log("Creating checkout with payload:", req.body);
    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      totalPrice,
      isPaid: paymentStatus === "paid",
      paidAt: paymentStatus === "paid" ? Date.now() : null,
    });
    console.log(
      `Checkout created successfully for user: ${req.user._id}, checkoutId: ${newCheckout._id}`
    );
    res.status(201).json(newCheckout);
  } catch (error) {
    console.error("Error creating checkout:", error.message, error.stack);
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

//@route PUT /api/checkout/:id/pay
//@desc Update checkout payment status
//@access Private
router.put("/:id/pay", protect, async (req, res) => {
  const { paymentStatus, paymentDetails, checkoutId } = req.body;

  if (!["paid"].includes(paymentStatus)) {
    console.log("Validation failed: Invalid payment status", { paymentStatus });
    return res
      .status(400)
      .json({ message: "Invalid payment status. Must be 'paid'" });
  }

  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      console.log("Checkout not found:", { id: req.params.id });
      return res.status(404).json({ message: "Checkout not found" });
    }

    checkout.isPaid = true;
    checkout.paymentStatus = paymentStatus;
    checkout.paymentDetails = paymentDetails;
    checkout.paidAt = Date.now();

    await checkout.save();
    console.log(`Checkout updated successfully: ${req.params.id}`);
    res.status(200).json(checkout);
  } catch (error) {
    console.error(
      "Error updating checkout payment:",
      error.message,
      error.stack
    );
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

//@route POST /api/checkout/:id/finalize
//@desc Finalize checkout and create order
//@access Private
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.isFinalized) {
      return res.status(400).json({ message: "Checkout already finalized" });
    }

    if (
      checkout.paymentStatus === "paid" ||
      checkout.paymentStatus === "unpaid"
    ) {
      // 🔥 Trừ tồn kho cho từng sản phẩm
      for (const item of checkout.checkoutItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product not found: ${item.productId}` });
        }
        if (product.countInStock < item.quantity) {
          return res
            .status(400)
            .json({ message: `Not enough stock for product: ${product.name}` });
        }
        product.countInStock -= item.quantity;
        await product.save();
      }

      const orderItemsWithDiscount = await Promise.all(
        checkout.checkoutItems.map(async (item) => {
          const product = await Product.findById(item.productId);

          return {
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            discountPrice: item.discountPrice || product.discountPrice || 0,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          };
        })
      );

      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: orderItemsWithDiscount,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        isPaid: checkout.isPaid,
        paidAt: checkout.paidAt,
        isDelivered: false,
        paymentStatus: checkout.paymentStatus,
        paymentDetails: checkout.paymentDetails || null,
      });

      checkout.isFinalized = true;
      checkout.finalizedAt = Date.now();
      await checkout.save();

      await Cart.findOneAndDelete({ user: checkout.user });

      res.status(201).json(finalOrder);
    } else {
      return res
        .status(400)
        .json({ message: "Invalid checkout payment status" });
    }
  } catch (error) {
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

const ZALOPAY_CONFIG = {
  app_id: "554",
  key1: "8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn",
  key2: "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

// 1. Tạo link thanh toán ZaloPay (giữ nguyên)
router.post("/zalopay/create", protect, async (req, res) => {
  try {
    const { checkoutId } = req.body;
    if (!checkoutId)
      return res.status(400).json({ message: "Thiếu checkoutId" });

    const checkout = await Checkout.findById(checkoutId);
    if (!checkout || checkout.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Checkout không tồn tại" });
    }

    const items = checkout.checkoutItems.map((item) => ({
      itemid: item.productId.toString(),
      itemname: item.name,
      itemprice: item.discountPrice || item.price,
      itemquantity: item.quantity,
    }));

    const order = {
      app_id: ZALOPAY_CONFIG.app_id,
      app_trans_id: `${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "")}_${Date.now()}`,
      app_user: "rabbitstore",
      app_time: Date.now(),
      amount: Math.round(checkout.totalPrice),
      description: `Thanh toán đơn #${checkoutId}`,
      title: "Rabbit Store",
      item: JSON.stringify(items),
      embed_data: JSON.stringify({
        redirecturl: `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/order-confirmation`,
        checkoutId: checkoutId.toString(),
      }),
      bank_code: "",
      callback_url: `${
        process.env.BACKEND_URL || "http://localhost:9000"
      }/api/checkout/zalopay/callback`,
    };

    const dataString = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
    order.mac = CryptoJS.HmacSHA256(dataString, ZALOPAY_CONFIG.key1).toString();

    const response = await fetch(ZALOPAY_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(order),
    });

    const result = await response.json();

    if (result.return_code === 1) {
      res.json({ success: true, order_url: result.order_url });
    } else {
      res.status(400).json({ message: result.return_message || "Lỗi ZaloPay" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Callback từ ZaloPay → TỰ ĐỘNG tạo Order (không cần frontend gọi finalize nữa)
router.post("/zalopay/callback", async (req, res) => {
  try {
    const { data, mac } = req.body;
    const calculatedMac = CryptoJS.HmacSHA256(
      data,
      ZALOPAY_CONFIG.key2
    ).toString();

    if (calculatedMac !== mac) {
      return res.json({ return_code: -1, return_message: "mac not equal" });
    }

    const result = JSON.parse(data);
    const embedData = JSON.parse(result.embed_data || "{}");
    const checkoutId = embedData.checkoutId;

    let createdOrderId = null;

    if (checkoutId) {
      const checkout = await Checkout.findById(checkoutId).populate("user");

      if (checkout && !checkout.isFinalized) {
        // 1. Cập nhật trạng thái paid
        checkout.paymentStatus = "paid";
        checkout.isPaid = true;
        checkout.paidAt = Date.now();
        await checkout.save();

        // 2. Trừ tồn kho
        for (const item of checkout.checkoutItems) {
          const product = await Product.findById(item.productId);
          if (!product) {
            console.error(`Product not found: ${item.productId}`);
            continue;
          }
          if (product.countInStock < item.quantity) {
            console.error(`Not enough stock for ${product.name}`);
            // Vẫn tiếp tục tạo đơn (đã thanh toán) nhưng ghi log để xử lý sau
            continue;
          }
          product.countInStock -= item.quantity;
          await product.save();
        }

        // 3. Chuẩn bị orderItems (lấy discountPrice mới nhất nếu có)
        const orderItems = await Promise.all(
          checkout.checkoutItems.map(async (item) => {
            const product = await Product.findById(item.productId);
            return {
              productId: item.productId,
              name: item.name,
              image: item.image,
              price: item.price,
              discountPrice: item.discountPrice || product?.discountPrice || 0,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
            };
          })
        );

        // 4. Tạo Order thật sự
        const newOrder = await Order.create({
          user: checkout.user,
          orderItems,
          shippingAddress: checkout.shippingAddress,
          paymentMethod: checkout.paymentMethod,
          totalPrice: checkout.totalPrice,
          isPaid: true,
          paidAt: checkout.paidAt,
          paymentStatus: "paid",
          paymentDetails: {
            gateway: "ZaloPay",
            apptransid: result.app_trans_id,
          },
        });

        createdOrderId = newOrder._id;

        // 5. Đánh dấu checkout đã hoàn tất
        checkout.isFinalized = true;
        checkout.finalizedAt = Date.now();
        await checkout.save();

        // 6. Xóa giỏ hàng của user
        await Cart.findOneAndDelete({ user: checkout.user });
      }
    }

    // Trả về redirecturl kèm orderId để frontend hiển thị ngay
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.json({
      return_code: 1,
      return_message: "success",
      redirecturl: `${frontendUrl}/order-confirmation?orderId=${createdOrderId}&method=ZaloPay`,
    });
  } catch (err) {
    console.error("ZaloPay callback error:", err);
    return res.json({ return_code: 0, return_message: "error" });
  }
});

module.exports = router;
