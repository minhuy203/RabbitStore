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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { users, loading, error } = useSelector((state) => state.admin);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

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

    // Validate cơ bản
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    const result = await dispatch(addUser(formData));

    if (addUser.fulfilled.match(result)) {
      toast.success(`Thêm người dùng "${formData.name}" thành công!`);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      dispatch(fetchUsers());
    } else {
      toast.error(result.payload || "Thêm người dùng thất bại!");
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
      toast.success(`${targetUser.name} → Đã chuyển thành ${roleText}`);
    } else {
      toast.error("Cập nhật vai trò thất bại!");
    }
  };

  const handleDeleteUser = (userId) => {
    const targetUser = users.find((u) => u._id === userId);
    if (!targetUser) return;

    if (window.confirm(`Xóa người dùng "${targetUser.name}"?\nHành động này không thể hoàn tác!`)) {
      dispatch(deleteUser(userId)).then((action) => {
        if (deleteUser.fulfilled.match(action)) {
          toast.success(`Đã xóa "${targetUser.name}" thành công!`);
          dispatch(fetchUsers());
        } else {
          toast.error("Xóa người dùng thất bại!");
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
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Quản lý người dùng</h2>

      {/* Form thêm người dùng mới - ĐÚNG NHƯ BẠN YÊU CẦU */}
      <div className="p-8 rounded-xl mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border shadow-lg">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Thêm người dùng mới</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="Nguyễn Thị C"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Không chứa số hoặc ký tự đặc biệt</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="admin@rabbitstore.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Email phải chưa tồn tại trong hệ thống</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="Tối thiểu 6 ký tự"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Chỉ chứa chữ cái và số, ≥ 6 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            >
              <option value="customer">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-indigo-800 mb-2">Lưu ý quan trọng:</p>
            <ul className="text-xs text-indigo-700 space-y-1 list-disc pl-5">
              <li>Tên không được chứa số, ký tự đặc biệt</li>
              <li>Mật khẩu từ 6 ký tự, chỉ gồm chữ và số</li>
              <li>Email phải là duy nhất trong hệ thống</li>
              <li>Tài khoản Admin có toàn quyền quản lý</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md disabled:opacity-70"
          >
            {loading ? "Đang tạo..." : "Tạo tài khoản mới"}
          </button>
        </form>
      </div>

      {/* Bảng danh sách người dùng */}
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
                  <td colSpan="5" className="text-center py-10 text-gray-500">
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

export default UserManagement;