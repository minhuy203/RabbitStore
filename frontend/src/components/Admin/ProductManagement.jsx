import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Thêm useLocation
import {
  deleteProduct,
  fetchAdminProducts,
} from "../../redux/slices/adminProductSlice";
import Pagination from "../Common/Pagination";

// Component thông báo giống hệt UserManagement
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
            : type === "error"
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : "bg-gradient-to-r from-blue-500 to-indigo-600"
        }`}
      >
        <span>{type === "success" ? "Check" : type === "error" ? "Warning" : "Info"}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:opacity-70">
          X
        </button>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Thêm để nhận state

  const { products, loading, error } = useSelector((state) => state.adminProducts);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // State cho thông báo
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  const closeNotification = () => setNotification(null);

  // === NHẬN THÔNG BÁO TỪ EDIT / CREATE PAGE ===
  useEffect(() => {
    if (location.state?.message) {
      showNotification(location.state.message, location.state.type || "success");
      // Xóa state để tránh hiện lại khi reload trang
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Gọi API khi mount
  useEffect(() => {
    const controller = new AbortController();
    dispatch(fetchAdminProducts({ signal: controller.signal }));
    return () => controller.abort();
  }, [dispatch]);

  // Xử lý xóa sản phẩm + thông báo
  const handleDelete = async (id) => {
    const product = products.find((p) => p._id === id);
    if (!product) return;

    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?\nHành động này không thể hoàn tác!`)) {
      const result = await dispatch(deleteProduct(id));

      if (deleteProduct.fulfilled.match(result)) {
        showNotification(`Đã xóa sản phẩm "${product.name}" thành công!`);
        dispatch(fetchAdminProducts());
      } else {
        showNotification(
          result.payload?.message || "Xóa sản phẩm thất bại!",
          "error"
        );
      }
    }
  };

  // Phân trang + tìm kiếm
  const sortedProducts = [...products].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const filteredProducts = sortedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Thông báo đẹp */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Quản lý sản phẩm</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <Link
            to="/admin/products/create"
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition shadow-md text-center"
          >
            + Thêm sản phẩm mới
          </Link>
        </div>
      </div>

      {/* Bảng sản phẩm */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold">Hình ảnh</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Tên sản phẩm</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Giá</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Tồn kho</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Đã bán</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">SKU</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    </div>
                    <p className="mt-4">Đang tải danh sách sản phẩm...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-red-600">
                    Lỗi: {error}
                    <button
                      onClick={() => dispatch(fetchAdminProducts())}
                      className="block mx-auto mt-3 underline hover:no-underline"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-14 h-14 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-lg w-14 h-14" />
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium max-w-xs truncate">
                      {product.name}
                    </td>
                    <td className="py-4 px-6">
                      {product.price.toLocaleString("vi-VN")}₫
                      {product.discountPrice > 0 && (
                        <span className="block text-sm text-green-600 font-medium">
                          → {product.discountPrice.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">{product.countInStock ?? 0}</td>
                    <td className="py-4 px-6 text-center">{product.totalSold ?? 0}</td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-600">
                      {product.sku}
                    </td>
                    <td className="py-4 px-6 space-x-2">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm font-medium"
                      >
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-gray-500 text-lg">
                    {searchTerm
                      ? `Không tìm thấy sản phẩm nào phù hợp với "${searchTerm}"`
                      : "Chưa có sản phẩm nào trong hệ thống."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="bg-gray-50 p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Animation CSS inject tự động */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProductManagement;