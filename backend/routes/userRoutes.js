const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const router = express.Router();

// @route POST /api/users/register
// @desc Register a new user
// @access Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
      return res
        .status(400)
        .json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
    }

    // Validate password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu chỉ được chứa chữ cái và số" });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Người dùng đã tồn tại" });
    }

    // Create new user
    user = new User({ name, email, password });
    await user.save();

    // Create JWT payload
    const payload = { user: { id: user._id, role: user.role } };

    // Sign and return the token along with user data
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
      (err, token) => {
        if (err) {
          console.error("JWT sign error:", err);
          throw err;
        }
        res.status(201).json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        });
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// @route POST /api/users/login
// @desc Authenticate user
// @access Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không đúng!" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không đúng!" });
    }

    // Create JWT payload
    const payload = { user: { id: user._id, role: user.role } };

    // Sign and return the token along with user data
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
      (err, token) => {
        if (err) {
          console.error("JWT sign error:", err);
          throw err;
        }
        res.json({
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// @route GET /api/users/profile
// @desc Get logged-in user's profile
// @access Private
router.get("/profile", protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// @route POST /api/users/verify-password
// @desc Verify old password
// @access Private
router.post("/verify-password", protect, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp email và mật khẩu" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ valid: false, message: "Mật khẩu không đúng" });
    }
    res.json({ valid: true });
  } catch (error) {
    console.error("Verify-password error:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// @route PUT /api/users/profile
// @desc Update current user's profile
// @access Private
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Validate name if provided
    if (req.body.name) {
      const nameRegex = /^[a-zA-Z\s]+$/;
      if (!nameRegex.test(req.body.name)) {
        return res
          .status(400)
          .json({ message: "Tên chỉ được chứa chữ cái và khoảng trắng" });
      }
      user.name = req.body.name;
    }

    // Validate and hash password if provided
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res
          .status(400)
          .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
      }
      const passwordRegex = /^[a-zA-Z0-9]+$/;
      if (!passwordRegex.test(req.body.password)) {
        return res
          .status(400)
          .json({ message: "Mật khẩu chỉ được chứa chữ cái và số" });
      }
      user.password = req.body.password; // Mongoose middleware sẽ tự động băm
    }

    // Update email if provided
    if (req.body.email) {
      user.email = req.body.email;
    }

    // Save updated user
    const updatedUser = await user.save();
    res.json({ message: "Cập nhật thông tin thành công", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});
module.exports = router;
