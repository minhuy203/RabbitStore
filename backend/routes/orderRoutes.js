const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/orders/my-orders?page=1&limit=10
// @desc    Lấy danh sách đơn hàng của người dùng (có phân trang)
// @access  Private
router.get("/my-orders", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Đếm tổng số đơn hàng của user
    const totalOrders = await Order.countDocuments({ user: req.user._id });

    // Lấy đơn hàng theo trang
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("orderItems.product", "name image price"); // Populate thông tin sản phẩm

    // Tính tổng số trang
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in GET /my-orders:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// @route   GET /api/orders/:id
// @desc    Lấy chi tiết đơn hàng theo ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product", "name image price");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra quyền: chỉ chủ đơn hàng hoặc admin mới được xem
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error in GET /:id:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;