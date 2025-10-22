const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route GET /api/admin/products
router.get("/", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route POST /api/admin/products
router.post("/", protect, admin, async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log dữ liệu nhận được
    const { name, description, price, countInStock, sku } = req.body;
    if (!name || !description || !price || !countInStock || !sku) {
      return res.status(400).json({ message: "Thiếu các trường bắt buộc: name, description, price, countInStock, sku" });
    }
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: "Mã SKU đã tồn tại" });
    }
    const product = new Product({ ...req.body, user: req.user._id });
    const created = await product.save();
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Không thể tạo sản phẩm", error: error.message });
  }
});

// @route PUT /api/admin/products/:id
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    Object.assign(product, req.body);
    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Không thể cập nhật", error: error.message });
  }
});

// @route DELETE /api/admin/products/:id
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    await product.deleteOne();
    res.json({ message: "Đã xóa sản phẩm" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Không thể xóa", error: error.message });
  }
});

module.exports = router;