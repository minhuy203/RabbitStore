import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
  cancelOrderByAdmin, // THÊM ACTION MỚI
} from "../../redux/slices/adminOrderSlice";

const OrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { user } = useSelector((state) => state.auth);
  const { order, loading, error } = useSelector((state) => state.adminOrders);

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

  const handleStatusChange = (status) => {
    dispatch(updateOrderStatus({ id, status })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        dispatch(fetchOrderById(id));
      }
    });
  };

  const handleAdminCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng chọn lý do hủy đơn.");
      return;
    }

    dispatch(cancelOrderByAdmin({ orderId: id, reason: cancelReason })).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setShowCancelModal(false);
        setCancelReason("");
        setCancelError("");
        dispatch(fetchOrderById(id)); // Làm mới dữ liệu
      }
    });
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        Chi tiết đơn hàng #{order._id}
      </h2>

      <div className="bg-white shadow-lg rounded-lg p-6 border relative">
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
          <div className="text-sm">
            <p><strong>Địa chỉ:</strong> {order.shippingAddress?.address || "Không có"}</p>
            <p><strong>Thành phố:</strong> {order.shippingAddress?.city || "Không có"}</p>
          </div>
        </div>

        {/* Thông tin thanh toán */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Thanh toán</h3>
          <div className="text-sm space-y-1">
            <p><strong>Phương thức:</strong> {order.paymentMethod || "Không xác định"}</p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}>
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

            {/* Cập nhật trạng thái */}
            {!isFinalStatus && (
              <div className="flex gap-2">
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
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
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

        {/* Danh sách sản phẩm */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Sản phẩm trong đơn</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Hình ảnh</th>
                  <th className="py-3 px-4">Kích thước</th>
                  <th className="py-3 px-4">Màu sắc</th>
                  <th className="py-3 px-4 text-center">SL</th>
                  <th className="py-3 px-4 text-right">Giá</th>
                  <th className="py-3 px-4 text-right">Giá giảm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.orderItems?.length > 0 ? (
                  order.orderItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.name || "N/A"}</td>
                      <td className="py-3 px-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-md" />
                        ) : (
                          <span className="text-gray-400 text-xs">Không có</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{item.size || "—"}</td>
                      <td className="py-3 px-4">{item.color || "—"}</td>
                      <td className="py-3 px-4 text-center font-medium">{item.quantity || 0}</td>
                      <td className="py-3 px-4 text-right">{item.price?.toLocaleString("vi-VN") || 0} VND</td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {item.discountPrice > 0 ? item.discountPrice.toLocaleString("vi-VN") + " VND" : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">Không có sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổng giá */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tổng cộng</h3>
            <p className="text-xl font-bold text-green-600">
              {order.totalPrice?.toLocaleString("vi-VN") || 0} VND
            </p>
          </div>
        </div>

        {/* NÚT HỦY + QUAY LẠI - GÓC DƯỚI PHẢI */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-1"
          >
            ← Quay lại danh sách
          </button>

          {/* NÚT HỦY CHO ADMIN */}
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

      {/* MODAL HỦY ĐƠN - ADMIN */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
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

export default OrderDetailPage;