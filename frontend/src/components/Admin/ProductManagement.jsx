import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  deleteProduct,
  fetchAdminProducts,
} from "../../redux/slices/adminProductSlice";

const ProductManagement = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector(
    (state) => state.adminProducts
  );

  // Lấy danh sách sản phẩm khi load trang
  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa sản phẩm không?")) {
      await dispatch(deleteProduct(id)); // Chờ xóa xong
      dispatch(fetchAdminProducts()); // Gọi lại để refresh danh sách
    }
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="text-red-500">Lỗi: {error}</p>;

  // Sắp xếp sản phẩm theo createdAt giảm dần
  const sortedProducts = [...products].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header + Add button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
        <Link
          to="/admin/products/create"
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Giá</th>
              <th className="py-3 px-4">Số lượng</th>
              <th className="py-3 px-4">Số lượng đã bán</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => (
                <tr
                  key={product._id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="p-4">
                    {product.price?.toLocaleString("vi-VN")} VND
                  </td>
                  <td className="p-4">{product.countInStock ?? 0}</td>
                  <td className="p-4">{product.totalSold ?? 0}</td>
                  <td className="p-4">{product.sku}</td>
                  <td className="p-4">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                    >
                      Chỉnh sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  Không tìm thấy sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;