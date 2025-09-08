import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchOrderDetails } from "../redux/slices/orderSlice";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  const formatShippingAddress = (shippingAddress) => {
    if (!shippingAddress) return "N/A";
    const { address, city } = shippingAddress;
    return [address, city].filter(Boolean).join(", ") || "N/A";
  };

  const renderOrderStatus = (status) => {
    const statusMap = {
      Processing: {
        text: "Đang xử lí",
        color: "bg-yellow-100 text-yellow-700",
      },
      Shipped: { text: "Đang vận chuyển", color: "bg-blue-100 text-blue-700" },
      Delivered: { text: "Đã giao hàng", color: "bg-green-100 text-green-700" },
      Cancelled: { text: "Đã hủy", color: "bg-red-100 text-red-700" },
    };
    const s = statusMap[status] || statusMap["Processing"];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}>
        {s.text}
      </span>
    );
  };

  if (loading) return <p>Đang tải trang...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Chi tiết đơn hàng</h2>
      {!orderDetails ? (
        <p>Không tìm thấy đơn hàng nào</p>
      ) : (
        <div className="p-4 sm:p-6 rounded-lg border">
          <div className="flex flex-col sm:flex-row justify-between mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-semibold">
                ID đơn hàng: #{orderDetails._id}
              </h3>
              <p className="text-gray-600">
                {new Date(orderDetails.createdAt).toLocaleDateString("vi-VN")}{" "}
                {new Date(orderDetails.createdAt).toLocaleTimeString("vi-VN")}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end mt-5 sm:mt-0 space-y-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  orderDetails.isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {orderDetails.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
              {renderOrderStatus(orderDetails.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Thông tin thanh toán
              </h4>
              <p>
                Phương thức thanh toán:{" "}
                {orderDetails.paymentMethod || "Chưa xác định"}
              </p>
              <p>
                Trạng thái:{" "}
                {orderDetails.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">
                Thông tin vận chuyển
              </h4>
              <p>
                Địa chỉ: {formatShippingAddress(orderDetails.shippingAddress)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <h4 className="text-lg font-semibold mb-4">Danh sách sản phẩm</h4>
            <table className="min-w-full text-gray-600 mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-center">Hình ảnh</th>
                  <th className="py-2 px-4 text-left">Tên</th>
                  <th className="py-2 px-4 text-right">Giá</th>
                  <th className="py-2 px-4 text-center">Số lượng</th>
                  <th className="py-2 px-4 text-right">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.orderItems.map((item) => {
                  // Kiểm tra dữ liệu
                  if (!item.price && !item.discountPrice) {
                    console.warn(
                      `Sản phẩm ${item.name} thiếu giá hợp lệ`,
                      item
                    );
                  }
                  const price =
                    typeof item.discountPrice === "number" &&
                    item.discountPrice > 0
                      ? item.discountPrice
                      : item.price || 0;
                  const total = price * item.quantity;
                  return (
                    <tr key={item.productId} className="border-b">
                      <td className="py-2 px-4 text-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg mx-auto"
                        />
                      </td>
                      <td className="py-2 px-4 text-left">
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-blue-500 hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-2 px-4 text-right">
                        {price.toLocaleString("vi-VN")} VND
                      </td>
                      <td className="py-2 px-4 text-center">{item.quantity}</td>
                      <td className="py-2 px-4 text-right">
                        {total.toLocaleString("vi-VN")} VND
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Link to="/my-orders" className="text-blue-500 hover:underline">
            Quay lại đơn hàng của tôi
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
