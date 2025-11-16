import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Lấy danh sách đơn hàng của user (có phân trang)
export const fetchUserOrders = createAsyncThunk(
  "orders/fetchUserOrders",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        return rejectWithValue("Không tìm thấy token xác thực");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/my-orders`,
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API fetchUserOrders response:", response.data);
      return response.data; // { orders: [...], pagination: { ... } }
    } catch (error) {
      console.error("Error in fetchUserOrders:", error);
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tải đơn hàng"
      );
    }
  }
);

// Lấy chi tiết đơn hàng theo ID
export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        return rejectWithValue("Không tìm thấy token xác thực");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API fetchOrderDetails response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in fetchOrderDetails:", error);
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy chi tiết đơn hàng"
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
      // Fetch user orders
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

      // Fetch order details
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
      });
  },
});

export const { resetError } = orderSlice.actions;
export default orderSlice.reducer;