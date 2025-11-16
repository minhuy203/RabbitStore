// server/routes/productRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeQuery = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/[<>"'%;()&+]/g, "");
};

// @route GET /api/products
// @desc Lấy sản phẩm + phân trang + bộ lọc
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
      limit = 12,
      page = 1,
    } = req.query;

    const limitNum = Math.max(1, parseInt(limit));
    const pageNum = Math.max(1, parseInt(page));
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (collection && collection.toLowerCase() !== "all") {
      query.collections = sanitizeQuery(collection);
    }
    if (category && category.toLowerCase() !== "all") {
      query.category = sanitizeQuery(category);
    }
    if (material) {
      const materials = sanitizeQuery(material).split(",").filter((m) => m);
      if (materials.length) query.material = { $in: materials };
    }
    if (brand) {
      const brands = sanitizeQuery(brand).split(",").filter((b) => b);
      if (brands.length) query.brand = { $in: brands };
    }
    if (size) {
      const sizes = sanitizeQuery(size).split(",").filter((s) => s);
      if (sizes.length) query.sizes = { $in: sizes };
    }
    if (color) {
      const colors = sanitizeQuery(color).split(",").filter((c) => c);
      if (colors.length) query.colors = { $in: colors };
    }
    if (gender) {
      query.gender = sanitizeQuery(gender);
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
    }
    if (search) {
      const sanitizedSearch = sanitizeQuery(search);
      if (sanitizedSearch) {
        query.$or = [
          { name: { $regex: sanitizedSearch, $options: "i" } },
          { description: { $regex: sanitizedSearch, $options: "i" } },
        ];
      }
    }

    let sort = {};
    if (sortBy) {
      switch (sanitizeQuery(sortBy)) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "popularity":
          sort = { rating: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    // Lấy sản phẩm + đếm tổng
    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
      products,
      totalProducts,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// ... các route khác giữ nguyên (top-sellers, new-arrivals, etc.) ...

module.exports = router;