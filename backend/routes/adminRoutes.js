const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const router = express.Router();

// @desc    Lấy danh sách tất cả người dùng (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password"); // Không trả password
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
});

// @desc    Admin tạo người dùng mới
// @route   POST /api/admin/users
// @access  Private/Admin
router.post("/", protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // === 1. VALIDATION TÊN ===
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Họ và tên phải có ít nhất 2 ký tự" });
    }
    const nameRegex = /^[\p{L}\s]+$/u; // Chỉ chữ cái + khoảng trắng (hỗ trợ tiếng Việt, Unicode)
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
    }

    // === 2. VALIDATION EMAIL ===
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email không được để trống" });
    }
    const emailLower = email.toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(emailLower)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    // Kiểm tra email đã tồn tại chưa (không phân biệt hoa thường)
    const existingUser = await User.findOne({ 
      email: { $regex: `^${emailLower}$`, $options: "i" } 
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    // === 3. VALIDATION MẬT KHẨU ===
    if (!password) {
      return res.status(400).json({ message: "Mật khẩu không được để trống" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return res.status(400).json({ message: "Mật khẩu chỉ được chứa chữ cái và số" });
    }

    // === 4. TẠO NGƯỜI DÙNG ===
    const user = new User({
      name: name.trim(),
      email: emailLower,
      password, // Mongoose pre-save sẽ tự hash
      role: role === "admin" ? "admin" : "customer", // Chỉ nhận 2 giá trị
    });

    await user.save();

    // Trả về thông tin (không có password)
    res.status(201).json({
      message: "Tạo người dùng thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Lỗi server khi tạo người dùng" });
  }
});

// @desc    Cập nhật người dùng (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const { name, email, password, role } = req.body;

    // Nếu sửa tên → validate
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Tên phải có ít nhất 2 ký tự" });
      }
      if (!/^[\p{L}\s]+$/u.test(name.trim())) {
        return res.status(400).json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
      }
      user.name = name.trim();
    }

    // Nếu sửa email → kiểm tra trùng (trừ chính nó)
    if (email !== undefined) {
      const emailLower = email.toLowerCase().trim();
      if (!/^\S+@\S+\.\S+$/.test(emailLower)) {
        return res.status(400).json({ message: "Email không hợp lệ" });
      }
      const existing = await User.findOne({
        email: { $regex: `^${emailLower}$`, $options: "i" },
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(400).json({ message: "Email này đã được sử dụng bởi tài khoản khác" });
      }
      user.email = emailLower;
    }

    // Nếu có password mới → validate + hash
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
      }
      if (!/^[a-zA-Z0-9]+$/.test(password)) {
        return res.status(400).json({ message: "Mật khẩu chỉ được chứa chữ cái và số" });
      }
      user.password = password; // pre-save sẽ hash
    }

    // Cập nhật role
    if (role) {
      user.role = role === "admin" ? "admin" : "customer";
    }

    const updatedUser = await user.save();

    res.json({
      message: "Cập nhật người dùng thành công",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật người dùng" });
  }
});

// @desc    Xóa người dùng
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Không cho xóa chính mình (tùy chọn, nên có)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Không thể tự xóa tài khoản của chính mình" });
    }

    await user.deleteOne();
    res.json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Lỗi server khi xóa người dùng" });
  }
});

module.exports = router;