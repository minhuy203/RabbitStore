import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
} from "../../redux/slices/adminOrderSlice";

const OrderDetailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy orderId từ URL

  const { user } = useSelector((state) => state.auth);
  const { order, loading, error } = useSelector((state) => state.adminOrders);

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
        dispatch(fetchOrderById(id)); // Làm mới chi tiết đơn hàng sau khi cập nhật
      }
    });
  };

  if (loading) return <p className="text-center">Đang tải...</p>;
  if (error) return <p className="text-red-500 text-center">Lỗi: {error}</p>;
  if (!order) return <p className="text-center">Không tìm thấy đơn hàng</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Chi tiết đơn hàng #{order._id}</h2>

      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Thông tin khách hàng */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng</h3>
          <p><strong>Tên:</strong> {order.user?.name || "Khách không xác định"}</p>
          <p><strong>Email:</strong> {order.user?.email || "Không có"}</p>
        </div>

        {/* Địa chỉ giao hàng */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Địa chỉ giao hàng</h3>
          <p><strong>Địa chỉ:</strong> {order.shippingAddress?.address}</p>
          <p><strong>Thành phố:</strong> {order.shippingAddress?.city}</p>
        </div>

        {/* Thông tin thanh toán */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Thông tin thanh toán</h3>
          <p><strong>Phương thức:</strong> {order.paymentMethod}</p>
          <p><strong>Trạng thái:</strong> {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</p>
          {order.paidAt && <p><strong>Thời gian thanh toán:</strong> {new Date(order.paidAt).toLocaleString("vi-VN")}</p>}
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Trạng thái đơn hàng</h3>
          <select
            value={order.status || "Processing"}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 ${
              loading || order.status === "Cancelled" || order.status === "Delivered"
                ? "opacity-50 cursor-not-allowed bg-gray-200"
                : ""
            }`}
            disabled={loading || order.status === "Cancelled" || order.status === "Delivered"}
          >
            <option value="Processing">Đang xử lý</option>
            <option value="Shipped">Đang vận chuyển</option>
            <option value="Delivered">Đã giao hàng</option>
            <option value="Cancelled">Hủy đơn</option>
          </select>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Danh sách sản phẩm</h3>
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Hình ảnh</th>
                <th className="py-3 px-4">Kích thước</th>
                <th className="py-3 px-4">Màu sắc</th>
                <th className="py-3 px-4">Số lượng</th>
                <th className="py-3 px-4">Giá</th>
                <th className="py-3 px-4">Giá giảm</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems?.map((item) => (
                <tr key={item.productId} className="border-b">
                  <td className="py-4 px-4">{item.name}</td>
                  <td className="py-4 px-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover" />
                  </td>
                  <td className="py-4 px-4">{item.size || "N/A"}</td>
                  <td className="py-4 px-4">{item.color || "N/A"}</td>
                  <td className="py-4 px-4">{item.quantity}</td>
                  <td className="py-4 px-4">{item.price.toLocaleString("vi-VN")} VND</td>
                  <td className="py-4 px-4">
                    {item.discountPrice ? item.discountPrice.toLocaleString("vi-VN") : "N/A"} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tổng giá */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Tổng giá</h3>
          <p><strong>Tổng:</strong> {order.totalPrice?.toLocaleString("vi-VN")} VND</p>
        </div>

        {/* Nút quay lại */}
        <button
          onClick={() => navigate("/admin/orders")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;