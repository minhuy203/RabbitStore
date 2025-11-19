import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "../../redux/slices/adminSlice";
import Pagination from "../Common/Pagination";

// Component thông báo
const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div
        className={`px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 text-white font-medium ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600"
            : type === "error"
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : "bg-gradient-to-r from-blue-500 to-indigo-600"
        }`}
      >
        <span>{type === "success" ? "Check" : type === "error" ? "Warning" : "Info"}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:opacity-70">
          X
        </button>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { users, loading } = useSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = "success") => {
    const message =
      typeof msg === "object" && msg !== null
        ? msg.message || JSON.stringify(msg)
        : String(msg || "Đã xảy ra lỗi");
    setNotification({ message, type });
  };

  const closeNotification = () => setNotification(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchUsers());
    }
  }, [user, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameRegex = /^[\p{L}\s]+$/u;
    const passwordRegex = /^[a-zA-Z0-9]+$/;

    if (!formData.name.trim()) return showNotification("Họ và tên không được để trống!", "error");
    if (formData.name.trim().length < 2) return showNotification("Tên phải ≥ 2 ký tự!", "error");
    if (!nameRegex.test(formData.name.trim())) return showNotification("Tên chỉ chứa chữ cái và khoảng trắng!", "error");

    if (!formData.email.trim()) return showNotification("Email không được để trống!", "error");
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) return showNotification("Email không hợp lệ!", "error");

    if (!formData.password) return showNotification("Mật khẩu không được để trống!", "error");
    if (formData.password.length < 6) return showNotification("Mật khẩu phải ≥ 6 ký tự!", "error");
    if (!passwordRegex.test(formData.password)) return showNotification("Mật khẩu chỉ được chứa chữ cái và số!", "error");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      role: formData.role,
    };

    const result = await dispatch(addUser(payload));

    if (addUser.fulfilled.match(result)) {
      showNotification(`Đã thêm "${payload.name}" thành công!`);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      dispatch(fetchUsers());
    } else {
      showNotification(result.payload || "Thêm người dùng thất bại!", "error");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find((u) => u._id === userId);
    if (!targetUser || targetUser.role === newRole) return;

    const result = await dispatch(
      updateUser({
        id: userId,
        name: targetUser.name,
        email: targetUser.email,
        role: newRole,
      })
    );

    if (updateUser.fulfilled.match(result)) {
      const roleText = newRole === "admin" ? "Quản trị viên" : "Khách hàng";
      showNotification(`${targetUser.name} → ${roleText}`);
    } else {
      showNotification(result.payload || "Cập nhật thất bại!", "error");
    }
  };

  const handleDeleteUser = (userId) => {
    const targetUser = users.find((u) => u._id === userId);
    if (!targetUser) return;

    if (window.confirm(`Xóa "${targetUser.name}"? Hành động không thể hoàn tác!`)) {
      dispatch(deleteUser(userId)).then((action) => {
        if (deleteUser.fulfilled.match(action)) {
          showNotification(`Đã xóa "${targetUser.name}"`);
          dispatch(fetchUsers());
        } else {
          showNotification(action.payload || "Xóa thất bại!", "error");
        }
      });
    }
  };

  // Phân trang
  const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Quản lý người dùng
      </h2>

      {/* FORM THÊM NGƯỜI DÙNG - 1 CỘT, SIÊU GỌN, CÓ GỢI Ý */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Thêm người dùng mới</h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Họ và tên *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 font-medium"
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Chỉ chữ cái và khoảng trắng, ≥ 2 ký tự</p>
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 font-medium"
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">Email phải hợp lệ và chưa tồn tại</p>
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mật khẩu *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 font-medium"
            />
            <p className="text-xs text-gray-500 mt-1 ml-1">≥ 6 ký tự, chỉ chứa chữ cái và số</p>
          </div>

          <div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 font-medium bg-white"
            >
              <option value="customer">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 ml-1">Chọn vai trò cho tài khoản mới</p>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-70 shadow-md"
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản mới"}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ name: "", email: "", password: "", role: "customer" })}
              className="px-6 py-3.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Xóa form
            </button>
          </div>
        </form>
      </div>

      {/* BẢNG DANH SÁCH NGƯỜI DÙNG */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold">Họ tên</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Email</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Vai trò</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Ngày tạo</th>
                <th className="py-4 px-6 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : currentUsers.length > 0 ? (
                currentUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-medium">{u.name}</td>
                    <td className="py-4 px-6 text-gray-600">{u.email}</td>
                    <td className="py-4 px-6">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm border ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : "bg-green-100 text-green-800 border-green-300"
                        }`}
                        disabled={loading}
                      >
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition text-sm font-medium"
                        disabled={loading}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500 text-lg">
                    Chưa có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Animation thông báo
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.4s ease-out;
  }
`;
document.head.appendChild(style);

export default UserManagement;