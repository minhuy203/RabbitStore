const express = require("express");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

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
  if (!["paid", "unpaid", "pending"].includes(paymentStatus)) {
    console.log("Validation failed: Invalid paymentStatus", { paymentStatus });
    return res.status(400).json({
      message: "Invalid paymentStatus. Must be 'paid', 'unpaid' or 'pending'",
    });
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
      checkout.paymentStatus === "unpaid" ||
      checkout.paymentStatus === "pending" // Cho VNPay
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

module.exports = router;
