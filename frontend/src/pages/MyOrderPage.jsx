import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";

const MyOrderPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    orders = [],
    loading,
    error,
  } = useSelector((state) => state.orders || {});

  useEffect(() => {
    console.log("Fetching user orders..."); // Debug
    dispatch(fetchUserOrders());
  }, [dispatch]);

  useEffect(() => {
    console.log("Orders in MyOrderPage:", orders); // Debug
  }, [orders]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  // Hàm xử lý hiển thị địa chỉ giao hàng
  const formatShippingAddress = (shippingAddress) => {
    if (!shippingAddress) return "N/A";
    const { address, city } = shippingAddress;
    const parts = [];
    if (address) parts.push(address);
    if (city) parts.push(city);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  if (loading) return <p>Đang tải trang...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Đơn của tôi</h2>
      <div className="relative shadow-md sm:rounded-lg overflow-hidden">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-sm uppercase text-gray-700">
            <tr>
              <th className="py-2 px-4 sm:py-3">Hình ảnh</th>
              <th className="py-2 px-4 sm:py-3">Mã đơn</th>
              <th className="py-2 px-4 sm:py-3">Ngày tạo</th>
              <th className="py-2 px-4 sm:py-3">Địa chỉ giao hàng</th>
              <th className="py-2 px-4 sm:py-3">Vật phẩm</th>
              <th className="py-2 px-4 sm:py-3">Giá</th>
              <th className="py-2 px-4 sm:py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => handleRowClick(order._id)}
                  className="border-b hover:border-gray-50 cursor-pointer"
                >
                  <td className="py-2 px-2 sm:py-4">
                    <img
                      src={order.orderItems[0]?.image}
                      alt={order.orderItems[0]?.name || "Không có tên"}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg"
                    />
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4 font-medium text-gray-900 whitespace-nowrap">
                    #{order._id}
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}{" "}
                    {new Date(order.createdAt).toLocaleTimeString("vi-VN")}
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4">
                    {formatShippingAddress(order.shippingAddress)}
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4">
                    {order.orderItems?.length || 0}
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4">
                    {order.totalPrice?.toLocaleString("vi-VN") || 0} VND
                  </td>
                  <td className="py-2 px-2 sm:py-4 sm:px-4">
                    {(() => {
                      let label = "Đang xử lí";
                      let bgClass = "bg-yellow-200 text-yellow-700";

                      switch (order.status) {
                        case "Processing":
                          label = "Đang xử lí";
                          bgClass = "bg-yellow-200 text-yellow-700";
                          break;
                        case "Shipped":
                          label = "Đang vận chuyển";
                          bgClass = "bg-blue-200 text-blue-700";
                          break;
                        case "Delivered":
                          label = "Đã giao hàng";
                          bgClass = "bg-green-200 text-green-700";
                          break;
                        case "Cancelled":
                          label = "Đã hủy";
                          bgClass = "bg-red-200 text-red-700";
                          break;
                        default:
                          label = "Đang xử lí";
                          bgClass = "bg-yellow-200 text-yellow-700";
                      }

                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${bgClass}`}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                  Bạn không có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrderPage;
