const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

//route get /api/admin/users
//@desc get all users (admin only)
router.get("/", protect, admin, async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "lỗi server" });
  }
});

//route post /api/admin/users
//add a new user(admin only)
router.post("/", protect, admin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
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
    res.status(500).json({ message: "lỗi server" });
  }
});

//route put /api/admin/users/:id
//update user info
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
    }
    const updatedUser = await user.save();
    res.json({ message: "Cập nhật người dùng thành công", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "lỗi server " });
  }
});

//route delete /api/admin/user/:id
//delete a user
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
    res.status(500).json({ message: "lỗi server" });
  }
});
module.exports = router;
