import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, clearError, updateProfile } from "../redux/slices/authSlice";
import { clearCart } from "../redux/slices/cartSlice";
import axios from "axios";
import MyOrderPage from "./MyOrderPage";

const Profile = () => {
  const { user, error: authError } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [nameError, setNameError] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setFormData({
        name: user.name,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user, navigate]);

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name) {
      return "Tên không được để trống!";
    }
    if (!nameRegex.test(name)) {
      return "Tên chỉ được chứa chữ cái và khoảng trắng!";
    }
    return "";
  };

  const validateNewPassword = (password) => {
    if (password) {
      if (password.length < 6) {
        return "Mật khẩu mới phải có ít nhất 6 ký tự!";
      }
      const passwordRegex = /^[a-zA-Z0-9]+$/;
      if (!passwordRegex.test(password)) {
        return "Mật khẩu mới chỉ được chứa chữ cái và số!";
      }
    }
    return "";
  };

  const validateConfirmPassword = (newPassword, confirmPassword) => {
    if (newPassword && !confirmPassword) {
      return "Xác nhận mật khẩu không được để trống!";
    }
    if (newPassword !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp!";
    }
    return "";
  };

  const verifyOldPassword = async (email, oldPassword) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/verify-password`,
        { email, password: oldPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      return response.data.valid;
    } catch (error) {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "name") {
      setNameError(validateName(value));
    } else if (name === "oldPassword") {
      setOldPasswordError("");
    } else if (name === "newPassword") {
      setNewPasswordError(validateNewPassword(value));
      setConfirmPasswordError(
        validateConfirmPassword(value, formData.confirmPassword)
      );
    } else if (name === "confirmPassword") {
      setConfirmPasswordError(
        validateConfirmPassword(formData.newPassword, value)
      );
    }
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const nameValidationError = validateName(formData.name);
    const newPasswordValidationError = validateNewPassword(
      formData.newPassword
    );
    const confirmPasswordValidationError = validateConfirmPassword(
      formData.newPassword,
      formData.confirmPassword
    );

    if (
      nameValidationError ||
      newPasswordValidationError ||
      confirmPasswordValidationError
    ) {
      setNameError(nameValidationError);
      setNewPasswordError(newPasswordValidationError);
      setConfirmPasswordError(confirmPasswordValidationError);
      return;
    }

    // Chỉ kiểm tra mật khẩu cũ nếu người dùng muốn thay đổi mật khẩu
    if (formData.newPassword) {
      const isOldPasswordValid = await verifyOldPassword(
        user.email,
        formData.oldPassword
      );
      if (!isOldPasswordValid) {
        setOldPasswordError("Mật khẩu cũ không đúng!");
        return;
      }
    }

    // Chuẩn bị dữ liệu để gửi
    const updateData = {
      name: formData.name,
      email: user.email,
    };
    if (formData.newPassword) {
      updateData.password = formData.newPassword;
    }

    dispatch(updateProfile(updateData)).then((action) => {
      if (action.meta.requestStatus === "fulfilled") {
        setMessage("Cập nhật thông tin thành công!");
        setFormData({
          name: action.payload.name,
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage(
          action.payload?.message || "Cập nhật thất bại. Vui lòng thử lại."
        );
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
                <label className="block text-gray-700">Mật khẩu cũ</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Nhập mật khẩu cũ"
                  required={formData.newPassword !== ""} // Chỉ bắt buộc khi có mật khẩu mới
                />
                {oldPasswordError && (
                  <p className="text-red-500 text-sm">{oldPasswordError}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Nhập mật khẩu mới"
                />
                {newPasswordError && (
                  <p className="text-red-500 text-sm">{newPasswordError}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Xác nhận mật khẩu mới"
                  required={formData.newPassword !== ""} // Chỉ bắt buộc khi có mật khẩu mới
                />
                {confirmPasswordError && (
                  <p className="text-red-500 text-sm">{confirmPasswordError}</p>
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
