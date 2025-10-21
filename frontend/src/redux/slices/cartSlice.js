import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng vào localStorage:", error.message);
  }
};

const loadCartFromStorage = () => {
  try {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : { products: [], totalPrice: 0 };
  } catch (error) {
    console.error("Lỗi khi tải giỏ hàng từ localStorage:", error.message);
    return { products: [], totalPrice: 0 };
  }
};

// Lấy giỏ hàng
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId, guestId }, { rejectWithValue }) => {
    try {
      if (!userId && !guestId) {
        throw new Error("Cần cung cấp userId hoặc guestId");
      }
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          params: { userId, guestId },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi lấy giỏ hàng"
      );
    }
  }
);

// Thêm sản phẩm vào giỏ hàng
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    {
      productId,
      quantity,
      size,
      color,
      guestId,
      userId,
      name,
      price,
      discountPrice,
      image,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!productId || !quantity || !size || !color) {
        throw new Error("Thiếu các trường bắt buộc: productId, quantity, size, color");
      }
      if (typeof quantity !== "number" || quantity <= 0) {
        throw new Error("Số lượng phải là số dương");
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          productId,
          quantity,
          size,
          color,
          guestId,
          userId,
          name,
          price,
          discountPrice,
          image,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng"
      );
    }
  }
);

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async (
    { productId, quantity, guestId, userId, size, color },
    { rejectWithValue }
  ) => {
    try {
      if (!productId || !quantity || !size || !color) {
        throw new Error("Thiếu các trường bắt buộc: productId, quantity, size, color");
      }
      if (typeof quantity !== "number" || quantity < 0) {
        throw new Error("Số lượng phải là số không âm");
      }
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          productId,
          quantity,
          guestId,
          userId,
          size,
          color,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật số lượng"
      );
    }
  }
);

// Xóa sản phẩm khỏi giỏ hàng
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ productId, guestId, userId, size, color }, { rejectWithValue }) => {
    try {
      if (!productId || !size || !color) {
        throw new Error("Thiếu các trường bắt buộc: productId, size, color");
      }
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          data: { productId, guestId, userId, size, color },
          headers: { "Content-Type": "application/json" },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi xóa sản phẩm"
      );
    }
  }
);

// Hợp nhất giỏ hàng khách với giỏ hàng người dùng
export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ guestId }, { rejectWithValue }) => {
    try {
      if (!guestId) {
        throw new Error("Thiếu guestId");
      }
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`,
        { guestId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi hợp nhất giỏ hàng"
      );
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: loadCartFromStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.cart = { products: [], totalPrice: 0 };
      localStorage.removeItem("cart");
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload || { products: [], totalPrice: 0 };
        saveCartToStorage(state.cart);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể lấy giỏ hàng";
      })
      // addToCart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload || { products: [], totalPrice: 0 };
        saveCartToStorage(state.cart);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể thêm vào giỏ hàng";
      })
      // updateCartItemQuantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload || { products: [], totalPrice: 0 };
        saveCartToStorage(state.cart);
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể cập nhật số lượng";
      })
      // removeFromCart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload || { products: [], totalPrice: 0 };
        saveCartToStorage(state.cart);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể xóa sản phẩm";
      })
      // mergeCart
      .addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload || { products: [], totalPrice: 0 };
        saveCartToStorage(state.cart);
      })
      .addCase(mergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể hợp nhất giỏ hàng";
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;