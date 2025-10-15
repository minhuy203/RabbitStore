import React, { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOption from "../components/Products/SortOption";
import ProductGrid from "../components/Products/ProductGrid";
import { useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";

const CollectionPage = () => {
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  const sidebarRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const queryParams = Object.fromEntries([...searchParams]);
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClickOutside = (e) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(e.target) &&
      filterButtonRef.current &&
      !filterButtonRef.current.contains(e.target)
    ) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-y-auto">
      {/* Mobile filter button */}
      <button
        ref={filterButtonRef}
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 border p-2 flex justify-center items-center bg-white shadow-md rounded-md"
      >
        <FaFilter className="mr-2" /> Bộ lọc
      </button>

      {/* Filter sidebar */}
      <div
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 w-64 min-w-[16rem] bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:w-64 lg:min-w-[16rem] lg:h-screen lg:translate-x-0`}
      >
        <FilterSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 p-2 lg:p-4 lg:ml-64 lg:pl-2 max-w-full overflow-x-hidden">
        <h2 className="text-2xl uppercase font-medium mb-4">
          Tất cả bộ sưu tập
        </h2>

        {/* Sort option */}
        <SortOption />

        {/* Product grid */}
        <ProductGrid products={products} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default CollectionPage;