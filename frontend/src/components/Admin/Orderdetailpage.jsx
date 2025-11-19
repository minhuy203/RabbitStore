import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
  cancelOrderByAdmin,
} from "../../redux/slices/adminOrderSlice";

// === COMPONENT THÔNG BÁO ĐẸP NHƯ USERMANAGEMENT ===
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
      showNotification(`Đã cập nhật trạng thái → ${getStatusText(status)}`);
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

  const getStatusText = (status) => {
    const map = {
      Processing: "Đang xử lý",
      Shipped: "Đang vận chuyển",
      Delivered: "Đã giao hàng",
      Cancelled: "Đã hủy",
    };
    return map[status] || status;
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

  if (loading) return <p className="text-center text-gray-500 py-8">Đang tải...</p>;
  if (error) return <p className="text-red-500 text-center py-8">Lỗi: {error}</p>;
  if (!order) return <p className="text-center text-gray-500 py-8">Không tìm thấy đơn hàng</p>;

  const isCancellable = ["Processing", "Shipped"].includes(order.status);
  const isFinalStatus = order.status === "Delivered" || order.status === "Cancelled";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* THÔNG BÁO ĐẸP NHƯ USERMANAGEMENT */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        Chi tiết đơn hàng #{order._id.slice(-8)}
      </h2>

      <div className="bg-white shadow-xl rounded-xl p-6 border relative">
        {/* ... (giữ nguyên toàn bộ nội dung cũ của bạn, chỉ thêm thông báo ở trên) ... */}

        {/* Phần còn lại giữ nguyên 100% như cũ */}
        {/* (Mình không paste lại để ngắn gọn, bạn chỉ cần giữ nguyên phần JSX cũ) */}

        {/* Ví dụ: phần trạng thái */}
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
              <div className="flex gap-2 flex-wrap">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={loading}
                  className="bg-white border border-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="Processing">Đang xử lý</option>
                  <option value="Shipped">Đang vận chuyển</option>
                  <option value="Delivered">Đã giao hàng</option>
                </select>
                <button
                  onClick={() => handleStatusChange("Delivered")}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {loading ? "Đang xử lý..." : "Đánh dấu giao hàng"}
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

        {/* ... phần còn lại giữ nguyên ... */}

        {/* NÚT HỦY + QUAY LẠI */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
          >
            ← Quay lại danh sách
          </button>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium shadow-md"
            >
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* MODAL HỦY ĐƠN */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Hủy đơn hàng (Admin)</h3>
            <p className="text-gray-600 mb-4">Chọn lý do hủy đơn:</p>

            <div className="space-y-2 mb-4">
              {adminCancelReasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="radio"
                    name="adminReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            {cancelError && <p className="text-red-500 text-sm mb-4 font-medium">{cancelError}</p>}

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
                onClick={handleAdminCancel}
                disabled={loading}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium"
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

// === INJECT CSS TỰ ĐỘNG – GIỐNG HỆT USERMANAGEMENT ===
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