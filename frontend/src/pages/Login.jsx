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
    // Đảm bảo guestId tồn tại
    let currentGuestId = guestId || localStorage.getItem("guestId");
    if (!currentGuestId) {
      currentGuestId = "guest_" + new Date().getTime();
      localStorage.setItem("guestId", currentGuestId);
    }

    if (user) {
      // Gọi mergeCart nếu có guestId và giỏ hàng không rỗng
      if (currentGuestId && cart?.products?.length > 0) {
        dispatch(mergeCart({ guestId: currentGuestId }))
          .unwrap()
          .then(() => {
            // Lấy giỏ hàng người dùng sau khi hợp nhất
            dispatch(fetchCart({ userId: user._id }))
              .unwrap()
              .then(() => {
                navigate(isCheckoutRedirect ? "/checkout" : "/");
              })
              .catch((err) => {
                console.error("Lỗi khi lấy giỏ hàng:", err);
              });
          })
          .catch((err) => {
            console.error("Lỗi khi hợp nhất giỏ hàng:", err);
            // Vẫn lấy giỏ hàng người dùng nếu hợp nhất thất bại
            dispatch(fetchCart({ userId: user._id }))
              .unwrap()
              .then(() => {
                navigate(isCheckoutRedirect ? "/checkout" : "/");
              })
              .catch((err) => {
                console.error("Lỗi khi lấy giỏ hàng:", err);
              });
          });
      } else {
        // Lấy giỏ hàng người dùng nếu không có giỏ hàng khách
        dispatch(fetchCart({ userId: user._id }))
          .unwrap()
          .then(() => {
            navigate(isCheckoutRedirect ? "/checkout" : "/");
          })
          .catch((err) => {
            console.error("Lỗi khi lấy giỏ hàng:", err);
          });
      }
    }
  }, [user, cart, guestId, navigate, isCheckoutRedirect, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex">
      <div className="w-full md:w-1/2 flex-col justify-center items-center p-8 md:p-12 flex">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-lg border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">RabbitStore</h2>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Xin chào! 👋</h2>
          <p className="text-center mb-4">
            Hãy điền email và mật khẩu để đăng nhập.
          </p>
          {error && (
            <p className="text-red-500 text-center mb-4">
              Thông tin đăng nhập không đúng!
            </p>
          )}
          {cartError && (
            <p className="text-red-500 text-center mb-4">{cartError}</p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dispatch(clearError());
              }}
              className="w-full p-2 border rounded"
              placeholder="Nhập địa chỉ email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                dispatch(clearError());
              }}
              className="w-full p-2 border rounded"
              placeholder="Nhập mật khẩu của bạn"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Đăng nhập
          </button>
          <p className="mt-6 text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-500"
            >
              Đăng ký
            </Link>
          </p>
        </form>
      </div>
      <div className="hidden md:block w-1/2 bg-gray-800">
        <div className="h-full flex flex-col justify-center items-center">
          <img
            src={login}
            alt="Đăng nhập vào tài khoản"
            className="h-[750px] w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;