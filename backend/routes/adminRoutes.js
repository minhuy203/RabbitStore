const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const router = express.Router();

// Route GET /api/admin/users
// @desc Get all users (admin only)
router.get("/", protect, admin, async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Route POST /api/admin/users
// @desc Add a new user (admin only)
router.post("/", protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res
        .status(400)
        .json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Người dùng đã tồn tại" });
    }
    user = new User({
      name,
      email,
      password,
      role: role || "khách hàng",
    });
    await user.save();
    res.status(201).json({ message: "Tạo người dùng thành công", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Route PUT /api/admin/users/:id
// @desc Update user info (admin only)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (req.body.name && !nameRegex.test(req.body.name)) {
      return res
        .status(400)
        .json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }
    user.role = req.body.role || user.role;
    const updatedUser = await user.save();
    res.json({ message: "Cập nhật người dùng thành công", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Route DELETE /api/admin/users/:id
// @desc Delete a user (admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: "Xóa người dùng thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
