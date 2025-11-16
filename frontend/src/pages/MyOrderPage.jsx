import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import Pagination from "../components/Common/Pagination";

const MyOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const {
    orders = [],
    pagination = { currentPage: 1, totalPages: 1 },
    loading,
    error,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrders({ page: currentPage, limit }));
  }, [dispatch, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const formatShippingAddress = (shippingAddress) => {
    if (!shippingAddress) return "N/A";
    const { address, city } = shippingAddress;
    return [address, city].filter(Boolean).join(", ") || "N/A";
  };

  if (loading) {
    return <p className="text-center py-8 text-gray-600">Đang tải đơn hàng...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center py-8">Lỗi: {error}</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Đơn hàng của tôi</h2>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700">
              <tr>
                <th className="py-3 px-4">Hình ảnh</th>
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Ngày đặt</th>
                <th className="py-3 px-4">Địa chỉ</th>
                <th className="py-3 px-4 text-center">Sản phẩm</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => handleRowClick(order._id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <img
                        src={order.orderItems[0]?.image || "/placeholder.jpg"}
                        alt={order.orderItems[0]?.name || "Sản phẩm"}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      #{order._id.slice(-6)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatShippingAddress(order.shippingAddress)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {order.orderItems.length}
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {order.totalPrice.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const statusMap = {
                          Processing: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-800" },
                          Shipped: { label: "Đang giao", color: "bg-blue-100 text-blue-800" },
                          Delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
                          Cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
                        };
                        const s = statusMap[order.status] || statusMap.Processing;
                        return (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}
                          >
                            {s.label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Bạn chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phân trang */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default MyOrderPage;