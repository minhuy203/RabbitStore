import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import register from "../assets/register.webp";
import { registerUser, clearError } from "../redux/slices/authSlice";
import { mergeCart } from "../redux/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, error } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  useEffect(() => {
    if (user) {
      if (cart?.products?.length > 0 && guestId) {
        dispatch(mergeCart({ guestId })).then(() => {
          navigate(isCheckoutRedirect ? "/checkout" : "/");
        });
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
    }
  }, [user, guestId, cart, navigate, isCheckoutRedirect, dispatch]);

  const validateName = (name) => {
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!name.trim()) return "Họ và tên không được để trống!";
    if (name.trim().length < 2) return "Họ và tên phải có ít nhất 2 ký tự!";
    if (!nameRegex.test(name)) return "Tên chỉ được chứa chữ cái và khoảng trắng!";
    return "";
  };

  const validatePassword = (password) => {
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (!/^[a-zA-Z0-9]+$/.test(password))
      return "Mật khẩu chỉ được chứa chữ cái và số!";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setName(value);
      setNameError(validateName(value));
    } else if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
      setPasswordError(validatePassword(value));
    }
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameValidationError = validateName(name);
    const passwordValidationError = validatePassword(password);

    if (nameValidationError || passwordValidationError || !email) {
      setNameError(nameValidationError);
      setPasswordError(passwordValidationError);
      return;
    }

    dispatch(registerUser({ name: name.trim(), email: email.toLowerCase().trim(), password }));
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
            <p className="text-3xl font-bold mt-4">Tạo tài khoản mới</p>
            <p className="text-gray-600 mt-2">Đăng ký để mua sắm nhanh hơn!</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-center">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                placeholder="Nguyễn Văn A"
              />
              {nameError ? (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Chỉ chứa chữ cái và khoảng trắng, không ký tự đặc biệt
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                placeholder="you@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dùng để đăng nhập và nhận thông báo đơn hàng
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                placeholder="••••••••"
              />
              {passwordError ? (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 6 ký tự, chỉ gồm chữ cái và số
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm font-semibold text-blue-800 mb-2">Yêu cầu bắt buộc:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
              <li>Họ tên không chứa số hoặc ký tự đặc biệt</li>
              <li>Mật khẩu từ 6 ký tự trở lên</li>
              <li>Email phải hợp lệ và chưa từng đăng ký</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition mt-8"
          >
            Đăng ký ngay
          </button>

          <p className="text-center mt-6 text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="text-blue-600 font-semibold hover:underline"
            >
              Đăng nhập tại đây
            </Link>
          </p>
        </form>
      </div>

      <div className="hidden md:block w-1/2 bg-gradient-to-br from-gray-800 to-black">
        <img
          src={register}
          alt="Đăng ký tài khoản"
          className="h-full w-full object-cover opacity-90"
        />
      </div>
    </div>
  );
};

export default Register;