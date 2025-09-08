const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { findById } = require("../models/Cart");

const router = express.Router();

//@route get /api/orders/my-orders
//@ logged-in user order
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error" });
  }
});

//@route get /api/orders/:id
//get order details by id
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }

    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
