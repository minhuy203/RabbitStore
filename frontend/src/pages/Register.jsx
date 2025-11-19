import React, { useState, useEffect } from "react";
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

  const validateName = (val) => {
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!val.trim()) return "Họ và tên không được để trống!";
    if (val.trim().length < 2) return "Họ và tên phải có ít nhất 2 ký tự!";
    if (!nameRegex.test(val)) return "Tên chỉ được chứa chữ cái và khoảng trắng!";
    return "";
  };

  const validatePassword = (val) => {
    if (val.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự!";
    if (!/^[a-zA-Z0-9]+$/.test(val)) return "Mật khẩu chỉ được chứa chữ cái và số!";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setName(value);
      setNameError(validateName(value));
    } else if (name === "email") setEmail(value);
    else if (name === "password") {
      setPassword(value);
      setPasswordError(validatePassword(value));
    }
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameErr = validateName(name);
    const passErr = validatePassword(password);

    if (nameErr || passErr || !email.includes("@")) {
      setNameError(nameErr);
      setPasswordError(passErr);
      return;
    }

    dispatch(registerUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    }));
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border p-7 space-y-4"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">RabbitStore</h2>
            <p className="text-2xl font-bold mt-2">Tạo tài khoản mới</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              placeholder="Họ và tên"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>

          <input
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
          />

          <div>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-sm"
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>

          {/* Giữ nguyên hộp gợi ý màu xanh */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
            <p className="font-semibold text-blue-800 mb-1">Yêu cầu bắt buộc:</p>
            <ul className="text-blue-700 space-y-0.5 list-disc pl-4">
              <li>Họ tên không chứa số hoặc ký tự đặc biệt</li>
              <li>Mật khẩu từ 6 ký tự trở lên</li>
              <li>Email phải hợp lệ và chưa từng đăng ký</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3.5 rounded-lg font-bold hover:bg-gray-900 transition"
          >
            Đăng ký ngay
          </button>

          <p className="text-center text-sm text-gray-600 -mt-2">
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

      <div className="hidden md:block w-1/2 relative overflow-hidden">
        <img src={register} alt="Register" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    </div>
  );
};

export default Register;