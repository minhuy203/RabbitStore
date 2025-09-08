import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "../redux/slices/adminProductSlice";
import { fetchAllOrders } from "../redux/slices/adminOrderSlice";

const AdminHomePage = () => {
  const dispatch = useDispatch();
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useSelector((state) => state.adminProducts);
  const {
    orders,
    totalOrders,
    totalSales,
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.adminOrders);

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAllOrders());
  }, [dispatch]);

  // Hàm định dạng tiền tệ VND
  const formatVND = (value) => {
    if (value === null || value === undefined) return "0 VND";
    return value.toLocaleString("vi-VN") + " VND";
  };

  // Hàm ánh xạ trạng thái sang tiếng Việt
  const mapStatus = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      processing: "Đang xử lý",
      shipped: "Đã vận chuyển",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
    };
    return statusMap[status?.toLowerCase()] || "Không xác định";
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Trang quản trị</h1>
      {productsLoading || ordersLoading ? (
        <p>Đang tải...</p>
      ) : productsError ? (
        <p className="text-red-500">Lỗi tải sản phẩm: {productsError}</p>
      ) : ordersError ? (
        <p className="text-red-500">Lỗi tải đơn hàng: {ordersError}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 shadow-md rounded-lg">
            <h2 className="text-xl font-semibold">Doanh thu</h2>
            <p className="text-2xl">{formatVND(totalSales)}</p>
          </div>
          <div className="p-4 shadow-md rounded-lg">
            <h2 className="text-xl font-semibold">Tổng đơn hàng</h2>
            <p className="text-2xl">{totalOrders}</p>
            <Link to="/admin/orders" className="text-blue-500 hover:underline">
              Quản lý đơn hàng
            </Link>
          </div>
          <div className="p-4 shadow-md rounded-lg">
            <h2 className="text-xl font-semibold">Tổng sản phẩm</h2>
            <p className="text-2xl">{products.length}</p>
            <Link
              to="/admin/products"
              className="text-blue-500 hover:underline"
            >
              Quản lý sản phẩm
            </Link>
          </div>
        </div>
      )}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Đơn hàng gần đây</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="py-3 px-4">ID Đơn hàng</th>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Tổng giá</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-4">{order._id}</td>
                    <td className="p-4">
                      {order.user?.name || "Không xác định"}
                    </td>
                    <td className="p-4">{formatVND(order.totalPrice)}</td>
                    <td className="p-4">{mapStatus(order.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Không có đơn hàng nào gần đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
