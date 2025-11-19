import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
  cancelOrderByAdmin,
} from "../../redux/slices/adminOrderSlice";

// ==================== COMPONENT THÔNG BÁO ĐẸP NHƯ USERMANAGEMENT ====================
const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={`px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 text-white font-medium ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : "bg-gradient-to-r from-red-500 to-rose-600"
        }`}
      >
        <span>{type === "success" ? "Check" : "Warning"}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:opacity-70">
          X
        </button>
      </div>
    </div>
  );
};

// ================================== ORDER DETAIL PAGE ==================================
const OrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { user } = useSelector((state) => state.auth);
  const { order, loading, error } = useSelector((state) => state.adminOrders);

  // State thông báo
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };
  const closeNotification = () => setNotification(null);

  // Modal hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const adminCancelReasons = [
    "Khách hàng yêu cầu hủy",
    "Hết hàng",
    "Lỗi hệ thống",
    "Không liên lạc được với khách",
    "Đơn hàng giả mạo",
    "Khác",
  ];

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, user, navigate, id]);

  // Cập nhật trạng thái + thông báo
  const handleStatusChange = async (status) => {
    const result = await dispatch(updateOrderStatus({ id, status }));

    if (updateOrderStatus.fulfilled.match(result)) {
      const statusText = {
        Processing: "Đang xử lý",
        Shipped: "Đang vận chuyển",
        Delivered: "Đã giao hàng",
      }[status];
      showNotification(`Đã cập nhật trạng thái → ${statusText}`);
      dispatch(fetchOrderById(id));
    } else {
      showNotification("Cập nhật trạng thái thất bại!", "error");
    }
  };

  // Hủy đơn bởi admin + thông báo
  const handleAdminCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng chọn lý do hủy đơn.");
      return;
    }

    const result = await dispatch(cancelOrderByAdmin({ orderId: id, reason: cancelReason }));

    if (cancelOrderByAdmin.fulfilled.match(result)) {
      showNotification(`Đơn hàng đã được hủy thành công! Lý do: ${cancelReason}`);
      setShowCancelModal(false);
      setCancelReason("");
      setCancelError("");
      dispatch(fetchOrderById(id));
    } else {
      showNotification(result.payload || "Hủy đơn hàng thất bại!", "error");
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      Processing: { text: "Đang xử lý", color: "bg-yellow-100 text-yellow-800" },
      Shipped: { text: "Đang vận chuyển", color: "bg-blue-100 text-blue-800" },
      Delivered: { text: "Đã giao hàng", color: "bg-green-100 text-green-800" },
      Cancelled: { text: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    const s = map[status] || map.Processing;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.color}`}>
        {s.text}
      </span>
    );
  };

  if (loading) return <p className="text-center text-gray-500 py-16 text-lg">Đang tải chi tiết đơn hàng...</p>;
  if (error) return <p className="text-red-500 text-center py-16 text-lg">Lỗi: {error}</p>;
  if (!order) return <p className="text-center text-gray-500 py-16 text-lg">Không tìm thấy đơn hàng</p>;

  const isCancellable = ["Processing", "Shipped"].includes(order.status);
  const isFinalStatus = order.status === "Delivered" || order.status === "Cancelled";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* THÔNG BÁO ĐẸP */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800">
        Chi tiết đơn hàng #{order._id.slice(-8)}
      </h2>

      <div className="bg-white shadow-xl rounded-xl p-6 border">

        {/* Thông tin đơn hàng */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Thông tin đơn hàng</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p><strong>Mã đơn:</strong> #{order._id}</p>
            <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Khách hàng</h3>
          <div className="text-sm space-y-1">
            <p><strong>Tên:</strong> {order.user?.name || "Khách không xác định"}</p>
            <p><strong>Email:</strong> {order.user?.email || "Không có"}</p>
          </div>
        </div>

        {/* Địa chỉ giao hàng */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Địa chỉ giao hàng</h3>
          <div className="text-sm space-y-1">
            <p><strong>Địa chỉ:</strong> {order.shippingAddress?.address || "Không có"}</p>
            <p><strong>Thành phố:</strong> {order.shippingAddress?.city || "Không có"}</p>
            <p><strong>Số điện thoại:</strong> {order.shippingAddress?.phone || "Không có"}</p>
          </div>
        </div>

        {/* Thanh toán */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Thanh toán</h3>
          <div className="text-sm space-y-1">
            <p><strong>Phương thức:</strong> {order.paymentMethod || "Không xác định"}</p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <span className={order.paymentStatus === "paid" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </p>
            {order.paidAt && (
              <p><strong>Thời gian thanh toán:</strong> {new Date(order.paidAt).toLocaleString("vi-VN")}</p>
            )}
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Trạng thái đơn hàng</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {renderStatusBadge(order.status)}
              {order.status === "Cancelled" && order.cancelledAt && (
                <span className="text-xs text-gray-500">
                  ({new Date(order.cancelledAt).toLocaleString("vi-VN")})
                </span>
              )}
            </div>

            {!isFinalStatus && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={loading}
                  className="bg-white border border-gray-300 text-sm rounded-lg px-4 py-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="Processing">Đang xử lý</option>
                  <option value="Shipped">Đang vận chuyển</option>
                  <option value="Delivered">Đã giao hàng</option>
                </select>
                <button
                  onClick={() => handleStatusChange("Delivered")}
                  disabled={loading}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-medium"
                >
                  {loading ? "Đang xử lý..." : "Đánh dấu đã giao"}
                </button>
              </div>
            )}
          </div>

          {/* Lý do hủy */}
          {order.status === "Cancelled" && order.cancelReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-700 text-sm">Lý do hủy đơn:</p>
              <p className="text-sm text-red-600 mt-1">{order.cancelReason}</p>
              {order.cancelledAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Hủy lúc: {new Date(order.cancelledAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Danh sách sản phẩm */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Sản phẩm trong đơn</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Hình ảnh</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Màu</th>
                  <th className="py-3 px-4 text-center">SL</th>
                  <th className="py-3 px-4 text-right">Giá</th>
                  <th className="py-3 px-4 text-right">Giảm giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.orderItems?.length > 0 ? (
                  order.orderItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium max-w-xs truncate">{item.name}</td>
                      <td className="py-3 px-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md shadow" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-200 border-2 border-dashed rounded-md"></div>
                        )}
                      </td>
                      <td className="py-3 px-4">{item.size || "—"}</td>
                      <td className="py-3 px-4">{item.color || "—"}</td>
                      <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{item.price.toLocaleString("vi-VN")}₫</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        {item.discountPrice > 0 ? item.discountPrice.toLocaleString("vi-VN") + "₫" : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">Không có sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Tổng cộng</h3>
            <p className="text-2xl font-bold text-green-600">
              {order.totalPrice.toLocaleString("vi-VN")}₫
            </p>
          </div>
        </div>

        {/* NÚT HỦY + QUAY LẠI */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition"
          >
            ← Quay lại danh sách đơn hàng
          </button>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-7 py-3 rounded-lg hover:bg-red-700 transition font-medium shadow-lg"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* MODAL HỦY ĐƠN */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Hủy đơn hàng (Admin)</h3>
            <p className="text-gray-600 mb-5">Vui lòng chọn lý do hủy:</p>

            <div className="space-y-3 mb-5">
              {adminCancelReasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-5 h-5 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700 font-medium">{r}</span>
                </label>
              ))}
            </div>

            {cancelError && <p className="text-red-600 text-sm font-medium mb-4">{cancelError}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError("");
                  setCancelReason("");
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAdminCancel}
                disabled={loading}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
              >
                {loading ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// === TỰ ĐỘNG THÊM ANIMATION – GIỐNG HỆT USERMANAGEMENT ===
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.4s ease-out;
  }
`;
document.head.appendChild(style);

export default OrderDetailPage;