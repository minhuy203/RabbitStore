import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";

const CartContents = ({ cart = { products: [] }, userId, guestId }) => {
  const dispatch = useDispatch();

  const handleAddToCart = (productId, delta, quantity, size, color, countInStock) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= countInStock) {
      dispatch(
        updateCartItemQuantity({
          productId,
          quantity: newQuantity,
          guestId,
          userId,
          size,
          color,
        })
      );
    } else if (newQuantity > countInStock) {
      alert(`Số lượng tối đa cho sản phẩm này là ${countInStock}`);
    }
  };

  const handleRemoveFromCart = (productId, size, color) => {
    dispatch(removeFromCart({ productId, guestId, userId, size, color }));
  };

  if (!cart || !cart.products || cart.products.length === 0) {
    return <div className="text-center py-4">Giỏ hàng của bạn đang trống.</div>;
  }

  return (
    <div className="space-y-4">
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
              <h3 className="text-lg font-medium">{product.name || "Sản phẩm không xác định"}</h3>
              <p className="text-sm text-gray-500">
                Kích thước: {product.size} | Màu sắc: {product.color}
              </p>
              <p className="text-sm text-gray-500">
                Tồn kho: {product.countInStock || "Không xác định"}
              </p>
              <div className="flex items-center mt-2">
                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      -1,
                      product.quantity,
                      product.size,
                      product.color,
                      product.countInStock
                    )
                  }
                  className="border rounded px-2 py-1 text-xl font-medium disabled:opacity-50"
                  disabled={product.quantity <= 1}
                >
                  -
                </button>
                <span className="mx-4">{product.quantity}</span>
                <button
                  onClick={() =>
                    handleAddToCart(
                      product.productId,
                      1,
                      product.quantity,
                      product.size,
                      product.color,
                      product.countInStock
                    )
                  }
                  className="border rounded px-2 py-1 text-xl font-medium disabled:opacity-50"
                  disabled={product.quantity >= product.countInStock}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">
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
              className="mt-2"
            >
              <RiDeleteBin3Line className="h-6 w-6 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;