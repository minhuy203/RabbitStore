const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

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
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    if (quantity > product.countInStock) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return res
        .status(400)
        .json({ message: "Kích cỡ hoặc màu sắc không hợp lệ" });
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
        if (
          cart.products[productIndex].quantity + quantity >
          product.countInStock
        ) {
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

router.put("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    if (quantity > product.countInStock) {
      return res.status(400).json({ message: "Số lượng vượt quá tồn kho" });
    }

    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return res
        .status(400)
        .json({ message: "Kích cỡ hoặc màu sắc không hợp lệ" });
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
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.delete("/", async (req, res) => {
  const { productId, size, color, guestId, userId } = req.body;
  try {
    let cart = await getCart(userId, guestId);
    if (!cart)
      return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });

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
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

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

router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;

  try {
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    if (guestCart) {
      if (guestCart.products.length === 0) {
        return res
          .status(200)
          .json(userCart || { products: [], totalPrice: 0 });
      }

      let mergedProducts = userCart ? [...userCart.products] : [];

      for (const guestItem of guestCart.products) {
        const product = await Product.findById(guestItem.productId);
        if (
          !product ||
          guestItem.quantity > product.countInStock ||
          !product.sizes.includes(guestItem.size) ||
          !product.colors.includes(guestItem.color)
        ) {
          continue; // Bỏ qua sản phẩm không hợp lệ
        }

        const productIndex = mergedProducts.findIndex(
          (item) =>
            item.productId.toString() === guestItem.productId.toString() &&
            item.size === guestItem.size &&
            item.color === guestItem.color
        );

        if (productIndex > -1) {
          if (
            mergedProducts[productIndex].quantity + guestItem.quantity >
            product.countInStock
          ) {
            continue;
          }
          mergedProducts[productIndex].quantity += guestItem.quantity;
          mergedProducts[productIndex].countInStock = product.countInStock;
        } else {
          mergedProducts.push({
            ...guestItem.toObject(),
            countInStock: product.countInStock,
          });
        }
      }

      let finalCart;
      if (userCart) {
        userCart.products = mergedProducts;
        userCart.totalPrice = userCart.products.reduce(
          (acc, item) =>
            acc + (item.discountPrice || item.price) * item.quantity,
          0
        );
        finalCart = await userCart.save();
      } else {
        const newCart = await Cart.create({
          user: req.user._id,
          products: mergedProducts,
          totalPrice: mergedProducts.reduce(
            (acc, item) =>
              acc + (item.discountPrice || item.price) * item.quantity,
            0
          ),
        });
        finalCart = newCart;
      }

      await Cart.findOneAndDelete({ guestId });
      return res.status(200).json(finalCart);
    } else {
      return res.status(200).json(userCart || { products: [], totalPrice: 0 });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/clean-guest-cart", async (req, res) => {
  const { guestId } = req.body;
  try {
    let cart = await Cart.findOne({ guestId });
    if (!cart) return res.status(200).json({ products: [], totalPrice: 0 });

    const validProducts = [];
    for (const item of cart.products) {
      const product = await Product.findById(item.productId);
      if (
        product &&
        product.sizes.includes(item.size) &&
        product.colors.includes(item.color) &&
        item.quantity <= product.countInStock
      ) {
        validProducts.push({
          ...item.toObject(),
          countInStock: product.countInStock,
        });
      }
    }

    cart.products = validProducts;
    cart.totalPrice = cart.products.reduce(
      (acc, item) => acc + (item.discountPrice || item.price) * item.quantity,
      0
    );
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
