import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";
import { toast } from "sonner";

const CartContents = ({ cart = { products: [] }, userId, guestId }) => {
  const dispatch = useDispatch();

  const handleQuantityChange = (productId, size, color, quantity, countInStock, action) => {
    if (action === "plus" && quantity < countInStock) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: quantity + 1,
          guestId,
          userId,
          size,
          color,
        })
      );
    } else if (action === "plus" && quantity >= countInStock) {
      toast.error("Số lượng vượt quá tồn kho!", { duration: 1000 });
    }
    if (action === "minus" && quantity > 1) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: quantity - 1,
          guestId,
          userId,
          size,
          color,
        })
      );
    }
  };

  const handleRemoveFromCart = (productId, size, color) => {
    dispatch(removeFromCart({ productId, guestId, userId, size, color }));
  };

  if (!cart || !cart.products || cart.products.length === 0) {
    return <div>Giỏ hàng của bạn đang trống.</div>;
  }

  return (
    <div>
      {cart.products.map((product, index) => (
        <div
          key={`${product.productId}-${product.size}-${product.color}-${index}`}
          className="flex items-start justify-between py-4 border-b"
        >
          <div className="flex items-start">
            <img
              src={product.image || "https://via.placeholder.com/80x96"}
              alt={product.name || "Sản phẩm"}
              className="w-20 h-24 object-cover mr-4 rounded"
            />
            <div>
              <h3>{product.name || "Sản phẩm không xác định"}</h3>
              <p className="text-sm text-gray-500">
                size: {product.size} | color: {product.color}
              </p>
              <div className="mb-6">
                <p className="text-gray-700">Số lượng:</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.productId,
                        product.size,
                        product.color,
                        product.quantity,
                        product.countInStock,
                        "minus"
                      )
                    }
                    disabled={product.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      product.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    -
                  </button>
                  <span className="text-lg">{product.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        product.productId,
                        product.size,
                        product.color,
                        product.quantity,
                        product.countInStock,
                        "plus"
                      )
                    }
                    disabled={product.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      product.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    +
                  </button>
                  <span className="text-gray-600 text-sm ml-4">
                    Còn {product.countInStock} sản phẩm trong kho
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p>
              {product.discountPrice
                ? `${product.discountPrice.toLocaleString("vi-VN")} VND`
                : `${product.price.toLocaleString("vi-VN")} VND`}
              {product.discountPrice && (
                <span className="text-sm text-gray-500 line-through ml-2">
                  {product.price.toLocaleString("vi-VN")} VND
                </span>
              )}
            </p>
            <button
              onClick={() =>
                handleRemoveFromCart(
                  product.productId,
                  product.size,
                  product.color
                )
              }
            >
              <RiDeleteBin3Line className="h-6 w-6 mt-2 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;