// src/pages/OrderDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchOrderDetails, cancelOrder } from "../redux/slices/orderSlice";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const reasons = [
    "Tôi muốn thay đổi sản phẩm",
    "Tôi muốn thay đổi địa chỉ giao hàng",
    "Tôi đặt nhầm đơn hàng",
    "Giá sản phẩm thay đổi",
    "Không còn nhu cầu",
    "Khác",
  ];

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng chọn lý do hủy đơn.");
      return;
    }

    dispatch(cancelOrder({ orderId: id, reason: cancelReason })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setShowCancelModal(false);
        setCancelReason("");
        setCancelError("");
      }
    });
  };

  const formatShippingAddress = (addr) => {
    if (!addr) return "N/A";
    return [addr.address, addr.city].filter(Boolean).join(", ") || "N/A";
  };

  const renderStatus = (status) => {
    const map = {
      Processing: { text: "Đang xử lí", color: "bg-yellow-100 text-yellow-700" },
      Shipped: { text: "Đang vận chuyển", color: "bg-blue-100 text-blue-700" },
      Delivered: { text: "Đã giao hàng", color: "bg-green-100 text-green-700" },
      Cancelled: { text: "Đã hủy", color: "bg-red-100 text-red-700" },
    };
    const s = map[status] || map.Processing;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
        {s.text}
      </span>
    );
  };

  if (loading) return <p className="text-center py-8">Đang tải...</p>;
  if (error) return <p className="text-red-500 text-center py-8">Lỗi: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Chi tiết đơn hàng</h2>

      {!orderDetails ? (
        <p>Không tìm thấy đơn hàng</p>
      ) : (
        <div className="bg-white p-6 rounded-lg border relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold">ID: #{orderDetails._id}</h3>
              <p className="text-gray-600">
                {new Date(orderDetails.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2 mt-4 sm:mt-0">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  orderDetails.isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {orderDetails.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
              {renderStatus(orderDetails.status)}
            </div>
          </div>

          {/* Thông tin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="font-semibold mb-2">Thanh toán</h4>
              <p>Phương thức: {orderDetails.paymentMethod}</p>
              <p>
                Trạng thái:{" "}
                {orderDetails.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Giao hàng</h4>
              <p>
                Địa chỉ: {formatShippingAddress(orderDetails.shippingAddress)}
              </p>
            </div>
          </div>

          {/* Sản phẩm */}
          <div className="mb-10">
            <h4 className="font-semibold mb-3">Sản phẩm</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-center">Hình</th>
                    <th className="py-2 px-3 text-left">Tên</th>
                    <th className="py-2 px-3 text-right">Giá</th>
                    <th className="py-2 px-3 text-center">SL</th>
                    <th className="py-2 px-3 text-right">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.orderItems.map((item) => {
                    const price =
                      item.discountPrice > 0 ? item.discountPrice : item.price;
                    const total = price * item.quantity;
                    return (
                      <tr key={item.productId} className="border-b">
                        <td className="py-2 px-3 text-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Link
                            to={`/product/${item.productId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {price.toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {total.toLocaleString("vi-VN")} ₫
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lý do hủy (nếu có) */}
          {orderDetails.status === "Cancelled" && orderDetails.cancelReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-700">Lý do hủy:</p>
              <p className="text-red-600">{orderDetails.cancelReason}</p>
            </div>
          )}

          {/* Nút Hủy + Quay lại - GÓC DƯỚI BÊN PHẢI */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Link
              to="/my-orders"
              className="text-blue-600 hover:underline font-medium"
            >
              ← Quay lại đơn hàng
            </Link>

            {/* Nút Hủy - chỉ hiện khi Processing */}
            {orderDetails.status === "Processing" && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-red-600 transition font-medium shadow-md"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal hủy đơn */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Hủy đơn hàng</h3>
            <p className="text-gray-600 mb-4">Vui lòng chọn lý do hủy đơn:</p>

            <div className="space-y-2 mb-4">
              {reasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-red-500 focus:ring-red-500"
                  />
                  <span className="text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            {cancelError && (
              <p className="text-red-500 text-sm mb-4 font-medium">{cancelError}</p>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError("");
                  setCancelReason("");
                }}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;