import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import loginImg from "../assets/login.webp";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="flex w-full max-w-4xl shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Form bên trái - mỏng hơn, cao hơn */}
        <div className="w-full lg:w-[420px] p-10 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">RabbitStore</h2>
              <p className="text-lg font-semibold mt-1 text-gray-700">Chào mừng quay lại!</p>
            </div>

            {(error || cartError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded text-center">
                {error || cartError}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black text-sm"
              placeholder="you@example.com"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); dispatch(clearError()); }}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black text-sm"
              placeholder="••••••••"
              required
            />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
              <p className="font-semibold text-amber-800 mb-1">Gợi ý:</p>
              <ul className="text-amber-700 space-y-0.5 list-disc pl-4">
                <li>Quên mật khẩu? Liên hệ admin để được hỗ trợ</li>
                <li>Đảm bảo nhập đúng email đã đăng ký</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-900 transition"
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

        {/* Ảnh bên phải - cao hơn form, đẹp lung linh */}
        <div className="hidden lg:block relative min-h-[620px]">
          <img
            src={loginImg}
            alt="Login"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Login;