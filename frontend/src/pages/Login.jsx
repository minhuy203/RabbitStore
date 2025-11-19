import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import login from "../assets/login.webp";
import { loginUser, clearError } from "../redux/slices/authSlice";
import { fetchCart, mergeCart } from "../redux/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, error } = useSelector((state) => state.auth);
  const { cart, error: cartError } = useSelector((state) => state.cart);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  useEffect(() => {
    let currentGuestId = guestId || localStorage.getItem("guestId");
    if (!currentGuestId) {
      currentGuestId = "guest_" + Date.now();
      localStorage.setItem("guestId", currentGuestId);
    }

    if (user) {
      if (currentGuestId && cart?.products?.length > 0) {
        dispatch(mergeCart({ guestId: currentGuestId }))
          .unwrap()
          .then(() => dispatch(fetchCart({ userId: user._id })))
          .finally(() => navigate(isCheckoutRedirect ? "/checkout" : "/"));
      } else {
        dispatch(fetchCart({ userId: user._id })).finally(() =>
          navigate(isCheckoutRedirect ? "/checkout" : "/")
        );
      }
    }
  }, [user, cart, guestId, navigate, isCheckoutRedirect, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(loginUser({ email: email.toLowerCase().trim(), password }));
  };

  return (
    <div className="flex min-h-screen">
      {/* Form - Gọn đẹp */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-5 bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl border p-8 space-y-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">RabbitStore</h2>
            <p className="text-2xl font-bold mt-3">Chào mừng quay lại!</p>
          </div>

          {(error || cartError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg text-center">
              {error || cartError}
            </div>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
            className="w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
            placeholder="Email của bạn"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
            className="w-full px-4 py-3.5 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
            placeholder="Mật khẩu"
            required
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3.5 rounded-lg font-bold hover:bg-gray-900 transition"
          >
            Đăng nhập
          </button>

          <p className="text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-600 font-semibold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>

      {/* Hình nền */}
      <div className="hidden md:block w-1/2 relative overflow5-hidden">
        <img
          src={login}
          alt="Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </div>
  );
};

export default Login;