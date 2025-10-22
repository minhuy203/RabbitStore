import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchAllOrders } from "../../redux/slices/adminOrderSlice";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="text-red-500">Lỗi: {error}</p>;

  // Sắp xếp đơn hàng theo createdAt giảm dần
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Quản lý đơn hàng</h2>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">ID đơn hàng</th>
              <th className="py-3 px-4">Khách hàng</th>
              <th className="py-3 px-4">Tên sản phẩm</th>
              <th className="py-3 px-4">Số lượng</th>
              <th className="py-3 px-4">Tổng giá</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="py-4 px-4 font-medium text-gray-900 whitespace-nowrap">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      #{order._id}
                    </Link>
                  </td>
                  <td className="p-4">
                    {order.user && order.user.name
                      ? order.user.name
                      : "Khách không xác định"}
                  </td>
                  <td className="p-4">
                    {order.orderItems?.length > 0
                      ? order.orderItems[0].name
                      : "N/A"}
                    {order.orderItems?.length > 1 && " ..."}
                  </td>
                  <td className="p-4">
                    {order.orderItems?.reduce(
                      (total, item) => total + (item.quantity || 0),
                      0
                    ) || 0}
                  </td>
                  <td className="p-4">
                    {order.totalPrice?.toLocaleString("vi-VN") || 0} VND
                  </td>
                  <td className="p-4">
                    {(() => {
                      let label = "Đang xử lý";
                      let bgClass = "bg-yellow-200 text-yellow-700";

                      switch (order.status) {
                        case "Processing":
                          label = "Đang xử lý";
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
                          label = "Đang xử lý";
                          bgClass = "bg-yellow-200 text-yellow-700";
                      }

                      return (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${bgClass}`}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
