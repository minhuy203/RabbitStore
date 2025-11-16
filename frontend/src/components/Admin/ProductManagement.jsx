import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteProduct, fetchAdminProducts } from "../../redux/slices/adminProductSlice";
import Pagination from "../Common/Pagination";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.adminProducts);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // Gọi API khi mount
  useEffect(() => {
    const controller = new AbortController(); // Ngăn memory leak
    dispatch(fetchAdminProducts({ signal: controller.signal }));

    return () => controller.abort(); // Hủy request khi unmount
  }, [dispatch]);

  // Xử lý xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
      const result = await dispatch(deleteProduct(id));
      if (deleteProduct.fulfilled.match(result)) {
        // Xóa thành công → reload danh sách
        dispatch(fetchAdminProducts());
      } else {
        alert(result.payload?.message || "Xóa thất bại!");
      }
    }
  };

  // Loading & Error UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-semibold">Lỗi kết nối:</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => dispatch(fetchAdminProducts())}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Dữ liệu đã sẵn sàng
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header: Tiêu đề + Tìm kiếm + Thêm */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <Link
            to="/admin/products/create"
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition whitespace-nowrap text-center"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Bảng sản phẩm */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg bg-white">
        <table className="min-w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4 font-semibold">Tên</th>
              <th className="py-3 px-4 font-semibold">Giá</th>
              <th className="py-3 px-4 font-semibold">Tồn kho</th>
              <th className="py-3 px-4 font-semibold">Đã bán</th>
              <th className="py-3 px-4 font-semibold">SKU</th>
              <th className="py-3 px-4 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <tr
                  key={product._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="p-4">
                    {product.price?.toLocaleString("vi-VN")} VND
                  </td>
                  <td className="p-4">{product.countInStock ?? 0}</td>
                  <td className="p-4">{product.totalSold ?? 0}</td>
                  <td className="p-4 font-mono text-xs">{product.sku}</td>
                  <td className="p-4 space-x-2">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="inline-block bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600 transition"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="inline-block bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {searchTerm
                    ? `Không tìm thấy sản phẩm nào phù hợp với "${searchTerm}"`
                    : "Chưa có sản phẩm nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default ProductManagement;