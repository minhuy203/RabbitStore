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
    if (name === "name") { setName(value); setNameError(validateName(value)); }
    else if (name === "email") setEmail(value);
    else if (name === "password") { setPassword(value); setPasswordError(validatePassword(value)); }
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
    dispatch(registerUser({ name: name.trim(), email: email.toLowerCase().trim(), password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="flex w-full max-w-5xl h-[680px] shadow-2xl rounded-3xl overflow-hidden bg-white">
        {/* Form bên trái */}
        <div className="w-full lg:w-96 xl:w-[420px] p-8 lg:p-10 flex flex-col justify-center bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">RabbitStore</h2>
              <p className="text-lg font-semibold mt-1 text-gray-700">Tạo tài khoản mới</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded text-center">
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
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black text-sm"
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>

            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black text-sm"
            />

            <div>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black text-sm"
              />
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
              <p className="font-semibold text-blue-800 mb-1">Yêu cầu bắt buộc:</p>
              <ul className="text-blue-700 space-y-0.5 list-disc pl-4">
                <li>Họ tên không chứa số hoặc ký tự đặc biệt</li>
                <li>Mật khẩu từ 6 ký tự trở lên</li>
                <li>Email phải hợp lệ và chưa từng đăng ký</li>
              </ul>
            </div>

            <button className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-900 transition">
              Đăng ký ngay
            </button>

            <p className="text-center text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-blue-600 font-semibold hover:underline">
                Đăng nhập tại đây
              </Link>
            </p>
          </form>
        </div>

        {/* Ảnh bên phải – cao bằng form, khít 100% */}
        <div className="hidden lg:block flex-1 relative">
          <img
            src={register}
            alt="Register"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default Register;