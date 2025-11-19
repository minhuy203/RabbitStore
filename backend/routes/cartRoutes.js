const express = require("express");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

// Helper function to get a cart by userId or guestId
const getCart = async (userId, guestId) => {
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
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
  const {
    productId,
    quantity,
    size,
    color,
    guestId,
    userId,
    name,
    price,
    discountPrice,
    image,
  } = req.body;

  try {
    // Kiểm tra dữ liệu đầu vào
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({
        message: "Thiếu các trường bắt buộc: productId, quantity, size, color",
      });
    }
    if (typeof quantity !== "number" || quantity <= 0) {
      return res.status(400).json({ message: "Số lượng phải là số dương" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId không hợp lệ" });
    }

    // Tìm sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra size và color
    if (!product.sizes.includes(size)) {
      return res.status(400).json({ message: "Kích thước không hợp lệ" });
    }
    if (!product.colors.includes(color)) {
      return res.status(400).json({ message: "Màu sắc không hợp lệ" });
    }

    // Kiểm tra số lượng tồn kho
    if (quantity > product.countInStock) {
      return res
        .status(400)
        .json({ message: "Số lượng yêu cầu vượt quá tồn kho" });
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
        // Cập nhật số lượng
        cart.products[productIndex].quantity += quantity;
      } else {
        // Thêm sản phẩm mới
        cart.products.push({
          productId,
          name: name || product.name,
          image: image || (product.images && product.images[0]?.url) || "",
          price: price || product.price,
          discountPrice: discountPrice || product.discountPrice || null,
          size,
          color,
          quantity,
          countInStock: product.countInStock,
        });
      }

      // Tính lại tổng giá
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      // Tạo giỏ hàng mới
      const newCart = await Cart.create({
        user: userId ? userId : undefined,
        guestId: guestId ? guestId : "guest_" + new Date().getTime(),
        products: [
          {
            productId,
            name: name || product.name,
            image: image || (product.images && product.images[0]?.url) || "",
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
    console.error("Lỗi trong POST /api/cart:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
});

// @route PUT /api/cart
// @desc Update product quantity
// @access Public
router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;

  try {
    // Kiểm tra dữ liệu đầu vào
    if (!productId || !quantity || !size || !color) {
      return res.status(400).json({
        message: "Thiếu các trường bắt buộc: productId, quantity, size, color",
      });
    }
    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ message: "Số lượng phải là số không âm" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId không hợp lệ" });
    }

    // Tìm sản phẩm
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    // Kiểm tra size và color
    if (!product.sizes.includes(size)) {
      return res.status(400).json({ message: "Kích thước không hợp lệ" });
    }
    if (!product.colors.includes(color)) {
      return res.status(400).json({ message: "Màu sắc không hợp lệ" });
    }

    // Kiểm tra số lượng tồn kho
    if (quantity > product.countInStock) {
      return res
        .status(400)
        .json({ message: "Số lượng yêu cầu vượt quá tồn kho" });
    }

    let cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
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

      // Tính lại tổng giá
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }
  } catch (error) {
    console.error("Lỗi trong PUT /api/cart:", error.message, error.stack);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
});

// @route DELETE /api/cart
// @desc Remove product from cart
// @access Public
router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;

  try {
    // Kiểm tra dữ liệu đầu vào
    if (!productId || !size || !color) {
      return res
        .status(400)
        .json({ message: "Thiếu các trường bắt buộc: productId, size, color" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "productId không hợp lệ" });
    }

    let cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }

    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.size === size &&
        p.color === color
    );

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1);

      // Tính lại tổng giá
      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
        0
      );
      await cart.save();
      return res.status(200).json(cart);
    } else {
      return res
        .status(404)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });
    }
  } catch (error) {
    console.error("Lỗi trong DELETE /api/cart:", error.message, error.stack);
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
});

// @route GET /api/cart
// @desc Get cart + TỰ ĐỘNG ĐIỀU CHỈNH số lượng nếu vượt tồn kho
router.get("/", async (req, res) => {
  const { userId, guestId } = req.query;

  try {
    if (!userId && !guestId) {
      return res.status(400).json({ message: "Cần cung cấp userId hoặc guestId" });
    }
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    let cart = await getCart(userId, guestId);
    if (!cart) {
      return res.status(200).json({ products: [], totalPrice: 0 });
    }

    let hasChanges = false;
    const removedItems = [];
    const adjustedItems = [];

    // Duyệt ngược để có thể xóa an toàn
    for (let i = cart.products.length - 1; i >= 0; i--) {
      const item = cart.products[i];
      const product = await Product.findById(item.productId).select('countInStock name');

      // Nếu sản phẩm không tồn tại → xóa
      if (!product) {
        removedItems.push(item.name || item.productId);
        cart.products.splice(i, 1);
        hasChanges = true;
        continue;
      }

      // Cập nhật tồn kho mới nhất
      const currentStock = product.countInStock;

      if (currentStock === 0) {
        // Hết hàng → xóa khỏi giỏ
        removedItems.push(item.name || "Sản phẩm");
        cart.products.splice(i, 1);
        hasChanges = true;
      } 
      else if (item.quantity > currentStock) {
        // Vượt tồn kho → điều chỉnh về tối đa còn lại
        adjustedItems.push({
          name: item.name || "Sản phẩm",
          oldQty: item.quantity,
          newQty: currentStock
        });
        item.quantity = currentStock;
        item.countInStock = currentStock;
        hasChanges = true;
      } 
      else {
        // Còn hàng và số lượng hợp lệ → chỉ cập nhật tồn kho mới
        item.countInStock = currentStock;
      }
    }

    // Tính lại tổng giá
    cart.totalPrice = cart.products.reduce(
      (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
      0
    );

    await cart.save();

    // Trả về giỏ hàng + thông tin điều chỉnh (nếu có)
    res.status(200).json({
      ...cart.toObject(),
      adjusted: hasChanges,
      notifications: {
        removed: removedItems.length > 0 ? removedItems : null,
        adjusted: adjustedItems.length > 0 ? adjustedItems : null,
      }
    });

  } catch (error) {
    console.error("Lỗi trong GET /api/cart:", error.message, error.stack);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// @route POST /api/cart/merge
// @desc Merge guest cart into user cart
// @access Private
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;

  try {
    // Kiểm tra guestId
    if (!guestId) {
      return res.status(400).json({ message: "Thiếu guestId" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(400).json({ message: "userId không hợp lệ" });
    }

    const guestCart = await Cart.findOne({ guestId });
    let userCart = await Cart.findOne({ user: req.user._id });

    // Nếu cả guestCart và userCart không tồn tại, tạo giỏ hàng mới cho người dùng
    if (!guestCart && !userCart) {
      userCart = await Cart.create({
        user: req.user._id,
        products: [],
        totalPrice: 0,
      });
      return res.status(200).json(userCart);
    }

    // Nếu chỉ có userCart, trả về userCart
    if (!guestCart && userCart) {
      // Cập nhật countInStock cho tất cả sản phẩm
      for (const item of userCart.products) {
        const product = await Product.findById(item.productId);
        if (product) {
          item.countInStock = product.countInStock;
        } else {
          item.countInStock = 0;
        }
      }
      await userCart.save();
      return res.status(200).json(userCart);
    }

    // Nếu có guestCart
    if (guestCart) {
      if (!userCart) {
        // Chuyển guestCart thành userCart
        guestCart.user = req.user._id;
        guestCart.guestId = undefined;
        // Cập nhật countInStock
        for (const item of guestCart.products) {
          const product = await Product.findById(item.productId);
          if (!product) {
            return res.status(400).json({
              message: `Sản phẩm ${item.name} không tồn tại`,
            });
          }
          if (item.quantity > product.countInStock) {
            return res.status(400).json({
              message: `Số lượng sản phẩm ${item.name} vượt quá tồn kho`,
            });
          }
          item.countInStock = product.countInStock;
        }
        await guestCart.save();
        return res.status(200).json(guestCart);
      } else {
        // Hợp nhất guestCart vào userCart
        for (const guestItem of guestCart.products) {
          const product = await Product.findById(guestItem.productId);
          if (!product) {
            console.warn(`Sản phẩm ${guestItem.name} không tồn tại, bỏ qua`);
            continue;
          }
          if (guestItem.quantity > product.countInStock) {
            return res.status(400).json({
              message: `Số lượng sản phẩm ${guestItem.name} vượt quá tồn kho`,
            });
          }
          const productIndex = userCart.products.findIndex(
            (item) =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.size === guestItem.size &&
              item.color === guestItem.color
          );
          if (productIndex > -1) {
            userCart.products[productIndex].quantity += guestItem.quantity;
            userCart.products[productIndex].countInStock = product.countInStock;
          } else {
            userCart.products.push({
              ...guestItem.toObject(),
              countInStock: product.countInStock,
            });
          }
        }
        // Cập nhật tổng giá
        userCart.totalPrice = userCart.products.reduce(
          (acc, item) =>
            acc + (item.discountPrice || item.price) * item.quantity,
          0
        );
        await userCart.save();
        // Xóa guestCart
        try {
          await Cart.findOneAndDelete({ guestId });
        } catch (error) {
          console.error(
            "Lỗi khi xóa giỏ hàng khách:",
            error.message,
            error.stack
          );
        }
        return res.status(200).json(userCart);
      }
    }
  } catch (error) {
    console.error(
      "Lỗi trong POST /api/cart/merge:",
      error.message,
      error.stack
    );
    return res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message });
  }
});

module.exports = router;
