import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Lấy danh sách sản phẩm
export const fetchAdminProducts = createAsyncThunk(
  "adminProducts/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const USER_TOKEN = localStorage.getItem("userToken") ? `Bearer ${localStorage.getItem("userToken")}` : null;
      if (!USER_TOKEN) {
        return rejectWithValue("Không có token");
      }
      const response = await axios.get(`${API_URL}/api/admin/products`, {
        headers: {
          Authorization: USER_TOKEN,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Fetch products error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Tạo sản phẩm mới
export const createProduct = createAsyncThunk(
  "adminProducts/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const USER_TOKEN = localStorage.getItem("userToken") ? `Bearer ${localStorage.getItem("userToken")}` : null;
      if (!USER_TOKEN) {
        return rejectWithValue("Không có token");
      }
      const response = await axios.post(
        `${API_URL}/api/admin/products`,
        productData,
        {
          headers: {
            Authorization: USER_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Create product error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Cập nhật sản phẩm
export const updateProduct = createAsyncThunk(
  "adminProducts/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const USER_TOKEN = localStorage.getItem("userToken") ? `Bearer ${localStorage.getItem("userToken")}` : null;
      if (!USER_TOKEN) {
        return rejectWithValue("Không có token");
      }
      const response = await axios.put(
        `${API_URL}/api/admin/products/${id}`,
        productData,
        {
          headers: {
            Authorization: USER_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update product error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Xóa sản phẩm
export const deleteProduct = createAsyncThunk(
  "adminProducts/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const USER_TOKEN = localStorage.getItem("userToken") ? `Bearer ${localStorage.getItem("userToken")}` : null;
      if (!USER_TOKEN) {
        return rejectWithValue("Không có token");
      }
      await axios.delete(`${API_URL}/api/admin/products/${id}`, {
        headers: {
          Authorization: USER_TOKEN,
          "Content-Type": "application/json",
        },
      });
      return id;
    } catch (error) {
      console.error("Delete product error:", error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const adminProductSlice = createSlice({
  name: "adminProducts",
  initialState: {
    products: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.push(action.payload);
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex(
          (product) => product._id === action.payload._id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(
          (product) => product._id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminProductSlice.reducer;