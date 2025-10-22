const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Route GET /api/admin/orders
// Get all orders
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Route GET /api/admin/orders/:id
// Get order by ID
router.get("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Route PUT /api/admin/orders/:id
// Update order status and update totalSold for products
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đơn hàng không hợp lệ" });
    }

    const order = await Order.findById(id).populate("user", "name");
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Cập nhật trạng thái
    order.status = status || order.status;

    // Nếu đánh dấu Delivered thì tự động thanh toán và cập nhật totalSold
    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isPaid = true;
      order.paidAt = order.paidAt || Date.now();
      order.paymentStatus = "paid";

      // Cập nhật totalSold cho từng sản phẩm
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { totalSold: item.quantity || 0 } },
          { new: true }
        );
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Route DELETE /api/admin/orders/:id
// Delete order
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "Đơn hàng đã được xóa" });
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;