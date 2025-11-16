// src/redux/slices/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Lấy danh sách đơn hàng
export const fetchUserOrders = createAsyncThunk(
  "orders/fetchUserOrders",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue("Không tìm thấy token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/my-orders`,
        {
          params: { page, limit },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi tải đơn hàng"
      );
    }
  }
);

// Lấy chi tiết đơn hàng
export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue("Không tìm thấy token");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi lấy chi tiết"
      );
    }
  }
);

// HỦY ĐƠN HÀNG
export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue("Không tìm thấy token");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/cancel`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Hủy đơn thất bại"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    orderDetails: null,
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalOrders: 0,
    },
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserOrders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload.orders)
          ? action.payload.orders
          : [];
        state.pagination = {
          currentPage: action.payload.pagination?.currentPage || 1,
          totalPages: action.payload.pagination?.totalPages || 1,
          totalOrders: action.payload.pagination?.totalOrders || 0,
        };
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchOrderDetails
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // cancelOrder
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        if (state.orderDetails?._id === action.payload.order._id) {
          state.orderDetails = action.payload.order;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetError } = orderSlice.actions;
export default orderSlice.reducer;
