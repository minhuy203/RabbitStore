import React from "react";
import { RiDeleteBin3Line } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemQuantitySync,
} from "../../redux/slices/cartSlice";
import { toast } from "sonner";

const CartContents = ({ cart = { products: [] }, userId, guestId }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.cart);

  const handleQuantityChange = (productId, size, color, quantity, countInStock, action) => {
    const newQuantity = action === "plus" ? quantity + 1 : quantity - 1;

    if (action === "plus" && quantity >= countInStock) {
      return;
    }
    if (action === "minus" && quantity <= 1) {
      return;
    }

    const originalQuantity = quantity;

    dispatch(
      updateCartItemQuantitySync({
        productId,
        size,
        color,
        quantity: newQuantity,
      })
    );

    dispatch(
      updateCartItemQuantity({
        productId,
        quantity: newQuantity,
        guestId,
        userId,
        size,
        color,
      })
    ).catch((error) => {
      dispatch(
        updateCartItemQuantitySync({
          productId,
          size,
          color,
          quantity: originalQuantity,
        })
      );
      toast.error("Lỗi khi cập nhật số lượng: " + error.message, { duration: 1000 });
    });
  };

  const handleRemoveFromCart = (productId, size, color) => {
    dispatch(removeFromCart({ productId, guestId, userId, size, color }))
      .then(() => {
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng!", { duration: 1000 });
      })
      .catch((error) => {
        toast.error("Lỗi khi xóa sản phẩm: " + error.message, { duration: 1000 });
      });
  };

  if (!cart || !cart.products || cart.products.length === 0) {
    return <div className="text-center text-gray-600">Giỏ hàng của bạn đang trống.</div>;
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
              <h3 className="text-lg font-semibold">{product.name || "Sản phẩm không xác định"}</h3>
              <p className="text-sm text-gray-500">
                Kích cỡ: {product.size} | Màu: {product.color}
              </p>
              <div className="mt-2">
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
                    disabled={loading || product.quantity <= 1 || product.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      loading || product.quantity <= 1 || product.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-300"
                    }`}
                  >
                    {loading ? "..." : "-"}
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
                    disabled={loading || product.quantity >= product.countInStock || product.countInStock === 0}
                    className={`px-2 py-1 bg-gray-200 rounded text-lg ${
                      loading || product.quantity >= product.countInStock || product.countInStock === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-gray-300"
                    }`}
                  >
                    {loading ? "..." : "+"}
                  </button>
                  <span className="text-gray-600 text-sm ml-4">
                    Còn {product.countInStock} sản phẩm trong kho
                  </span>
                </div>
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
              disabled={loading}
              className={`mt-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Xóa sản phẩm"
            >
              <RiDeleteBin3Line className="h-6 w-6 text-red-600 hover:text-red-800" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartContents;