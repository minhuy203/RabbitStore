// backend/routes/orderRoutes.js
const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/orders/my-orders?page=1&limit=10
// @desc    Lấy danh sách đơn hàng của user (có phân trang)
// @access  Private
router.get("/my-orders", protect, async (req, res) => {
  try {
    console.log("User ID:", req.user._id); // DEBUG: kiểm tra user có vào không

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ user: req.user._id });

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("Lỗi ở /my-orders:", error); // IN RA LỖI CHI TIẾT
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route   GET /api/orders/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    res.json(order);
  } catch (error) {
    console.error("Lỗi ở GET /:id:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;