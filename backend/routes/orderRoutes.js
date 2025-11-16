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
    console.error("Lỗi ở /my-orders:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Lấy chi tiết đơn hàng
// @access  Private
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

// @route   POST /api/orders/:id/cancel
// @desc    Hủy đơn hàng (chỉ khi Processing)
// @access  Private
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp lý do hủy đơn" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền hủy đơn này" });
    }

    if (order.status !== "Processing") {
      return res
        .status(400)
        .json({ message: "Chỉ có thể hủy đơn hàng đang xử lý" });
    }

    order.status = "Cancelled";
    order.cancelReason = reason.trim();
    order.cancelledAt = new Date();

    await order.save();

    res.json({ message: "Hủy đơn hàng thành công", order });
  } catch (error) {
    console.error("Lỗi khi hủy đơn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
