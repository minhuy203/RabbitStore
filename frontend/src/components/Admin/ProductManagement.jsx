import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteProduct, fetchAdminProducts } from "../../redux/slices/adminProductSlice";
import Pagination from "../Common/Pagination";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.adminProducts);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // Tìm kiếm
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  // XÓA SẢN PHẨM – vẫn dùng window.confirm nhưng an toàn vì chỉ gọi khi click
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      dispatch(deleteProduct(id)).then(() => {
        dispatch(fetchAdminProducts());
      });
    }
  };

  if (loading) return <p className="text-center">Đang tải...</p>;
  if (error) return <p className="text-red-500 text-center">Lỗi: {error}</p>;

  // Lọc + tìm kiếm
  const filteredAndSorted = useMemo(() => {
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [products, searchTerm]);

  // Reset trang khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Phân trang
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = filteredAndSorted.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header + Tìm kiếm */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
          <Link
            to="/admin/products/create"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition whitespace-nowrap"
          >
            + Thêm
          </Link>
        </div>
      </div>

      {/* Bảng */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Giá</th>
              <th className="py-3 px-4">SL</th>
              <th className="py-3 px-4">Bán</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <tr key={product._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="p-4">{product.price?.toLocaleString("vi-VN")} VND</td>
                  <td className="p-4">{product.countInStock ?? 0}</td>
                  <td className="p-4">{product.totalSold ?? 0}</td>
                  <td className="p-4">{product.sku}</td>
                  <td className="p-4">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 text-xs"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {searchTerm
                    ? `Không tìm thấy sản phẩm nào với tên "${searchTerm}"`
                    : "Không có sản phẩm nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Kết quả tìm kiếm */}
      {searchTerm && (
        <p className="text-sm text-gray-600 mt-3 text-right">
          Tìm thấy <strong>{filteredAndSorted.length}</strong> sản phẩm
        </p>
      )}

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductManagement;