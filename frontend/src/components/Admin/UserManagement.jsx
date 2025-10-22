import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "../../redux/slices/adminSlice";

const UserManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { users, loading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === "admin") {
      dispatch(fetchUsers());
    }
  }, [dispatch, user]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(addUser(formData));
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "customer",
    });
  };

  const handleRoleChange = (userId, newRole) => {
    const currentUser = users.find((u) => u._id === userId);
    if (currentUser) {
      dispatch(
        updateUser({
          id: userId,
          name: currentUser.name,
          email: currentUser.email,
          role: newRole,
        })
      ).then((action) => {
        // Nếu cập nhật thành công, gọi lại fetchUsers để đồng bộ dữ liệu
        if (action.meta.requestStatus === "fulfilled") {
          dispatch(fetchUsers());
        }
      });
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Bạn có chắc muốn xóa người dùng này không?")) {
      dispatch(deleteUser(userId)).then((action) => {
        if (action.meta.requestStatus === "fulfilled") {
          dispatch(fetchUsers()); // Đồng bộ lại danh sách sau khi xóa
        }
      });
    }
  };

  // Sắp xếp người dùng theo createdAt giảm dần
  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý người dùng</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">Lỗi: {error}</p>}
      {/* add new user form */}
      <div className="p-6 rounded-lg mb-6 bg-gray-50">
        <h3 className="text-lg font-bold mb-4">Thêm người dùng mới</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Tên đầy đủ</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Vai trò</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="customer">Khách hàng</option>
              <option value="admin">Người quản trị</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Thêm người dùng
          </button>
        </form>
      </div>
      {/* user list */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full text-left text-gray-500">
          <thead className="bg-gray-100 text-xs uppercase text-gray-700">
            <tr>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Vai trò</th>
              <th className="py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers && sortedUsers.length > 0
              ? sortedUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="p-2 border rounded"
                        disabled={loading} // Vô hiệu hóa select khi đang loading
                      >
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Người quản trị</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        disabled={loading} // Vô hiệu hóa nút khi đang loading
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              : !loading && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      Không có người dùng nào hoặc đang tải dữ liệu...
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;