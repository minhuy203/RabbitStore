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
    limit,
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
    if (limit) query.append("limit", limit);

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`
    );
    return response.data;
  }
);

export const fetchProductsDetails = createAsyncThunk(
  "products/fetchProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy chi tiết sản phẩm"
      );
    }
  }
);

export const updatedProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật sản phẩm"
      );
    }
  }
);

export const fetchSimilarProducts = createAsyncThunk(
  "products/fetchSimilarProducts",
  async ({ id }, { rejectWithValue }) => {
    try {
      console.log("Fetching similar products for ID:", id); // SỬA: Thêm log
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}`
      );
      console.log("Similar products response:", response.data); // SỬA: Thêm log
      return response.data;
    } catch (error) {
      console.error("Error fetching similar products:", error.response?.data); // SỬA: Thêm log
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy sản phẩm tương tự"
      );
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    selectedProduct: null,
    similarProducts: [],
    loading: false,
    // SỬA: Thêm trạng thái loading riêng cho similarProducts
    similarProductsLoading: false,
    error: null,
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
        state.products = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi khi lấy danh sách sản phẩm";
      })
      .addCase(fetchProductsDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductsDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatedProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatedProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        const index = state.products.findIndex(
          (product) => product._id === updatedProduct._id
        );
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
        state.selectedProduct = updatedProduct;
      })
      .addCase(updatedProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // SỬA: Cập nhật xử lý fetchSimilarProducts
      .addCase(fetchSimilarProducts.pending, (state) => {
        state.similarProductsLoading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProducts.fulfilled, (state, action) => {
        state.similarProductsLoading = false;
        // SỬA: Đảm bảo luôn là mảng
        state.similarProducts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSimilarProducts.rejected, (state, action) => {
        state.similarProductsLoading = false;
        state.error = action.payload;
        state.similarProducts = []; // SỬA: Reset thành mảng rỗng khi có lỗi
      });
  },
});

export const { setFilters, clearFilter } = productsSlice.actions;
export default productsSlice.reducer;