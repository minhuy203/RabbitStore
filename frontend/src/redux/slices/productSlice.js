// src/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchProductsByFilters = createAsyncThunk(
  "products/fetchByFilters",
  async ({
    collection,
    size,
    color,
    gender,
    minPrice,
    maxPrice,
    sortBy,
    search,
    category,
    material,
    brand,
    limit = 12,
    page = 1,
  }) => {
    const query = new URLSearchParams();
    if (collection && collection !== "all")
      query.append("collection", collection);
    if (size) query.append("size", Array.isArray(size) ? size.join(",") : size);
    if (color)
      query.append("color", Array.isArray(color) ? color.join(",") : color);
    if (gender) query.append("gender", gender);
    if (minPrice) query.append("minPrice", minPrice);
    if (maxPrice) query.append("maxPrice", maxPrice);
    if (sortBy) query.append("sortBy", sortBy);
    if (search) query.append("search", search);
    if (category && category !== "all") query.append("category", category);
    if (material)
      query.append(
        "material",
        Array.isArray(material) ? material.join(",") : material
      );
    if (brand)
      query.append("brand", Array.isArray(brand) ? brand.join(",") : brand);

    // Thêm phân trang
    query.append("limit", limit);
    query.append("page", page);

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`
    );
    return response.data; // { products: [], totalPages, currentPage, totalProducts }
  }
);

// ... các async thunk khác giữ nguyên ...

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    loading: false,
    similarProductsLoading: false,
    error: null,

    // Thêm phân trang
    totalPages: 1,
    currentPage: 1,
    totalProducts: 0,

    filters: {
      category: "",
      size: [],
      color: [],
      gender: "",
      brand: [],
      minPrice: 0,
      maxPrice: 10000000,
      sortBy: "",
      search: "",
      material: [],
      collection: "",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilter: (state) => {
      state.filters = {
        category: "",
        size: [],
        color: [],
        gender: "",
        brand: [],
        minPrice: 0,
        maxPrice: 10000000,
        sortBy: "",
        search: "",
        material: [],
        collection: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.products = Array.isArray(action.payload.products)
          ? action.payload.products
          : [];
        state.totalPages = action.payload.totalPages || 1;
        state.currentPage = action.payload.currentPage || 1;
        state.totalProducts = action.payload.totalProducts || 0;
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi lấy danh sách sản phẩm";
        state.products = [];
        state.totalPages = 1;
        state.currentPage = 1;
      })

      // ... các case khác giữ nguyên ...

      .addCase(fetchSimilarProducts.pending, (state) => {
        state.similarProductsLoading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.similarProductsLoading = false;
        state.similarProducts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.similarProductsLoading = false;
        state.error = action.payload;
        state.similarProducts = [];
      });
  },
});

export const { setFilters, clearFilter } = productsSlice.actions;
export default productsSlice.reducer;