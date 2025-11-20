// server.js / index.js

const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const adminRoutes = require("./routes/adminRoutes");
const productAdminRoutes = require("./routes/productAdminRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const productRoutes = require("./routes/productRoutes");
const vnpayRoutes = require("./routes/vnpayRoutes"); // ĐÃ CÓ VNPAY

dotenv.config();
connectDB(); // kết nối MongoDB ngay đầu

const app = express();

// ==================== CORS – SỬA ĐÚNG 100% ====================
// Cho phép frontend Vercel + localhost
const allowedOrigins = [
  "https://rabbit-store-yvxj.vercel.app",
  "https://rabbit-store-henna.vercel.app", // nếu bạn truy cập trực tiếp backend
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:9000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // cho phép request không có origin (Postman, mobile, serverless)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // nếu dùng cookie/session
  })
);

// Bắt buộc xử lý pre-flight cho tất cả route
app.options("*", cors());

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: "10mb" })); // tăng limit nếu upload ảnh
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.get("/", (req, res) => {
  res.json({ message: "WELCOME TO RABBITSTORE API – Running perfect!" });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscribeRoute);

// VNPAY ROUTE – BẮT BUỘC
app.use("/api/vnpay", vnpayRoutes);

// Admin routes
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// ==================== XUẤT CHO VERCEL SERVERLESS ====================
module.exports = app;
module.exports.handler = serverless(app); // Vercel sẽ dùng cái này

// ==================== CHẠY LOCAL (không ảnh hưởng Vercel) ====================
const PORT = process.env.PORT || 9000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `VNPAY Return URL: http://localhost:${PORT}/api/vnpay/vnpay-return`
    );
  });
}
