// src/redux/slices/adminOrderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Fetch all orders
export const fetchAllOrders = createAsyncThunk(
  "adminOrders/fetchAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Lỗi server" });
    }
  }
);

// Fetch order by ID
export const fetchOrderById = createAsyncThunk(
  "adminOrders/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Lỗi server" });
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  "adminOrders/updateOrderStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Lỗi server" });
    }
  }
);

// HỦY ĐƠN HÀNG BỞI ADMIN
export const cancelOrderByAdmin = createAsyncThunk(
  "adminOrders/cancelOrderByAdmin",
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${orderId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Hủy đơn thất bại" });
    }
  }
);

// Delete order
export const deleteOrder = createAsyncThunk(
  "adminOrders/deleteOrder",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Xóa thất bại" });
    }
  }
);

const adminOrderSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    order: null,
    totalOrders: 0,
    totalSales: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAllOrders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.totalOrders = action.payload.length;
        state.totalSales = action.payload.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Lỗi tải danh sách đơn hàng";
      })

      // fetchOrderById
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Lỗi tải chi tiết đơn hàng";
      })

      // updateOrderStatus
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.orders.findIndex((o) => o._id === updated._id);
        if (idx !== -1) state.orders[idx] = updated;
        if (state.order?._id === updated._id) state.order = updated;
      })

      // cancelOrderByAdmin
      .addCase(cancelOrderByAdmin.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelOrderByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const cancelled = action.payload.order;
        const idx = state.orders.findIndex((o) => o._id === cancelled._id);
        if (idx !== -1) state.orders[idx] = cancelled;
        if (state.order?._id === cancelled._id) state.order = cancelled;
      })
      .addCase(cancelOrderByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Hủy đơn thất bại";
      })

      // deleteOrder
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.orders = state.orders.filter((o) => o._id !== action.payload);
        state.totalOrders = state.orders.length;
        if (state.order?._id === action.payload) state.order = null;
      });
  },
});

export default adminOrderSlice.reducer;