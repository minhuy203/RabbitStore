const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route GET /api/products
// @desc Lấy tất cả sản phẩm với bộ lọc
// @access Public
router.get("/", async (req, res) => {
  try {
    const {
      collection,
      size,
      color,
      gender,
      minPrice,
      maxPrice,
      sortBy,
      search,
      category,
      material,
      brand,
      limit,
    } = req.query;

    let query = {};

    if (collection && collection.toLowerCase() !== "all")
      query.collection = collection;
    if (category && category.toLowerCase() !== "all") query.category = category;
    if (material)
      query.material = { $in: material.split(",").map((m) => m.trim()) };
    if (brand) query.brand = { $in: brand.split(",").map((b) => b.trim()) };
    if (size) query.sizes = { $in: size.split(",").map((s) => s.trim()) };
    if (color) query.colors = { $in: color.split(",").map((c) => c.trim()) };
    if (gender) query.gender = gender;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "popularity":
          sort = { rating: -1 };
          break;
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit) || 0);
    res.json(products);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route GET /api/products/best-seller
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne().sort({ rating: -1 });
    if (bestSeller) res.json(bestSeller);
    else res.status(404).json({ message: "Không tìm thấy sản phẩm bán chạy" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route GET /api/products/new-arrivals
router.get("/new-arrivals", async (req, res) => {
  try {
    const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(8);
    res.json(newArrivals);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "ID không hợp lệ" });

    const product = await Product.findById(id);
    if (product) res.json(product);
    else res.status(404).json({ message: "Không tìm thấy sản phẩm" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// @route GET /api/products/similar/:id
router.get("/similar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "ID không hợp lệ" });

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    const similarProducts = await Product.find({
      _id: { $ne: id },
      gender: product.gender,
      category: product.category,
    }).limit(4);

    res.json(similarProducts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
