import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
      <div className="container mx-auto max-w-[800px] py-6">
        <h2 className="text-2xl text-center font-bold mb-3">Bán Chạy Nhất</h2>
        <ProductGrid
          products={topSellers}
          loading={topSellersLoading}
          error={topSellersError}
          gridClass="grid-cols-3 gap-2 justify-items-center"
        />
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