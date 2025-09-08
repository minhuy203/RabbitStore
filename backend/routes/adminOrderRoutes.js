const express = require("express");
const Order = require("../models/Order");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//route get /api/admin/order
//get all order
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "lỗi server" });
  }
});

//route put /api/admin/order/:id
//update order status
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name");
    if (order) {
      order.status = req.body.status || order.status;

      // Nếu đánh dấu Delivered thì tự động thanh toán
      if (req.body.status === "Delivered") {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        order.isPaid = true; // tự động cập nhật thanh toán
        order.paidAt = order.paidAt || Date.now();
        order.paymentStatus = "paid";
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

//route delete /api/admin/orders/:id
//delete order
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "Đơn hàng đã được xóa" });
    } else {
      res.status(404).json({ message: "không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "lỗi server" });
  }
});
module.exports = router;
