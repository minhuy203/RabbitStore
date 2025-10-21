const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Helper function to get a cart by userId or guestId
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

// @route PUT /api/cart
// @desc Update product quantity
// @access Public
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    if (quantity > product.countInStock) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return res.status(400).json({ message: "Kích cỡ hoặc màu sắc không hợp lệ" });
    }

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    );

    if (productIndex > -1) {
      if (quantity > 0) {
        cart.products[productIndex].quantity = quantity;
        cart.products[productIndex].countInStock = product.countInStock;
      } else {
        cart.products.splice(productIndex, 1);
      }

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// @route DELETE /api/cart
// @desc Remove product from cart
// @access Public
router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    );

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1);

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// Các endpoint khác (POST, GET, POST /merge) giữ nguyên như đã cung cấp trước đó
module.exports = router;