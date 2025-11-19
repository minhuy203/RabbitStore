import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllOrders } from "../../redux/slices/adminOrderSlice";
import Pagination from "../Common/Pagination";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  // Lọc + sắp xếp
  const filteredOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((order) =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header + Search (giữ nguyên style như ProductManagement) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h2>
        <input
          type="text"
          placeholder="Tìm kiếm theo ID đơn hoặc tên khách..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-80 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        />
      </div>

      {/* BẢNG CHỈNH ĐỒNG BỘ HOÀN TOÀN VỚI PRODUCTMANAGEMENT */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold">ID Đơn hàng</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Khách hàng</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Sản phẩm</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">SL</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Tổng tiền</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Trạng thái</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Ngày đặt</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    </div>
                    <p className="mt-4">Đang tải danh sách đơn hàng...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-red-600">
                    Lỗi: {error}
                    <button onClick={() => dispatch(fetchAllOrders())} className="block mx-auto mt-3 underline hover:no-underline">
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-mono text-sm">
                      <Link to={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
                        #{order._id.slice(-8)}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-medium">{order.user?.name || "Khách lẻ"}</td>
                    <td className="py-4 px-6 max-w-xs truncate">
                      {order.orderItems?.[0]?.name || "N/A"}
                      {order.orderItems?.length > 1 && ` +${order.orderItems.length - 1}`}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {order.orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                    </td>
                    <td className="py-4 px-6 font-semibold text-green-600">
                      {order.totalPrice?.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "Processing" && "Đang xử lý"}
                        {order.status === "Shipped" && "Đang vận chuyển"}
                        {order.status === "Delivered" && "Đã giao"}
                        {order.status === "Cancelled" && "Đã hủy"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="inline-block bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-gray-500 text-lg">
                    {searchTerm ? `Không tìm thấy đơn hàng nào phù hợp với "${searchTerm}"` : "Chưa có đơn hàng nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination giống hệt ProductManagement */}
        {totalPages > 1 && (
          <div className="bg-gray-50 p-4 border-t">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;