import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PayPalButton from "./PayPalButton";
import { useDispatch, useSelector } from "react-redux";
import { createCheckout } from "../../redux/slices/checkoutSlice";
import axios from "axios";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [checkoutId, setCheckoutId] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false); // New state to control button visibility
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    phone: "",
  });
  const [phoneError, setPhoneError] = useState("");

  // Regex kiểm tra số điện thoại: đúng 10 chữ số
  const phoneRegex = /^\d{10}$/;

  const validatePhone = (phone) => {
    if (!phone) {
      return "Vui lòng nhập số điện thoại";
    }
    if (!phoneRegex.test(phone)) {
      return "Số điện thoại phải có đúng 10 chữ số";
    }
    return "";
  };

  useEffect(() => {
    if (
      !cart ||
      !cart.products ||
      !Array.isArray(cart.products) ||
      cart.products.length === 0
    ) {
      alert(
        "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán."
      );
      navigate("/");
    } else {
      console.log("Cart data:", cart);
    }
  }, [cart, navigate]);

  const handleCreateCheckout = async (
    e,
    paymentMethod,
    paymentStatus = "unpaid"
  ) => {
    e.preventDefault();
    const phoneValidationError = validatePhone(shippingAddress.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    setPhoneError("");

    if (!localStorage.getItem("userToken")) {
      alert("Bạn cần đăng nhập để thực hiện thanh toán.");
      navigate("/login");
      return;
    }

    if (
      !cart ||
      !cart.products ||
      !Array.isArray(cart.products) ||
      cart.products.length === 0
    ) {
      alert(
        "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán."
      );
      navigate("/");
      return;
    }

    const checkoutItems = cart.products.map((product) => ({
      productId: product.productId || product._id,
      name: product.name,
      price: product.price,
      size: product.size,
      color: product.color,
      image: product.image,
      quantity: product.quantity || 1,
      discountPrice: product.discountPrice || null,
    }));

    const payload = {
      checkoutItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      totalPrice: cart.totalPrice,
    };

    console.log("Checkout payload:", payload);

    try {
      const res = await dispatch(createCheckout(payload)).unwrap();
      if (res && res._id) {
        setCheckoutId(res._id);
        setShowPaymentOptions(true); // Show payment options after successful checkout creation
        return res._id;
      } else {
        throw new Error("Không nhận được checkoutId từ phản hồi API");
      }
    } catch (err) {
      console.error("Lỗi khi tạo checkout:", err);
      const errorMessage = err.message || err || "Vui lòng thử lại.";
      alert(`Có lỗi xảy ra khi tạo đơn hàng: ${errorMessage}`);
    }
  };

  const handlePaymentSuccess = async (details) => {
    try {
      const checkoutId = await handleCreateCheckout(
        { preventDefault: () => {} },
        "PayPal",
        "paid"
      );

      if (!checkoutId) {
        throw new Error("Không thể tạo checkout cho PayPal");
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/checkout/${checkoutId}/pay`,
        { paymentStatus: "paid", paymentDetails: details, checkoutId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      if (response.status === 200) {
        await handleFinalizeCheckout(checkoutId, "PayPal");
      } else {
        throw new Error("Phản hồi API không thành công");
      }
    } catch (error) {
      console.error("Lỗi thanh toán PayPal:", error);
      alert("Thanh toán PayPal thất bại: " + error.message);
    }
  };

  const handleCODPayment = async () => {
    try {
      const checkoutId = await handleCreateCheckout(
        { preventDefault: () => {} },
        "COD",
        "unpaid"
      );

      if (!checkoutId) {
        throw new Error("Không thể tạo checkout cho COD");
      }

      console.log("Thanh toán khi nhận hàng (COD) thành công", {
        checkoutId,
        shippingAddress,
        cart,
      });

      await handleFinalizeCheckout(
        checkoutId,
        "Thanh toán khi nhận hàng (COD)"
      );
    } catch (error) {
      console.error("Lỗi thanh toán COD:", error);
      alert("Thanh toán COD thất bại: " + error.message);
    }
  };

  const handleFinalizeCheckout = async (checkoutId, paymentMethod) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/checkout/${checkoutId}/finalize`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      if (response.status === 200 || response.status === 201) {
        navigate("/order-confirmation", {
          state: {
            paymentMethod,
            shippingAddress,
            checkoutId,
          },
        });
      } else {
        throw new Error("Không thể hoàn tất đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi khi hoàn tất checkout:", error);
      alert("Có lỗi xảy ra khi hoàn tất đơn hàng: " + error.message);
    }
  };

  if (loading) return <p>Đang tải giỏ hàng...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  if (
    !cart ||
    !cart.products ||
    !Array.isArray(cart.products) ||
    cart.products.length === 0
  ) {
    return <p>Giỏ hàng của bạn đang trống.</p>;
  }

  const paypalAmount = (cart.totalPrice / 25000).toFixed(2);

  const handleVNPayPayment = async () => {
    try {
      const checkoutId = await handleCreateCheckout(
        { preventDefault: () => {} },
        "VNPay",
        "unpaid"
      );

      if (!checkoutId) throw new Error("Không tạo được đơn hàng");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vnpay/create-payment`,
        {
          checkoutId,
          amount: cart.totalPrice,
          orderInfo: "Thanh toán đơn hàng Rabbit Store",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );

      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      console.error("Lỗi VNPay:", err);
      alert(
        "Thanh toán VNPay thất bại: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-10 px-6 tracking-tighter">
      {/* Form thanh toán */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl uppercase mb-6">Thanh toán</h2>
        <form onSubmit={(e) => handleCreateCheckout(e, "form_submission")}>
          <h3 className="text-lg mb-4">Chi tiết liên hệ</h3>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={user ? user.email : ""}
              className="w-full p-2 border rounded"
              disabled
            />
          </div>
          <h3 className="text-lg mb-4">Thông tin giao hàng</h3>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">Họ</label>
              <input
                type="text"
                value={shippingAddress.lastName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    lastName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Tên</label>
              <input
                type="text"
                value={shippingAddress.firstName}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    firstName: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Địa chỉ</label>
            <input
              type="text"
              value={shippingAddress.address}
              onChange={(e) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: e.target.value,
                })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">Thành phố</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({
                    ...shippingAddress,
                    city: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => {
                  setShippingAddress({
                    ...shippingAddress,
                    phone: e.target.value,
                  });
                  setPhoneError(validatePhone(e.target.value));
                }}
                className={`w-full p-2 border rounded ${
                  phoneError ? "border-red-500" : ""
                }`}
                required
                placeholder="Ví dụ: 0123456789"
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
            </div>
          </div>
          {!showPaymentOptions && ( // Conditionally render the "Tiếp tục thanh toán" button
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded disabled:bg-gray-400"
                disabled={phoneError}
              >
                Tiếp tục thanh toán
              </button>
            </div>
          )}
        </form>

        {showPaymentOptions &&
          checkoutId && ( // Show payment options only after checkoutId is set
            <div className="mt-6">
              <h3 className="text-lg mb-4">Phương thức thanh toán</h3>
              <div className="flex flex-col gap-4">
                <PayPalButton
                  amount={paypalAmount}
                  onSuccess={handlePaymentSuccess}
                  onError={(err) =>
                    alert("Thanh toán PayPal thất bại. Hãy thử lại: " + err)
                  }
                />
                <button
                  onClick={handleVNPayPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg flex items-center justify-center gap-3"
                >
                  <span>VNPay</span>
                  <span className="text-sm">
                    Thanh toán qua ATM • Thẻ • QR • Ví
                  </span>
                </button>
                <button
                  onClick={handleCODPayment}
                  className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
                >
                  Thanh toán trực tiếp (COD)
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Thanh toán PayPal sẽ được quy đổi sang USD (ước tính:{" "}
                {paypalAmount} USD)
              </p>
            </div>
          )}
      </div>

      {/* Tóm tắt đơn hàng */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg mb-4">Tóm tắt đơn hàng</h3>
        <div className="border-t py-4 mb-4">
          {cart.products.map((product, index) => (
            <div
              key={index}
              className="flex items-start justify-between py-2 border-b"
            >
              <div className="flex items-start">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-2/4 object-cover mr-4"
                />
                <div>
                  <h3 className="text-md">{product.name}</h3>
                  <p className="text-gray-500">Kích cỡ: {product.size}</p>
                  <p className="text-gray-500">Màu: {product.color}</p>
                  <p className="text-gray-500">Số lượng: {product.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                {product.discountPrice && (
                  <p className="text-xl">
                    {product.discountPrice?.toLocaleString("vi-VN")} VND
                  </p>
                )}
                <p
                  className={`text-lg text-gray-500 ${
                    product.discountPrice ? "line-through" : ""
                  }`}
                >
                  {product.price?.toLocaleString("vi-VN")} VND
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center text-lg mb-4">
          <p>Tổng (chưa tính phí giao hàng)</p>
          <p>{cart.totalPrice?.toLocaleString("vi-VN")} VND</p>
        </div>
        <div className="flex justify-between items-center text-lg">
          <p>Phí giao hàng</p>
          <p>Miễn phí</p>
        </div>
        <div className="flex justify-between items-center text-lg mt-4 border-t pt-4">
          <p>Tổng (đã tính phí giao hàng)</p>
          <p>{cart.totalPrice?.toLocaleString("vi-VN")} VND</p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
