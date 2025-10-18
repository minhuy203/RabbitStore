import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAdminProducts } from "../redux/slices/adminProductSlice";
import { fetchAllOrders } from "../redux/slices/adminOrderSlice";
import flatpickr from "flatpickr";

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
    loading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.adminOrders);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  });
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredStats, setFilteredStats] = useState({
    filteredTotalOrders: 0,
    filteredTotalSales: 0,
  });

  // Tính tổng doanh thu chỉ từ các đơn hàng có trạng thái "delivered"
  const totalSales = orders
    .filter((order) => order.status?.toLowerCase() === "delivered")
    .reduce((acc, order) => acc + (order.totalPrice || 0), 0);

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAllOrders());
  }, [dispatch]);

  useEffect(() => {
    const flatpickrInstance = flatpickr("#dateRangePicker", {
      mode: "range",
      dateFormat: "Y-m-d",
      defaultDate: [dateRange.startDate, dateRange.endDate],
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          setDateRange({
            startDate: selectedDates[0],
            endDate: selectedDates[1],
          });
        }
      },
    });

    return () => flatpickrInstance.destroy();
  }, []);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });

    const stats = filtered.reduce(
      (acc, order) => ({
        filteredTotalOrders: acc.filteredTotalOrders + 1,
        filteredTotalSales: acc.filteredTotalSales + (order.totalPrice || 0),
      }),
      { filteredTotalOrders: 0, filteredTotalSales: 0 }
    );

    setFilteredOrders(filtered);
    setFilteredStats(stats);
  }, [orders, dateRange]);

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
          <div className="p-4 shadow-md rounded-lg bg-white">
            <h2 className="text-xl font-semibold">Doanh thu (Tổng - Đã giao hàng)</h2>
            <p className="text-2xl">{formatVND(totalSales)}</p>
          </div>
          <div className="p-4 shadow-md rounded-lg bg-white">
            <h2 className="text-xl font-semibold">Tổng đơn hàng</h2>
            <p className="text-2xl">{totalOrders}</p>
            <Link to="/admin/orders" className="text-blue-500 hover:underline">
              Quản lý đơn hàng
            </Link>
          </div>
          <div className="p-4 shadow-md rounded-lg bg-white">
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
        <h2 className="text-2xl font-bold mb-4">Thống kê đơn hàng</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Chọn khoảng thời gian:
          </label>
          <input
            id="dateRangePicker"
            type="text"
            className="border rounded-lg p-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Chọn khoảng thời gian"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="p-4 shadow-md rounded-lg bg-white">
            <h3 className="text-lg font-semibold">
              Tổng đơn hàng (Khoảng thời gian)
            </h3>
            <p className="text-2xl">{filteredStats.filteredTotalOrders}</p>
          </div>
          <div className="p-4 shadow-md rounded-lg bg-white">
            <h3 className="text-lg font-semibold">
              Doanh thu (Khoảng thời gian)
            </h3>
            <p className="text-2xl">
              {formatVND(filteredStats.filteredTotalSales)}
            </p>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-4">Danh sách đơn hàng</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-500">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="py-3 px-4">ID Đơn hàng</th>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Tổng giá</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
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
                    <td className="p-4">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Không có đơn hàng nào trong khoảng thời gian này.
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