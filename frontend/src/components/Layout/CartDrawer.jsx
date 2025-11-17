import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, removeFromCart } from "../../redux/slices/cartSlice";
import CartContents from "../Cart/CartContents";

const CartDrawer = ({ drawerOpen, toggleCartDrawer }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, guestId } = useSelector((state) => state.auth);
  const { cart, loading, error } = useSelector((state) => state.cart);
  const userId = user ? user._id : null;
  const currentGuestId =
    guestId || localStorage.getItem("guestId") || "guest_" + new Date().getTime();

  useEffect(() => {
    if (drawerOpen) {
      // Lưu guestId nếu chưa có
      if (!guestId && !userId) {
        localStorage.setItem("guestId", currentGuestId);
      }

      // Gọi fetchCart
      const promise = dispatch(
        fetchCart({
          userId: userId || undefined,
          guestId: userId ? undefined : currentGuestId,
        })
      );

      // Sau khi tải xong → tự động xóa sản phẩm hết hàng
      promise
        .unwrap()
        .then((data) => {
          const outOfStockItems = (data?.products || []).filter(
            (p) => p.countInStock === 0
          );

          if (outOfStockItems.length > 0) {
            outOfStockItems.forEach((item) => {
              dispatch(
                removeFromCart({
                  productId: item.productId,
                  size: item.size,
                  color: item.color,
                  userId,
                  guestId: userId ? undefined : currentGuestId,
                })
              );
            });

            // Thông báo người dùng
            setTimeout(() => {
              alert(
                `${outOfStockItems.length} sản phẩm đã hết hàng và bị xóa khỏi giỏ.`
              );
            }, 500);
          }
        })
        .catch(() => {
          // Lỗi đã được xử lý ở Redux
        });
    }
  }, [drawerOpen, userId, currentGuestId, dispatch]);

  const handleCheckout = () => {
    toggleCartDrawer();
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 w-3/4 sm:w-1/2 md:w-[30rem] h-full bg-white shadow-lg transform transition-transform duration-300 flex flex-col z-50 ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex justify-end p-4">
        <button onClick={toggleCartDrawer}>
          <IoMdClose className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Giỏ hàng của bạn</h2>
        {loading && <p>Đang tải giỏ hàng...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {cart && cart?.products?.length > 0 ? (
          <CartContents
            cart={cart}
            userId={userId}
            guestId={userId ? null : currentGuestId}
          />
        ) : (
          <p>Giỏ hàng của bạn đang trống.</p>
        )}
      </div>

      <div className="p-4 bg-white sticky bottom-0">
        {cart && cart?.products?.length > 0 && (
          <>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Thanh toán
            </button>
            <p className="text-sm tracking-tighter text-gray-500 mt-2 text-center">
              Giao hàng, thuế và mã giảm giá được tính ở thanh toán
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;