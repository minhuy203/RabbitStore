import React from "react";
import { Link } from "react-router-dom";

const ProductGrid = ({ products = [], loading, error }) => {
  if (loading) {
    return <p>Đang tải...</p>;
  }

  if (error) {
    return <p className="text-red-500">Lỗi: {error}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full">
      {Array.isArray(products) && products.length > 0 ? (
        products.map((product, index) => (
          <Link key={index} to={`/product/${product._id}`} className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              {/* Ảnh sản phẩm */}
              <div className="w-full h-96 mb-4">
                <img
                  src={product.images?.[0]?.url || "/placeholder-image.jpg"}
                  alt={
                    product.images?.[0]?.altText || product.name || "Sản phẩm"
                  }
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Tên sản phẩm */}
              <h3 className="text-sm font-medium mb-2 text-gray-900 truncate">
                {product.name || "Không có tên"}
              </h3>

              {/* Giá sản phẩm */}
              <div className="flex items-center gap-2">
                {product.discountPrice ? (
                  <>
                    <span className="text-gray-400 line-through text-sm">
                      {product.price.toLocaleString("vi-VN")} VND
                    </span>
                    <span className="text-red-500 font-semibold text-base">
                      {product.discountPrice.toLocaleString("vi-VN")} VND
                    </span>
                  </>
                ) : (
                  <span className="text-gray-700 font-medium text-base">
                    {product.price.toLocaleString("vi-VN")} VND
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p>Không có sản phẩm</p>
      )}
    </div>
  );
};

export default ProductGrid;
