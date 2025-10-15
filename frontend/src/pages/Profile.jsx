import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, clearError } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";
import { updateUser } from "../redux/slices/adminSlice";
import MyOrderPage from "./MyOrderPage";

const Profile = () => {
  const { user, error: authError } = useSelector((state) => state.auth);
  const { error: adminError } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    password: "",
  });
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setFormData({
        name: user.name,
        password: "",
      });
    }
  }, [user, navigate]);

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/; // Chỉ chứa chữ cái và khoảng trắng
    if (!name) {
      return "Tên không được để trống!";
    }
    if (!nameRegex.test(name)) {
      return "Tên chỉ được chứa chữ cái và khoảng trắng!";
    }
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return ""; // Mật khẩu là tùy chọn
    }
    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự!";
    }
    const passwordRegex = /^[a-zA-Z0-9]+$/; // Chỉ chứa chữ cái và số
    if (!passwordRegex.test(password)) {
      return "Mật khẩu chỉ được chứa chữ cái và số!";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "name") {
      setNameError(validateName(value));
    } else if (name === "password") {
      setPasswordError(validatePassword(value));
    }
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    const nameValidationError = validateName(formData.name);
    const passwordValidationError = validatePassword(formData.password);

    if (nameValidationError || passwordValidationError) {
      setNameError(nameValidationError);
      setPasswordError(passwordValidationError);
      return;
    }

    dispatch(
      updateUser({
        id: user._id,
        name: formData.name,
        email: user.email,
        password: formData.password || undefined,
        role: user.role,
      })
    ).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setMessage("Cập nhật thông tin thành công!");
        setFormData((prev) => ({ ...prev, password: "" }));
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...user, name: formData.name })
        );
      } else {
        setMessage("Cập nhật thất bại. Vui lòng thử lại.");
      }
    });
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4 md:p-6 max-w-[1800px]">
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 items-start">
          <div className="w-full md:w-1/3 lg:w-1/4 shadow-md rounded-lg p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {user?.name}
            </h1>
            <p className="text-lg text-gray-600 mb-4">{user?.email}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700">Tên đầy đủ</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Nhập tên đầy đủ"
                  required
                />
                {nameError && (
                  <p className="text-red-500 text-sm">{nameError}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">
                  Mật khẩu mới (tùy chọn)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
              {message && (
                <p
                  className={`text-sm ${
                    message.includes("thành công")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}
              {authError && (
                <p className="text-red-500 text-sm">Lỗi: {authError}</p>
              )}
              {adminError && (
                <p className="text-red-500 text-sm">Lỗi: {adminError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Cập nhật thông tin
              </button>
            </form>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-4"
            >
              Đăng xuất
            </button>
          </div>
          <div className="w-full md:w-2/3 lg:w-3/4">
            <MyOrderPage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
