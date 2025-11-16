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
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error, pagination } = useSelector(
    (state) => state.products
  );

  const sidebarRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const currentPage = parseInt(searchParams.get("page")) || 1;

  useEffect(() => {
    const queryParams = Object.fromEntries([...searchParams]);
    const page = parseInt(queryParams.page) || 1;

    dispatch(
      fetchProductsByFilters({
        collection,
        ...queryParams,
        page,
        limit: 12,
      })
    );
  }, [dispatch, collection, searchParams]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleClickOutside = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page);
    setSearchParams(newParams);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Mobile filter button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden border p-2 flex justify-center items-center mb-4"
      >
        <FaFilter className="mr-2" /> Bộ lọc
      </button>

      {/* Filter Sidebar */}
      <div
        ref={sidebarRef}
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 z-50 left-0 w-64 bg-white overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0`}
      >
        <FilterSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4">
        {/* TIÊU ĐỀ CỐ ĐỊNH */}
        <h2 className="text-2xl uppercase font-medium mb-4">BỘ SƯU TẬP</h2>

        <SortOption />

        <ProductGrid products={products} loading={loading} error={error} />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className={`px-4 py-2 border rounded ${
                !pagination.hasPrev
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Trước
            </button>

            <div className="flex space-x-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.currentPage - 1 &&
                    pageNum <= pagination.currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        pagination.currentPage === pageNum
                          ? "bg-black text-white"
                          : "bg-white border hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === pagination.currentPage - 2 &&
                    pagination.currentPage > 3) ||
                  (pageNum === pagination.currentPage + 2 &&
                    pagination.currentPage < pagination.totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => goToPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className={`px-4 py-2 border rounded ${
                !pagination.hasNext
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Sau
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Hiển thị {(currentPage - 1) * 12 + 1} -{" "}
          {Math.min(currentPage * 12, pagination.totalProducts)} trong tổng số{" "}
          {pagination.totalProducts} sản phẩm
        </p>
      </div>
    </div>
  );
};

export default CollectionPage;
