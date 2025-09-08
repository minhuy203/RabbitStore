import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { fetchUserOrders } from "../redux/slices/orderSlice";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { paymentMethod } = location.state || {};
  const { checkout } = useSelector((state) => state.checkout);

  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
      dispatch(fetchUserOrders()); // Cập nhật danh sách đơn hàng
    } else {
      navigate("/my-orders");
    }
  }, [checkout, dispatch, navigate]);

  const calculatedEstimatedDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 3);
    return orderDate.toLocaleDateString("vi-VN");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Cảm ơn vì đã đặt hàng!
      </h1>

      {checkout && (
        <div className="p-6 rounded-lg border">
          {/* Thông tin đơn hàng */}
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold">
                ID Đơn hàng: {checkout._id}
              </h2>
              <p className="text-gray-500">
                Ngày đặt:{" "}
                {new Date(checkout.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="text-emerald-700 text-sm">
                Dự tính giao hàng:{" "}
                {calculatedEstimatedDelivery(checkout.createdAt)}
              </p>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="mb-8">
            {checkout.checkoutItems.map((item) => {
              // Luôn dùng giá discount nếu có
              const price =
                typeof item.discountPrice === "number" && item.discountPrice > 0
                  ? item.discountPrice
                  : item.price || 0;
              const total = price * item.quantity;
              return (
                <div key={item.productId} className="flex items-center mb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md mr-4"
                  />
                  <div>
                    <h4 className="text-md font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.color} | {item.size}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-md">
                      Đơn giá: {price.toLocaleString("vi-VN")} VND
                    </p>
                    <p className="text-sm text-gray-500">
                      Số lượng: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Tổng: {total.toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thông tin thanh toán và giao hàng */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Phương thức thanh toán
              </h4>
              <p className="text-gray-600">
                {paymentMethod || checkout.paymentMethod || "Không xác định"}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Thông tin giao hàng
              </h4>
              <p className="text-gray-600">
                {checkout.shippingAddress.address}
              </p>
              <p className="text-gray-600">{checkout.shippingAddress.city}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationPage;
