// backend/routes/adminOrderRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Lấy tất cả đơn hàng
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Lỗi GET /api/admin/orders:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET: Lấy đơn hàng theo ID
router.get("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.json(order);
  } catch (error) {
    console.error("Lỗi GET /:id:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// PUT: Cập nhật trạng thái đơn hàng
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    order.status = status || order.status;

    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.paymentStatus = "paid";

      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { totalSold: item.quantity } },
          { new: true }
        );
      }
    }

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    console.error("Lỗi PUT /:id:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST: HỦY ĐƠN HÀNG BỞI ADMIN
router.post("/:id/cancel", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Vui lòng cung cấp lý do hủy" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    if (!["Processing", "Shipped"].includes(order.status)) {
      return res.status(400).json({ message: "Chỉ hủy được đơn đang xử lý hoặc đang giao" });
    }

    order.status = "Cancelled";
    order.cancelReason = reason.trim();
    order.cancelledAt = new Date();

    const cancelledOrder = await order.save();
    res.json({ message: "Hủy đơn thành công", order: cancelledOrder });
  } catch (error) {
    console.error("Lỗi POST /:id/cancel:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE: Xóa đơn hàng
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    await order.deleteOne();
    res.json({ message: "Xóa đơn hàng thành công" });
  } catch (error) {
    console.error("Lỗi DELETE /:id:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;