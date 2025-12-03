import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Hero from "../components/Layout/Hero";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductGrid from "../components/Products/ProductGrid";
import FeaturedCollection from "../components/Products/FeaturedCollection";
import FeaturesSection from "../components/Products/FeaturesSection";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import axios from "axios";

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [topSellers, setTopSellers] = useState([]);
  const [topSellersLoading, setTopSellersLoading] = useState(false);
  const [topSellersError, setTopSellersError] = useState(null);

  useEffect(() => {
    // Fetch products for a specific collection
    dispatch(
      fetchProductsByFilters({
        gender: "Nữ",
        category: "Phần Trên",
        limit: 8,
      })
    );

    // Fetch top 3 best-selling products
    const fetchTopSellers = async () => {
      setTopSellersLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/top-sellers?limit=3`
        );
        setTopSellers(response.data);
      } catch (error) {
        setTopSellersError(
          error.response?.data?.message || "Lỗi khi tải sản phẩm bán chạy"
        );
      } finally {
        setTopSellersLoading(false);
      }
    };
    fetchTopSellers();
  }, [dispatch]);

  return (
    <div>
      <Hero />
      <GenderCollectionSection />
      <NewArrivals />

      {/* Best Sellers */}
      <div className="container mx-auto max-w-[1000px] py-6">
        <h2 className="text-2xl text-center font-bold mb-3">Bán Chạy Nhất</h2>
        {topSellersLoading ? (
          <p className="text-center">Đang tải...</p>
        ) : topSellersError ? (
          <p className="text-red-500 text-center">Lỗi: {topSellersError}</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 justify-items-center">
            {Array.isArray(topSellers) && topSellers.length > 0 ? (
              topSellers.map((product, index) => (
                <Link
                  key={index}
                  to={`/product/${product._id}`}
                  className="block w-full max-w-[300px]"
                >
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                    {/* Ảnh sản phẩm */}
                    <div className="w-full h-80 mb-4">
                      <img
                        src={
                          product.images?.[0]?.url || "/placeholder-image.jpg"
                        }
                        alt={
                          product.images?.[0]?.altText ||
                          product.name ||
                          "Sản phẩm"
                        }
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Tên sản phẩm */}
                    <h3 className="text-base font-medium mb-2 text-gray-900 truncate">
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
              <p className="text-center col-span-3">Không có sản phẩm</p>
            )}
          </div>
        )}
      </div>

      {/* Women's Top Clothing */}
      <div className="container mx-auto max-w-[1800px] py-6">
        <h2 className="text-2xl text-center font-bold mb-4">
          Trang phục phần trên dành cho nữ
        </h2>
        <ProductGrid products={products} loading={loading} error={error} />
      </div>
      <FeaturedCollection />
      <FeaturesSection />
    </div>
  );
};

export default Home;
