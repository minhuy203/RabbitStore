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

// @route POST /api/cart
// @desc Add product to cart
// @access Public
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId, name, price, discountPrice, image } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra số lượng tồn kho
    if (quantity > product.countInStock) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    // Kiểm tra kích cỡ và màu sắc
    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return res.status(400).json({ message: "Kích cỡ hoặc màu sắc không hợp lệ" });
    }

    let cart = await getCart(userId, guestId);

    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.size === size &&
          p.color === color
      );

      if (productIndex > -1) {
        // Kiểm tra tổng số lượng sau khi cập nhật
        if (cart.products[productIndex].quantity + quantity > product.countInStock) {
          return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
        }
        cart.products[productIndex].quantity += quantity;
        cart.products[productIndex].countInStock = product.countInStock;
      } else {
        cart.products.push({
          productId,
          name: name || product.name,
          image: image || product.images[0].url,
          price: price || product.price,
          discountPrice: discountPrice || product.discountPrice || null,
          size,
          color,
          quantity,
          countInStock: product.countInStock,
        });
      }

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      const newCart = await Cart.create({
        user: userId ? userId : undefined,
        guestId: guestId ? guestId : "guest_" + new Date().getTime(),
        products: [
          {
            productId,
            name: name || product.name,
            image: image || product.images[0].url,
            price: price || product.price,
            discountPrice: discountPrice || product.discountPrice || null,
            size,
            color,
            quantity,
            countInStock: product.countInStock,
          },
        ],
        totalPrice: (discountPrice || product.price) * quantity,
      });
      return res.status(201).json(newCart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

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

// @route GET /api/cart
// @desc Get logged-in user's or guest user's cart
// @access Public
router.get("/", async (req, res) => {
  const { userId, guestId } = req.query;

  try {
    const cart = await getCart(userId, guestId);
    if (cart) {
      res.json(cart);
    } else {
      res.json({ products: [], totalPrice: 0 });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

// @route POST /api/cart/merge
// @desc Merge guest cart into user cart
// @access Private
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;

  try {
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    if (guestCart) {
      if (guestCart.products.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng khách trống" });
      }
      if (userCart) {
        for (const guestItem of guestCart.products) {
          const product = await Product.findById(guestItem.productId);
          if (!product) continue;
          if (guestItem.quantity > product.countInStock) {
            return res.status(400).json({ message: `Số lượng ${guestItem.name} vượt quá tồn kho` });
          }
          if (!product.sizes.includes(guestItem.size) || !product.colors.includes(guestItem.color)) {
            return res.status(400).json({ message: `Kích cỡ hoặc màu sắc của ${guestItem.name} không hợp lệ` });
          }
          const productIndex = userCart.products.findIndex(
            (item) =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          );
          if (productIndex > -1) {
            if (userCart.products[productIndex].quantity + guestItem.quantity > product.countInStock) {
              return res.status(400).json({ message: `Số lượng ${guestItem.name} vượt quá tồn kho` });
            }
            userCart.products[productIndex].quantity += guestItem.quantity;
            userCart.products[productIndex].countInStock = product.countInStock;
          } else {
            userCart.products.push({
              ...guestItem.toObject(),
              countInStock: product.countInStock,
            });
          }
        }

        userCart.totalPrice = userCart.products.reduce(
          (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
          0
        );
        await userCart.save();

        try {
          await Cart.findOneAndDelete({ guestId });
        } catch (error) {
          console.error("Lỗi khi xóa giỏ hàng khách:", error);
        }
        res.status(200).json(userCart);
      } else {
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        for (const item of guestCart.products) {
          const product = await Product.findById(item.productId);
          if (product) {
            if (!product.sizes.includes(item.size) || !product.colors.includes(item.color)) {
              return res.status(400).json({ message: `Kích cỡ hoặc màu sắc của ${item.name} không hợp lệ` });
            }
            item.countInStock = product.countInStock;
          }
        }
        await guestCart.save();
        res.status(200).json(guestCart);
      }
    } else {
      if (userCart) {
        return res.status(200).json(userCart);
      }
      res.status(404).json({ message: "Không tìm thấy giỏ hàng khách" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;