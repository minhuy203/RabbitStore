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
      currentGuestId = "guest_" + new Date().getTime();
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
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-10 rounded-xl shadow-lg border"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">RabbitStore</h2>
            <p className="text-3xl font-bold mt-4">Chào mừng quay lại!</p>
            <p className="text-gray-600 mt-2">Đăng nhập để tiếp tục mua sắm</p>
          </div>

          {(error || cartError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-center">
              {error || cartError}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  dispatch(clearError());
                }}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                placeholder="you@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Email bạn đã dùng để đăng ký</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  dispatch(clearError());
                }}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">Gợi ý:</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc pl-5">
              <li>Quên mật khẩu? Liên hệ admin để được hỗ trợ</li>
              <li>Đảm bảo nhập đúng email đã đăng ký</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition mt-8"
          >
            Đăng nhập
          </button>

          <p className="text-center mt-6 text-sm text-gray-600">
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

      <div className="hidden md:block w-1/2 bg-gradient-to-br from-gray-800 to-black">
        <img
          src={login}
          alt="Đăng nhập"
          className="h-full w-full object-cover opacity-90"
        />
      </div>
    </div>
  );
};

export default Login;