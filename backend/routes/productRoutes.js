const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to sanitize query parameters
const sanitizeQuery = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/[<>"'%;()&+]/g, "");
};

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

    if (collection && collection.toLowerCase() !== "all") {
      query.collection = sanitizeQuery(collection);
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
          sort = { createdAt: -1 }; // Default sort
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit) > 0 ? Number(limit) : 0);
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